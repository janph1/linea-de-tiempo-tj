import crypto from 'crypto';
import { DEFAULT_SETTINGS, GameEngine } from './GameEngine.js';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

class Room {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.hostId = null;
    this.players = new Map(); // playerId -> Player
    this.socketToPlayer = new Map(); // socketId -> playerId
    this.settings = { ...DEFAULT_SETTINGS };
    this.createdAt = Date.now();
    this.engine = new GameEngine(this, (event, payload) => {
      if (event === 'state_update') {
        this.broadcastState();
      } else {
        this.io.to(this.code).emit(event, payload);
      }
    });
  }

  getConnectedPlayers() {
    return Array.from(this.players.values()).filter((p) => p.connected);
  }

  addOrReconnectPlayer({ socketId, name, avatar, playerToken }) {
    // 1) Reconexión con token existente
    if (playerToken) {
      for (const player of this.players.values()) {
        if (player.token === playerToken) {
          if (player.socketId) {
            this.socketToPlayer.delete(player.socketId);
          }
          player.socketId = socketId;
          player.connected = true;
          if (name && this.engine.status === 'lobby') player.name = name.trim().slice(0, 22);
          if (avatar && this.engine.status === 'lobby') player.avatar = avatar;
          this.socketToPlayer.set(socketId, player.id);
          return { player, reconnected: true };
        }
      }
    }

    // 2) Nuevo jugador
    if (this.engine.status !== 'lobby') {
      throw new Error('La partida ya comenzó. Espera a la siguiente ronda o pide al anfitrión volver al lobby.');
    }

    const cleanName = (name || 'Jugador').trim().slice(0, 22) || 'Jugador';
    // Evitar nombres duplicados exactos
    const existingNames = new Set(Array.from(this.players.values()).map((p) => p.name.toLowerCase()));
    let finalName = cleanName;
    let suffix = 2;
    while (existingNames.has(finalName.toLowerCase())) {
      finalName = `${cleanName} ${suffix++}`;
    }

    const playerId = crypto.randomBytes(6).toString('hex');
    const token = crypto.randomBytes(12).toString('hex');
    const player = {
      id: playerId,
      token,
      socketId,
      name: finalName,
      avatar: avatar || '🧭',
      connected: true,
      hand: [],
      score: 0,
      streak: 0,
      lives: this.settings.survivalLives,
      eliminated: false,
      correctCount: 0,
      wrongCount: 0,
    };

    this.players.set(playerId, player);
    this.socketToPlayer.set(socketId, playerId);

    if (!this.hostId) {
      this.hostId = playerId;
    }

    return { player, reconnected: false };
  }

  handleDisconnect(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;
    this.socketToPlayer.delete(socketId);

    const player = this.players.get(playerId);
    if (!player) return null;

    player.connected = false;
    player.socketId = null;

    // Si estamos en lobby, eliminar al jugador tras breve tiempo o mantener desconectado;
    // para experiencia limpia en lobby lo quitamos directo si se desconecta voluntariamente,
    // pero en partida lo conservamos para que pueda reconectarse sin perder sus cartas.
    if (this.engine.status === 'lobby') {
      this.players.delete(playerId);
    }

    // Reasignar host si es necesario
    if (this.hostId === playerId) {
      const nextConnected = this.getConnectedPlayers()[0];
      this.hostId = nextConnected ? nextConnected.id : null;
    }

    // Si era el turno activo en modo clásico y se desconectó, no bloquear — el timer sigue o se pasa si no hay timer
    if (
      this.engine.status === 'playing' &&
      this.settings.gameMode === 'classic' &&
      this.engine.getActivePlayerId() === playerId &&
      Number(this.settings.turnTimeLimit) === 0
    ) {
      this.engine.pushHistory({
        type: 'system',
        text: `${player.name} se desconectó durante su turno. Se pasa el turno.`,
      });
      this.engine.advanceClassicTurn();
    } else {
      this.broadcastState();
    }

    return player;
  }

  kickPlayer(requesterId, targetPlayerId) {
    if (requesterId !== this.hostId) throw new Error('Solo el anfitrión puede expulsar jugadores.');
    if (targetPlayerId === this.hostId) throw new Error('No puedes expulsarte a ti mismo.');

    const target = this.players.get(targetPlayerId);
    if (!target) return;

    if (target.socketId) {
      const targetSocket = this.io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('kicked', { message: 'El anfitrión te retiró de la sala.' });
        targetSocket.leave(this.code);
      }
      this.socketToPlayer.delete(target.socketId);
    }

    this.players.delete(targetPlayerId);
    this.broadcastState();
  }

  updateSettings(requesterId, newSettings) {
    if (requesterId !== this.hostId) {
      throw new Error('Solo el anfitrión puede cambiar la configuración.');
    }
    if (this.engine.status !== 'lobby') {
      throw new Error('Solo puedes cambiar ajustes en el lobby.');
    }

    const allowedTimes = [0, 15, 30, 45, 60];
    const allowedDecks = ['tj'];
    const allowedModes = ['classic', 'survival'];

    if (newSettings.initialCards !== undefined) {
      this.settings.initialCards = Math.max(2, Math.min(8, Number(newSettings.initialCards) || 4));
    }
    if (allowedDecks.includes(newSettings.deckTheme)) {
      this.settings.deckTheme = newSettings.deckTheme;
    }
    if (allowedTimes.includes(Number(newSettings.turnTimeLimit))) {
      this.settings.turnTimeLimit = Number(newSettings.turnTimeLimit);
    }
    if (allowedModes.includes(newSettings.gameMode)) {
      this.settings.gameMode = newSettings.gameMode;
    }
    if (newSettings.survivalLives !== undefined) {
      this.settings.survivalLives = Math.max(1, Math.min(5, Number(newSettings.survivalLives) || 3));
    }

    this.broadcastState();
  }

  returnToLobby(requesterId) {
    if (requesterId !== this.hostId) {
      throw new Error('Solo el anfitrión puede volver al lobby.');
    }
    // Eliminar desconectados al regresar al lobby
    for (const [id, p] of this.players.entries()) {
      if (!p.connected) {
        this.players.delete(id);
      } else {
        p.hand = [];
        p.score = 0;
        p.streak = 0;
        p.eliminated = false;
        p.lives = this.settings.survivalLives;
      }
    }
    this.engine.resetState();
    this.broadcastState();
  }

  broadcastState() {
    for (const player of this.players.values()) {
      if (player.connected && player.socketId) {
        const state = this.engine.getStateForPlayer(player.id);
        this.io.to(player.socketId).emit('room_state', state);
      }
    }
  }

  isEmpty() {
    return this.getConnectedPlayers().length === 0;
  }
}

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code -> Room
    this.socketRoom = new Map(); // socketId -> code

    // Limpieza periódica de salas vacías abandonadas (> 20 min)
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (room.isEmpty() && now - room.createdAt > 20 * 60 * 1000) {
          room.engine.clearTimers();
          this.rooms.delete(code);
        }
      }
    }, 5 * 60 * 1000);
  }

  createRoom() {
    let code = generateRoomCode(5);
    while (this.rooms.has(code)) {
      code = generateRoomCode(5);
    }
    const room = new Room(code, this.io);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(String(code).trim().toUpperCase()) || null;
  }

  getRoomBySocket(socketId) {
    const code = this.socketRoom.get(socketId);
    return code ? this.rooms.get(code) || null : null;
  }

  joinSocketToRoom(socket, room, player) {
    // Salir de cualquier sala previa
    const prevCode = this.socketRoom.get(socket.id);
    if (prevCode && prevCode !== room.code) {
      socket.leave(prevCode);
    }
    socket.join(room.code);
    this.socketRoom.set(socket.id, room.code);
    room.broadcastState();
  }

  handleDisconnect(socketId) {
    const room = this.getRoomBySocket(socketId);
    this.socketRoom.delete(socketId);
    if (!room) return;
    room.handleDisconnect(socketId);
  }
}
