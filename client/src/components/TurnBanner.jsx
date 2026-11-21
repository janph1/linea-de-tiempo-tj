import React, { useEffect, useState } from 'react';
import { Clock, Flame, Layers, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { soundFX } from '../services/sound';

export default function TurnBanner({ state }) {
  const [remainingMs, setRemainingMs] = useState(0);
  const totalSec = Number(state.settings?.turnTimeLimit) || 0;

  useEffect(() => {
    if (!state.turnEndsAt || state.status !== 'playing') {
      setRemainingMs(0);
      return;
    }

    const offset = state.serverNow ? state.serverNow - Date.now() : 0;
    let lastTickSec = -1;

    const update = () => {
      const nowSynced = Date.now() + offset;
      const left = Math.max(0, state.turnEndsAt - nowSynced);
      setRemainingMs(left);

      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 5 && secLeft > 0 && secLeft !== lastTickSec) {
        lastTickSec = secLeft;
        soundFX.playTick();
      }
    };

    update();
    const id = setInterval(update, 150);
    return () => clearInterval(id);
  }, [state.turnEndsAt, state.serverNow, state.status]);

  const isSurvival = state.settings?.gameMode === 'survival';
  const activePlayer = state.players?.find((p) => p.id === state.activePlayerId);
  const isMyTurn = !isSurvival && state.activePlayerId === state.myId;
  const secRemaining = Math.ceil(remainingMs / 1000);
  const progressPct =
    totalSec > 0 && state.turnEndsAt ? Math.min(100, Math.max(0, (remainingMs / (totalSec * 1000)) * 100)) : 100;

  const barColor =
    progressPct > 45
      ? 'bg-gradient-to-r from-gold-500 to-gold-400'
      : progressPct > 20
        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
        : 'bg-gradient-to-r from-rose-600 to-rose-400';

  return (
    <div className="bg-mahogany-950/80 border-b border-gold-600/35 px-3 md:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Izquierda: Quién juega */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {state.suddenDeathActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600/30 border border-rose-400/60 text-rose-200 text-xs font-bold uppercase tracking-wider animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Muerte Súbita
              </span>
            ) : state.finalRoundActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/60 text-amber-200 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> ¡Última Ronda!
              </span>
            ) : null}

            {isSurvival ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-parchment-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-600/25 border border-gold-500/50 text-gold-300 text-xs font-bold">
                  <Users className="w-3.5 h-3.5" /> Ronda {state.roundNumber} Simultánea
                </span>
                <span className="text-xs text-parchment-300">
                  Enviados: <strong className="text-gold-400">{state.submittedCount}/{state.activeSurvivalCount}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">{activePlayer?.avatar || '⏳'}</span>
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-serif font-bold text-parchment-50">
                      {isMyTurn ? '¡ES TU TURNO!' : `Turno de ${activePlayer?.name || '...'}`}
                    </span>
                    {isMyTurn && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold uppercase">
                        <Sparkles className="w-3 h-3" /> Juega
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-parchment-300/70">
                    Ronda {state.roundNumber}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Derecha: Mazo restante + Temporizador */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-parchment-300 bg-white/5 px-2.5 py-1 rounded-full border border-gold-600/25">
              <Layers className="w-3.5 h-3.5 text-gold-400" />
              <span>Mazo: <strong className="text-parchment-100">{state.deckRemaining}</strong></span>
            </div>

            {totalSec > 0 ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  secRemaining <= 10 && state.status === 'playing'
                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-200 animate-pulse'
                    : 'bg-mahogany-800 border-gold-500/40 text-gold-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{state.status === 'playing' ? `${secRemaining}s` : '--'}</span>
              </div>
            ) : (
              <span className="text-[11px] text-parchment-300/60 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                Sin límite
              </span>
            )}
          </div>
        </div>

        {/* Barra de progreso del temporizador */}
        {totalSec > 0 && (
          <div className="w-full h-1.5 rounded-full bg-mahogany-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${barColor}`}
              style={{ width: `${state.status === 'playing' ? progressPct : 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
