import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  Copy,
  Crown,
  Layers,
  LogOut,
  Play,
  QrCode,
  Settings2,
  Shield,
  Sparkles,
  UserX,
  Users,
} from 'lucide-react';
import QRInviteModal from './QRInviteModal';

export default function LobbyScreen({
  state,
  meta,
  onUpdateSettings,
  onStartGame,
  onKickPlayer,
  onLeaveRoom,
  errorMessage,
}) {
  const [showQR, setShowQR] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isHost = state.myId === state.hostId;
  const settings = state.settings;
  const decks = meta?.decks || {
    tj: {
      name: 'Línea de Tiempo Testigos de Jehová',
      description: 'Las 60 cartas originales ilustradas (1870–2024).',
      count: 60,
    },
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore
    }
  };

  const update = (patch) => {
    if (!isHost) return;
    onUpdateSettings({ ...settings, ...patch });
  };

  return (
    <div className="min-h-screen table-felt p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Encabezado del Lobby */}
        <div className="rounded-3xl bg-mahogany-800/90 border-2 border-gold-600/60 p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Sala de Espera en Vivo
            </span>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-parchment-50 tracking-[0.18em]">
                {state.roomCode}
              </h2>
              <button
                type="button"
                onClick={copyCode}
                className="px-3 py-1.5 rounded-xl bg-mahogany-950/70 hover:bg-mahogany-950 border border-gold-500/40 text-xs text-parchment-200 flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copiado' : 'Copiar Código'}
              </button>
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-parchment-50 text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <QrCode className="w-4 h-4" /> Mostrar QR / Enlace
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="self-start md:self-center px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-xs text-parchment-300 hover:text-rose-200 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir de la sala
          </button>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {/* Panel de Jugadores Conectados */}
          <div className="md:col-span-5 rounded-3xl bg-mahogany-800/90 border border-gold-600/45 p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-parchment-50 flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-400" />
                Jugadores ({state.players.length})
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                En tiempo real
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 timeline-scroll flex-1">
              {state.players.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${
                    p.id === state.myId
                      ? 'bg-gold-600/20 border-gold-400/60'
                      : 'bg-mahogany-950/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-parchment-50 truncate">
                        {p.name} {p.id === state.myId && <span className="text-gold-400 text-xs">(Tú)</span>}
                      </p>
                      {p.isHost && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gold-400 font-semibold uppercase tracking-wider">
                          <Crown className="w-3 h-3" /> Anfitrión
                        </span>
                      )}
                    </div>
                  </div>

                  {isHost && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => onKickPlayer(p.id)}
                      className="p-1.5 rounded-lg text-parchment-300/60 hover:text-rose-300 hover:bg-rose-500/15 transition"
                      title={`Retirar a ${p.name}`}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {state.players.length >= 10 && settings.gameMode === 'classic' && (
              <div className="mt-3 p-2.5 rounded-xl bg-gold-600/15 border border-gold-500/40 text-[11px] text-gold-200">
                💡 Con {state.players.length} jugadores, el modo <strong>Supervivencia (Simultáneo)</strong> mantiene el ritmo súper ágil porque todos juegan a la vez.
              </div>
            )}
          </div>

          {/* Panel de Configuración del Anfitrión */}
          <div className="md:col-span-7 rounded-3xl bg-mahogany-800/90 border border-gold-600/45 p-5 md:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-parchment-50 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-gold-400" />
                Configuración de la Partida
              </h3>
              {!isHost && (
                <span className="text-[11px] text-parchment-300/70">
                  Solo el anfitrión edita
                </span>
              )}
            </div>

            {/* Mazo oficial único */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
                Mazo Oficial
              </label>
              <div className="p-3.5 rounded-2xl border bg-gold-600/20 border-gold-400/80 shadow-md flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-parchment-50">
                    {decks.tj?.name || 'Línea de Tiempo Testigos de Jehová'}
                  </p>
                  <p className="text-xs text-parchment-300/80 mt-0.5">
                    {decks.tj?.description || 'Las 60 cartas originales ilustradas (1870–2024).'}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-mahogany-950/80 border border-gold-500/40 text-gold-300">
                  {decks.tj?.count || 60} cartas
                </span>
              </div>
            </div>

            {/* Modo de Juego */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
                Modo de Juego
              </label>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => update({ gameMode: 'classic' })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    settings.gameMode === 'classic'
                      ? 'bg-gold-600/25 border-gold-400'
                      : 'bg-mahogany-950/50 border-white/10 hover:border-gold-600/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-parchment-50">
                    <Sparkles className="w-4 h-4 text-gold-400" /> Clásico (Por Turnos)
                  </div>
                  <p className="text-[11px] text-parchment-300/75 mt-1">
                    Gana el primero en quedarse sin cartas. Ronda justa y muerte súbita si hay empate.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => update({ gameMode: 'survival' })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    settings.gameMode === 'survival'
                      ? 'bg-gold-600/25 border-gold-400'
                      : 'bg-mahogany-950/50 border-white/10 hover:border-gold-600/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-parchment-50">
                    <Shield className="w-4 h-4 text-gold-400" /> Supervivencia / Puntos
                  </div>
                  <p className="text-[11px] text-parchment-300/75 mt-1">
                    Ideal para grupos grandes (10–20+): todos juegan a la vez con 3 vidas y puntos por velocidad.
                  </p>
                </button>
              </div>
            </div>

            {/* Cartas iniciales y Temporizador */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
                  <Layers className="w-3.5 h-3.5" /> Cartas Iniciales
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!isHost}
                      onClick={() => update({ initialCards: n })}
                      className={`py-2 rounded-xl text-sm font-bold border transition ${
                        settings.initialCards === n
                          ? 'bg-gold-600 border-gold-400 text-parchment-50'
                          : 'bg-mahogany-950/60 border-white/10 text-parchment-200 hover:border-gold-500/40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
                  <Clock className="w-3.5 h-3.5" /> Tiempo por Turno
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { v: 30, l: '30s' },
                    { v: 45, l: '45s' },
                    { v: 60, l: '60s' },
                    { v: 0, l: 'Libre' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      disabled={!isHost}
                      onClick={() => update({ turnTimeLimit: opt.v })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        settings.turnTimeLimit === opt.v
                          ? 'bg-gold-600 border-gold-400 text-parchment-50'
                          : 'bg-mahogany-950/60 border-white/10 text-parchment-200 hover:border-gold-500/40'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Botón Iniciar Partida */}
            {isHost ? (
              <button
                type="button"
                onClick={onStartGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:brightness-110 text-white font-serif font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition"
              >
                <Play className="w-5 h-5 fill-current" /> Iniciar Partida ({state.players.length}{' '}
                {state.players.length === 1 ? 'jugador' : 'jugadores'})
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-mahogany-950/70 border border-gold-600/30 text-center text-sm text-parchment-300">
                ⏳ Esperando a que el anfitrión inicie la partida...
              </div>
            )}
          </div>
        </div>
      </div>

      {showQR && (
        <QRInviteModal
          roomCode={state.roomCode}
          lanIp={meta?.lanIp}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
