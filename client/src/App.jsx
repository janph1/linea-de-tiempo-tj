import React, { useEffect, useMemo, useState } from 'react';
import { History, LogOut, QrCode, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { socket } from './services/socket';
import { soundFX } from './services/sound';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import VictoryScreen from './components/VictoryScreen';
import TurnBanner from './components/TurnBanner';
import PlayersBar from './components/PlayersBar';
import TimelineBoard from './components/TimelineBoard';
import PlayerHand from './components/PlayerHand';
import RevealOverlay from './components/RevealOverlay';
import ActivityFeed from './components/ActivityFeed';
import ReactionBar from './components/ReactionBar';
import QRInviteModal from './components/QRInviteModal';

const SESSION_KEY = 'timeline_room_session';

function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [roomState, setRoomState] = useState(null);
  const [meta, setMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [lastPlacedCardId, setLastPlacedCardId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reactions, setReactions] = useState([]);

  const initialRoomCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || '').trim().toUpperCase();
  }, []);

  // Cargar metadatos del servidor (mazos + IP LAN)
  useEffect(() => {
    fetch('/api/meta')
      .then((r) => r.json())
      .then((data) => setMeta(data))
      .catch(() => {});
  }, []);

  // Eventos de Socket.io + reconexión automática
  useEffect(() => {
    const tryReconnectSession = () => {
      const saved = loadSession();
      if (saved?.roomCode && saved?.playerToken) {
        socket.emit(
          'join_room',
          {
            roomCode: saved.roomCode,
            playerToken: saved.playerToken,
            name: saved.name,
            avatar: saved.avatar,
          },
          (res) => {
            if (!res?.ok) {
              clearSession();
            }
          }
        );
      }
    };

    const onConnect = () => {
      setConnected(true);
      tryReconnectSession();
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onRoomState = (nextState) => {
      setRoomState(nextState);
      setErrorMessage('');
      // Si la carta seleccionada ya no está en mano, limpiar selección
      setSelectedCardId((prev) =>
        nextState.myHand?.some((c) => c.id === prev) ? prev : null
      );
    };

    const onCardRevealed = (reveal) => {
      if (reveal?.isCorrect && reveal?.card?.id) {
        setLastPlacedCardId(reveal.card.id);
      }
    };

    const onRoundResolved = (summary) => {
      const latest = summary?.addedCards?.[summary.addedCards.length - 1];
      if (latest?.id) setLastPlacedCardId(latest.id);
    };

    const onReactionBurst = (burst) => {
      const offsetX = Math.round((Math.random() - 0.5) * 260);
      const item = { ...burst, offsetX };
      setReactions((prev) => [...prev.slice(-18), item]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((x) => x.id !== item.id));
      }, 2200);
    };

    const onKicked = ({ message }) => {
      clearSession();
      setRoomState(null);
      setErrorMessage(message || 'Fuiste retirado de la sala.');
    };

    const onGameError = ({ message }) => {
      setErrorMessage(message || 'Ocurrió un error.');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_state', onRoomState);
    socket.on('card_revealed', onCardRevealed);
    socket.on('round_resolved', onRoundResolved);
    socket.on('reaction_burst', onReactionBurst);
    socket.on('kicked', onKicked);
    socket.on('game_error', onGameError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_state', onRoomState);
      socket.off('card_revealed', onCardRevealed);
      socket.off('round_resolved', onRoundResolved);
      socket.off('reaction_burst', onReactionBurst);
      socket.off('kicked', onKicked);
      socket.off('game_error', onGameError);
    };
  }, []);

  const emitAck = (event, payload) =>
    new Promise((resolve) => {
      socket.emit(event, payload, (res) => {
        if (!res?.ok) {
          setErrorMessage(res?.error || 'No se pudo completar la acción.');
        } else {
          setErrorMessage('');
        }
        resolve(res);
      });
    });

  const handleCreateRoom = async ({ name, avatar }) => {
    const res = await emitAck('create_room', { name, avatar });
    if (res?.ok) {
      saveSession({ roomCode: res.roomCode, playerToken: res.playerToken, name, avatar });
      window.history.replaceState({}, '', `/?room=${res.roomCode}`);
    }
  };

  const handleJoinRoom = async ({ roomCode, name, avatar }) => {
    const res = await emitAck('join_room', { roomCode, name, avatar });
    if (res?.ok) {
      saveSession({ roomCode: res.roomCode, playerToken: res.playerToken, name, avatar });
      window.history.replaceState({}, '', `/?room=${res.roomCode}`);
    }
  };

  const handleLeaveRoom = () => {
    clearSession();
    socket.emit('leave_room');
    setRoomState(null);
    setSelectedCardId(null);
    window.history.replaceState({}, '', '/');
  };

  const handlePlaceAtIndex = async (insertIndex, forcedCardId) => {
    const cardId = forcedCardId || selectedCardId || draggingCardId;
    if (!cardId) return;
    setSelectedCardId(null);
    setDraggingCardId(null);
    await emitAck('play_card', { cardId, insertIndex });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundFX.muted = next;
  };

  // Vista 1: Inicio
  if (!roomState) {
    return (
      <HomeScreen
        initialRoomCode={initialRoomCode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        errorMessage={errorMessage}
      />
    );
  }

  // Vista 2: Lobby
  if (roomState.status === 'lobby') {
    return (
      <LobbyScreen
        state={roomState}
        meta={meta}
        onUpdateSettings={(settings) => emitAck('update_settings', settings)}
        onStartGame={() => emitAck('start_game', {})}
        onKickPlayer={(targetPlayerId) => emitAck('kick_player', { targetPlayerId })}
        onLeaveRoom={handleLeaveRoom}
        errorMessage={errorMessage}
      />
    );
  }

  // Vista 3: Victoria
  if (roomState.status === 'finished') {
    return (
      <VictoryScreen
        state={roomState}
        onPlayAgain={() => emitAck('play_again', { toLobby: false })}
        onBackToLobby={() => emitAck('play_again', { toLobby: true })}
      />
    );
  }

  // Vista 4: Mesa de Juego Activa
  const isSurvival = roomState.settings?.gameMode === 'survival';
  const me = roomState.players.find((p) => p.id === roomState.myId);
  const activePlayer = roomState.players.find((p) => p.id === roomState.activePlayerId);
  const canPlay =
    roomState.status === 'playing' &&
    !me?.eliminated &&
    (isSurvival
      ? !roomState.myHasSubmitted && roomState.myHand.length > 0
      : roomState.activePlayerId === roomState.myId);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-mahogany-900">
      {/* Top Navbar */}
      <header className="shrink-0 bg-mahogany-950 border-b border-gold-600/40 px-3 md:px-6 py-2 flex items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-serif font-bold text-base md:text-lg text-gold-400 truncate">
            Línea de Tiempo
          </span>
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mahogany-800 hover:bg-gold-600/30 border border-gold-600/40 text-xs font-mono font-bold text-parchment-100 transition"
            title="Ver QR e invitar"
          >
            <QrCode className="w-3.5 h-3.5 text-gold-400" />
            {roomState.roomCode}
          </button>
          {!connected && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" /> Reconectando...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ReactionBar
              reactions={reactions}
              onSendReaction={(emoji) => socket.emit('send_reaction', { emoji })}
            />
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="p-2 rounded-xl bg-mahogany-800 hover:bg-gold-600/25 border border-gold-600/35 text-parchment-200 transition relative"
            title="Historial de jugadas"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-mahogany-800 hover:bg-gold-600/25 border border-gold-600/35 text-parchment-200 transition"
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
          </button>

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-mahogany-800 hover:bg-rose-500/25 border border-white/10 text-parchment-300 hover:text-rose-200 transition"
            title="Salir de la sala"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Banner de turno + Temporizador */}
      <TurnBanner state={roomState} />

      {/* Barra compacta de jugadores (soporta 20+ con scroll horizontal) */}
      <PlayersBar
        players={roomState.players}
        activePlayerId={roomState.activePlayerId}
        myId={roomState.myId}
        gameMode={roomState.settings?.gameMode}
      />

      {/* Mensaje de error transitorio si existe */}
      {errorMessage && (
        <div className="mx-auto mt-1.5 px-4 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs z-20">
          {errorMessage}
        </div>
      )}

      {/* Mesa Central: Línea Temporal Interactiva */}
      <TimelineBoard
        timeline={roomState.timeline}
        canPlace={canPlay}
        selectedCardId={selectedCardId}
        draggingCardId={draggingCardId}
        lastPlacedCardId={lastPlacedCardId}
        onPlaceAtIndex={handlePlaceAtIndex}
      />

      {/* Reacciones rápidas visibles en móvil */}
      <div className="md:hidden flex justify-center py-1 bg-mahogany-950/60">
        <ReactionBar
          reactions={reactions}
          onSendReaction={(emoji) => socket.emit('send_reaction', { emoji })}
        />
      </div>

      {/* Mano del Jugador (Solo Anverso) */}
      <PlayerHand
        hand={roomState.myHand}
        canPlay={canPlay}
        isSurvivalMode={isSurvival}
        hasSubmitted={roomState.myHasSubmitted}
        eliminated={Boolean(me?.eliminated)}
        activePlayerName={activePlayer?.name}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
        onDragStartCard={setDraggingCardId}
        onDragEndCard={() => setDraggingCardId(null)}
      />

      {/* Overlay de Volteo 3D / Resumen de Ronda */}
      <RevealOverlay
        lastReveal={roomState.lastReveal}
        lastRoundSummary={roomState.lastRoundSummary}
      />

      {/* Drawer de Historial de Jugadas */}
      <ActivityFeed
        history={roomState.history}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Modal QR */}
      {showQR && (
        <QRInviteModal
          roomCode={roomState.roomCode}
          lanIp={meta?.lanIp}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
