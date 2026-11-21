import { DeckManager, sanitizeCardForHand } from './DeckManager.js';

export const DEFAULT_SETTINGS = {
  initialCards: 4,
  deckTheme: 'tj', // 'tj' | 'general' | 'mixed'
  turnTimeLimit: 45, // 15 | 30 | 45 | 60 | 0 (sin límite)
  gameMode: 'classic', // 'classic' | 'survival'
  survivalLives: 3,
};

export function findCorrectIndex(timeline, year) {
  let idx = 0;
  while (idx < timeline.length && timeline[idx].year <= year) {
    idx++;
  }
  return idx;
}

export function validatePlacement(timeline, insertIndex, year) {
  const clamped = Math.max(0, Math.min(insertIndex, timeline.length));
  const prev = clamped > 0 ? timeline[clamped - 1] : null;
  const next = clamped < timeline.length ? timeline[clamped] : null;
  const afterPrev = !prev || year >= prev.year;
  const beforeNext = !next || year <= next.year;
  return afterPrev && beforeNext;
}

export class GameEngine {
  constructor(room, emitCallback) {
    this.room = room;
    this.emit = emitCallback;
    this.deck = new DeckManager(room.settings.deckTheme);
    this.timerHandle = null;
    this.revealTimeout = null;
    this.resetState();
  }

  resetState() {
    this.clearTimers();
    this.status = 'lobby'; // 'lobby' | 'playing' | 'revealing' | 'finished'
    this.timeline = [];
    this.turnOrder = [];
    this.currentTurnIdx = 0;
    this.roundNumber = 1;
    this.finalRoundActive = false;
    this.suddenDeathActive = false;
    this.suddenDeathPlayers = [];
    this.turnEndsAt = null;
    this.turnStartedAt = null;
    this.lastReveal = null;
    this.history = [];
    this.winners = [];
    this.finishReason = '';
    // Para modo Supervivencia / Simultáneo
    this.pendingSubmissions = new Map(); // playerId -> { cardId, insertIndex, submittedAt }
    this.lastRoundSummary = null;
  }

