import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, RotateCcw, Settings2, Trophy } from 'lucide-react';
import { soundFX } from '../services/sound';

export default function VictoryScreen({ state, onPlayAgain, onBackToLobby }) {
  const isHost = state.myId === state.hostId;
  const sortedPlayers = [...state.players].sort((a, b) => {
    const aWin = state.winners.some((w) => w.id === a.id) ? 1 : 0;
    const bWin = state.winners.some((w) => w.id === b.id) ? 1 : 0;
    if (bWin !== aWin) return bWin - aWin;
    if (state.settings.gameMode === 'classic' && a.cardCount !== b.cardCount) {
      return a.cardCount - b.cardCount;
    }
    return b.score - a.score;
  });

  useEffect(() => {
    soundFX.playVictory();
  }, []);

  return (
    <div className="min-h-screen table-felt flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl bg-mahogany-800/95 border-2 border-gold-500 shadow-2xl p-6 md:p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-b from-gold-400 to-gold-700 flex items-center justify-center shadow-gold-glow mb-4">
          <Trophy className="w-9 h-9 text-parchment-50" />
        </div>

        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">
          ¡Partida Finalizada!
        </span>

        <h2 className="font-serif text-3xl md:text-4xl font-bold text-parchment-50 mt-1">
          {state.winners.length === 1
            ? `${state.winners[0].avatar} ${state.winners[0].name}`
            : state.winners.map((w) => `${w.avatar} ${w.name}`).join(' & ')}
        </h2>
        <p className="text-sm text-parchment-200/85 mt-1">{state.finishReason}</p>

        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-mahogany-950/70 border border-gold-600/35 text-xs text-gold-300">
          Línea temporal final: <strong>{state.timeline.length} cartas</strong> • {state.roundNumber} rondas
        </div>

        {/* Tabla de posiciones */}
        <div className="mt-6 space-y-2 text-left max-h-72 overflow-y-auto pr-1 timeline-scroll">
          {sortedPlayers.map((p, idx) => {
            const isWinner = state.winners.some((w) => w.id === p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border ${
                  isWinner
                    ? 'bg-gold-600/25 border-gold-400 shadow-md'
                    : 'bg-mahogany-950/60 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center font-serif font-bold text-gold-400">
                    #{idx + 1}
                  </span>
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-parchment-50 truncate flex items-center gap-1.5">
                      {p.name}
                      {isWinner && <Award className="w-4 h-4 text-gold-400 shrink-0" />}
                    </p>
                    <p className="text-[11px] text-parchment-300/75">
                      ✅ {p.correctCount} aciertos • ❌ {p.wrongCount} fallos • {p.cardCount} en mano
                    </p>
                  </div>
                </div>
                <span className="font-serif font-bold text-gold-300 text-sm shrink-0">
                  {p.score} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Botones de Volver a jugar manteniendo a todos en la sala */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:brightness-110 text-parchment-50 font-serif font-bold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <RotateCcw className="w-4 h-4" /> Volver a Jugar (Misma Sala)
              </button>
              <button
                type="button"
                onClick={onBackToLobby}
                className="py-3.5 px-5 rounded-2xl bg-mahogany-950/80 hover:bg-mahogany-950 border border-gold-600/45 text-parchment-200 font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <Settings2 className="w-4 h-4" /> Cambiar Ajustes
              </button>
            </>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-mahogany-950/70 border border-gold-600/35 text-sm text-parchment-300">
              ⏳ Esperando al anfitrión para volver a jugar en esta sala...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