  clearTimers() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
      this.revealTimeout = null;
    }
  }

  startGame() {
    const activePlayers = this.room.getConnectedPlayers();
    if (activePlayers.length < 1) {
      throw new Error('Se necesita al menos 1 jugador conectado para iniciar.');
    }

    this.resetState();
    this.deck.reset(this.room.settings.deckTheme);

    // Calcular cartas iniciales seguras para grupos grandes (hasta 20+ jugadores)
    const maxSafePerPlayer = Math.max(
      2,
      Math.floor((this.deck.remaining - 3) / activePlayers.length)
    );
    const cardsPerPlayer = Math.min(this.room.settings.initialCards, maxSafePerPlayer);

    // Carta inicial en la mesa central
    const firstCard = this.deck.draw();
    if (!firstCard) {
      throw new Error('No hay cartas suficientes en el mazo seleccionado.');
    }
    this.timeline = [{ ...firstCard, placedBy: 'Mesa Inicial', placedAtRound: 0 }];

    // Repartir manos
    this.turnOrder = activePlayers.map((p) => p.id);
    for (const player of activePlayers) {
      player.hand = [];
      player.score = 0;
      player.streak = 0;
      player.correctCount = 0;
      player.wrongCount = 0;
      player.lives = this.room.settings.survivalLives || 3;
      player.eliminated = false;

      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = this.deck.draw();
        if (card) player.hand.push(card);
      }
    }

    this.status = 'playing';
    this.roundNumber = 1;
    this.currentTurnIdx = 0;

    this.pushHistory({
      type: 'system',
      text: `¡Comenzó la partida! Carta inicial: "${firstCard.title}" (${firstCard.year}).`,
    });

    if (cardsPerPlayer < this.room.settings.initialCards) {
      this.pushHistory({
        type: 'system',
        text: `Ajuste automático para ${activePlayers.length} jugadores: ${cardsPerPlayer} cartas iniciales por jugador.`,
      });
    }

    this.startTurnOrRoundTimer();
    this.emit('state_update');
  }

  getActivePlayerId() {
    if (this.room.settings.gameMode === 'survival') return null;
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentTurnIdx % this.turnOrder.length];
  }

  startTurnOrRoundTimer() {
    this.clearTimers();
    const limit = Number(this.room.settings.turnTimeLimit) || 0;
    const isSurvival = this.room.settings.gameMode === 'survival';
    // En modo simultáneo, si el anfitrión eligió sin límite, igual no ponemos timer forzado
    if (limit <= 0) {
      this.turnStartedAt = Date.now();
      this.turnEndsAt = null;
      return;
    }

    this.turnStartedAt = Date.now();
    this.turnEndsAt = this.turnStartedAt + limit * 1000;

    this.timerHandle = setTimeout(() => {
      if (this.status !== 'playing') return;
      if (isSurvival) {
        this.resolveSimultaneousRound(true);
      } else {
        this.handleClassicTimeout();
      }
    }, limit * 1000);
  }

  handleClassicTimeout() {
    const activeId = this.getActivePlayerId();
    const player = this.room.players.get(activeId);
    if (!player) {
      this.advanceClassicTurn();
      return;
    }

    const penaltyCard = this.deck.draw();
    if (penaltyCard) {
      player.hand.push(penaltyCard);
    }
    player.streak = 0;
    player.wrongCount += 1;

    this.pushHistory({
      type: 'timeout',
      playerName: player.name,
      playerAvatar: player.avatar,
      text: `⏱️ Se agotó el tiempo de ${player.name}. Robó 1 carta de penalización.`,
    });

    this.advanceClassicTurn();
  }

  /**
   * JUGADA EN MODO CLÁSICO (por turnos)
   */
  playClassicCard(playerId, cardId, insertIndex) {
    if (this.status !== 'playing' || this.room.settings.gameMode !== 'classic') {
      throw new Error('No es momento de colocar una carta en modo clásico.');
    }

    const activeId = this.getActivePlayerId();
    if (playerId !== activeId) {
      throw new Error('No es tu turno.');
    }

    const player = this.room.players.get(playerId);
    if (!player) throw new Error('Jugador no encontrado.');

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) throw new Error('Esa carta no está en tu mano.');

    this.clearTimers();
    const [card] = player.hand.splice(cardIdx, 1);
    const clampedIndex = Math.max(0, Math.min(Number(insertIndex) || 0, this.timeline.length));
    const isCorrect = validatePlacement(this.timeline, clampedIndex, card.year);
    const correctIndex = findCorrectIndex(this.timeline, card.year);

    // Calcular bono por rapidez
    let pointsEarned = 0;
    if (isCorrect) {
      const elapsedSec = this.turnStartedAt ? (Date.now() - this.turnStartedAt) / 1000 : 10;
      const speedBonus = Math.max(0, Math.round(50 - elapsedSec * 1.5));
      player.streak += 1;
      pointsEarned = 100 + speedBonus + (player.streak > 1 ? (player.streak - 1) * 20 : 0);
      player.score += pointsEarned;
      player.correctCount += 1;

      this.timeline.splice(clampedIndex, 0, {
        ...card,
        placedBy: player.name,
        placedAtRound: this.roundNumber,
      });

      this.pushHistory({
        type: 'correct',
        playerName: player.name,
        playerAvatar: player.avatar,
        cardTitle: card.title,
        cardYear: card.year,
        text: `${player.name} acertó: ${card.title} (${card.year})`,
      });
    } else {
      player.streak = 0;
      player.wrongCount += 1;
      this.deck.discard(card);
      // Si estamos en muerte súbita, quien falla no roba o queda fuera de los 0 cartas
      const drawn = this.deck.draw();
      if (drawn) {
        player.hand.push(drawn);
      }

      this.pushHistory({
        type: 'wrong',
        playerName: player.name,
        playerAvatar: player.avatar,
        cardTitle: card.title,
        cardYear: card.year,
        text: `${player.name} falló: ${card.title} era de ${card.year}`,
      });
    }

    // Revisar si se activa última ronda
    if (player.hand.length === 0 && !this.finalRoundActive && !this.suddenDeathActive) {
      this.finalRoundActive = true;
      this.pushHistory({
        type: 'system',
        text: `⚡ ¡${player.name} se quedó sin cartas! Se completa la ronda actual para igualar turnos.`,
      });
    }

    this.status = 'revealing';
    this.lastReveal = {
      id: `${Date.now()}-${card.id}`,
      mode: 'classic',
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      card,
      insertIndex: clampedIndex,
      correctIndex,
      isCorrect,
      pointsEarned,
    };

    this.emit('card_revealed', this.lastReveal);
    this.emit('state_update');

    // Esperar animación de volteo (3.1 segundos) antes de avanzar turno
    this.revealTimeout = setTimeout(() => {
      if (this.status !== 'revealing') return;
      this.lastReveal = null;
      this.advanceClassicTurn();
    }, 3200);
  }

  advanceClassicTurn() {
    // Limpiar jugadores desconectados o vacíos si ya no hay nadie
    const aliveOrder = this.turnOrder.filter((id) => this.room.players.has(id));
    if (aliveOrder.length === 0) {
      this.status = 'finished';
      this.emit('state_update');
      return;
    }
    this.turnOrder = aliveOrder;

    const nextIdx = this.currentTurnIdx + 1;
    const completedRound = nextIdx >= this.turnOrder.length;

    if (completedRound) {
      // Fin de ronda: revisar condición de victoria o muerte súbita
      const zeroHandPlayers = this.turnOrder
        .map((id) => this.room.players.get(id))
        .filter((p) => p && p.hand.length === 0);

      if (zeroHandPlayers.length === 1) {
        this.finishGame(
          zeroHandPlayers,
          this.suddenDeathActive
            ? `¡${zeroHandPlayers[0].name} ganó en Muerte Súbita!`
            : `¡${zeroHandPlayers[0].name} vació su mano primero!`
        );
        return;
      }

      if (zeroHandPlayers.length > 1) {
        // Muerte súbita con 1 carta extra para los empatados
        this.suddenDeathActive = true;
        this.finalRoundActive = true;
        this.suddenDeathPlayers = zeroHandPlayers.map((p) => p.id);
        this.turnOrder = [...this.suddenDeathPlayers];
        this.currentTurnIdx = 0;
        this.roundNumber += 1;

        let dealtAny = false;
        for (const p of zeroHandPlayers) {
          const extra = this.deck.draw();
          if (extra) {
            p.hand.push(extra);
            dealtAny = true;
          }
        }

        if (!dealtAny) {
          // Si ya no quedan cartas en absoluto, desempata por puntuación
          const topScore = Math.max(...zeroHandPlayers.map((p) => p.score));
          const topWinners = zeroHandPlayers.filter((p) => p.score === topScore);
          this.finishGame(topWinners, 'Mazo agotado en desempate — victoria por puntaje.');
          return;
        }

        this.pushHistory({
          type: 'system',
          text: `🔥 ¡MUERTE SÚBITA! ${zeroHandPlayers.map((p) => p.name).join(', ')} empataron con 0 cartas y reciben 1 carta extra.`,
        });

        this.status = 'playing';
        this.startTurnOrRoundTimer();
        this.emit('state_update');
        return;
      }

      // Si nadie llegó a 0 en muerte súbita (todos fallaron y robaron), siguen jugando los mismos
      this.currentTurnIdx = 0;
      this.roundNumber += 1;
    } else {
      this.currentTurnIdx = nextIdx;
    }

    this.status = 'playing';
    this.startTurnOrRoundTimer();
    this.emit('state_update');
  }

  /**
   * JUGADA EN MODO SUPERVIVENCIA / SIMULTÁNEO (ideal 2 a 20+ jugadores a la vez)
   */
  submitSimultaneousCard(playerId, cardId, insertIndex) {
    if (this.status !== 'playing' || this.room.settings.gameMode !== 'survival') {
      throw new Error('No es momento de enviar jugada simultánea.');
    }

    const player = this.room.players.get(playerId);
    if (!player || player.eliminated) {
      throw new Error('No estás activo en esta ronda.');
    }

    if (this.pendingSubmissions.has(playerId)) {
      throw new Error('Ya enviaste tu jugada para esta ronda.');
    }

    const card = player.hand.find((c) => c.id === cardId);
    if (!card) throw new Error('Carta no encontrada en tu mano.');

    const clampedIndex = Math.max(0, Math.min(Number(insertIndex) || 0, this.timeline.length));

    this.pendingSubmissions.set(playerId, {
      cardId,
      insertIndex: clampedIndex,
      submittedAt: Date.now(),
    });

    const activePlayers = this.getSurvivalActivePlayers();
    this.emit('state_update');

    // Si todos los jugadores activos ya respondieron, resolver de inmediato
    if (this.pendingSubmissions.size >= activePlayers.length) {
      this.resolveSimultaneousRound(false);
    }
  }

  getSurvivalActivePlayers() {
    return this.room.getConnectedPlayers().filter((p) => !p.eliminated && p.hand.length > 0);
  }

  resolveSimultaneousRound(wasTimeout = false) {
    this.clearTimers();
    const activePlayers = this.getSurvivalActivePlayers();
    const baseTimeline = [...this.timeline];
    const results = [];
    const cardsToInsert = [];

    for (const player of activePlayers) {
      const sub = this.pendingSubmissions.get(player.id);
      if (!sub) {
        // No respondió a tiempo
        player.lives = Math.max(0, player.lives - 1);
        player.streak = 0;
        player.wrongCount += 1;
        if (player.lives <= 0) player.eliminated = true;

        results.push({
          playerId: player.id,
          playerName: player.name,
          playerAvatar: player.avatar,
          timedOut: true,
          isCorrect: false,
          pointsEarned: 0,
          livesLeft: player.lives,
          card: null,
        });
        continue;
      }

      const cardIdx = player.hand.findIndex((c) => c.id === sub.cardId);
      if (cardIdx === -1) continue;
      const [card] = player.hand.splice(cardIdx, 1);

      const isCorrect = validatePlacement(baseTimeline, sub.insertIndex, card.year);
      let pointsEarned = 0;

      if (isCorrect) {
        const elapsedSec = this.turnStartedAt ? (sub.submittedAt - this.turnStartedAt) / 1000 : 10;
        const speedBonus = Math.max(0, Math.round(60 - elapsedSec * 1.5));
        player.streak += 1;
        pointsEarned = 100 + speedBonus + (player.streak > 1 ? (player.streak - 1) * 15 : 0);
        player.score += pointsEarned;
        player.correctCount += 1;

        cardsToInsert.push({
          ...card,
          placedBy: player.name,
          placedAtRound: this.roundNumber,
        });
      } else {
        player.lives = Math.max(0, player.lives - 1);
        player.streak = 0;
        player.wrongCount += 1;
        this.deck.discard(card);
        if (player.lives <= 0) {
          player.eliminated = true;
        } else {
          const replacement = this.deck.draw();
          if (replacement) player.hand.push(replacement);
        }
      }

      results.push({
        playerId: player.id,
        playerName: player.name,
        playerAvatar: player.avatar,
        timedOut: false,
        isCorrect,
        pointsEarned,
        livesLeft: player.lives,
        card,
      });
    }

    // Insertar las cartas acertadas ordenadas cronológicamente en la línea temporal
    for (const c of cardsToInsert) {
      const idx = findCorrectIndex(this.timeline, c.year);
      this.timeline.splice(idx, 0, c);
    }

    const correctNames = results.filter((r) => r.isCorrect).map((r) => r.playerName);
    this.pushHistory({
      type: correctNames.length > 0 ? 'correct' : 'wrong',
      text: `Ronda ${this.roundNumber}${wasTimeout ? ' (tiempo)' : ''}: ${correctNames.length}/${results.length} acertaron${correctNames.length ? ` (${correctNames.slice(0, 4).join(', ')}${correctNames.length > 4 ? '…' : ''})` : ''}.`,
    });

    this.pendingSubmissions.clear();
    this.lastRoundSummary = {
      roundNumber: this.roundNumber,
      results: results.sort((a, b) => Number(b.isCorrect) - Number(a.isCorrect) || b.pointsEarned - a.pointsEarned),
      addedCards: cardsToInsert,
    };

    this.status = 'revealing';
    this.emit('round_resolved', this.lastRoundSummary);
    this.emit('state_update');

    // Mostrar resultados de ronda por 4.5s y luego evaluar fin o siguiente ronda
    this.revealTimeout = setTimeout(() => {
      if (this.status !== 'revealing') return;
      this.lastRoundSummary = null;
      this.checkSurvivalEndOrContinue();
    }, 4500);
  }

  checkSurvivalEndOrContinue() {
    const allPlayers = Array.from(this.room.players.values());
    const survivors = allPlayers.filter((p) => !p.eliminated && p.connected);
    const emptied = survivors.filter((p) => p.hand.length === 0);

    if (emptied.length > 0) {
      const topScore = Math.max(...emptied.map((p) => p.score));
      const winners = emptied.filter((p) => p.score === topScore);
      this.finishGame(winners, '¡Completaron todas sus cartas en modo Supervivencia!');
      return;
    }

    if (survivors.length === 1 && allPlayers.length > 1) {
      this.finishGame(survivors, `¡${survivors[0].name} es el último sobreviviente!`);
      return;
    }

    if (survivors.length === 0) {
      const topScore = Math.max(...allPlayers.map((p) => p.score));
      const winners = allPlayers.filter((p) => p.score === topScore);
      this.finishGame(winners, 'Todos perdieron sus vidas — gana el mayor puntaje.');
      return;
    }

    this.roundNumber += 1;
    this.status = 'playing';
    this.startTurnOrRoundTimer();
    this.emit('state_update');
  }

  finishGame(winnerPlayers, reason) {
    this.clearTimers();
    this.status = 'finished';
    this.winners = winnerPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
    }));
    this.finishReason = reason;
    this.pushHistory({
      type: 'victory',
      text: `🏆 ${reason}`,
    });
    this.emit('state_update');
  }

  pushHistory(entry) {
    this.history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...entry,
    });
    if (this.history.length > 40) {
      this.history.length = 40;
    }
  }

  /**
   * Construye el estado personalizado para un jugador específico (ocultando manos ajenas y años de su propia mano).
   */
  getStateForPlayer(viewerId) {
    const playersList = Array.from(this.room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === this.room.hostId,
      connected: p.connected,
      cardCount: p.hand.length,
      score: p.score,
      streak: p.streak,
      lives: p.lives,
      eliminated: p.eliminated,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      hasSubmitted: this.pendingSubmissions.has(p.id),
    }));

    const viewer = this.room.players.get(viewerId);

    return {
      roomCode: this.room.code,
      hostId: this.room.hostId,
      settings: this.room.settings,
      status: this.status,
      roundNumber: this.roundNumber,
      finalRoundActive: this.finalRoundActive,
      suddenDeathActive: this.suddenDeathActive,
      suddenDeathPlayers: this.suddenDeathPlayers,
      activePlayerId: this.getActivePlayerId(),
      turnStartedAt: this.turnStartedAt,
      turnEndsAt: this.turnEndsAt,
      serverNow: Date.now(),
      deckRemaining: this.deck.remaining,
      timeline: this.timeline,
      players: playersList,
      myId: viewerId,
      myHand: viewer ? viewer.hand.map(sanitizeCardForHand) : [],
      myHasSubmitted: this.pendingSubmissions.has(viewerId),
      submittedCount: this.pendingSubmissions.size,
      activeSurvivalCount:
        this.room.settings.gameMode === 'survival' ? this.getSurvivalActivePlayers().length : 0,
      lastReveal: this.lastReveal,
      lastRoundSummary: this.lastRoundSummary,
      history: this.history,
      winners: this.winners,
      finishReason: this.finishReason,
    };
  }
}
