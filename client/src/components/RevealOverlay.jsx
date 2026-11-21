import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Heart, XCircle } from 'lucide-react';
import TimelineCard from './TimelineCard';
import { soundFX } from '../services/sound';

export default function RevealOverlay({ lastReveal, lastRoundSummary }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!lastReveal) {
      setFlipped(false);
      return;
    }
    setFlipped(false);
    soundFX.playFlip();
    const flipTimer = setTimeout(() => {
      setFlipped(true);
      if (lastReveal.isCorrect) {
        soundFX.playSuccess();
      } else {
        soundFX.playError();
      }
    }, 550);

    return () => clearTimeout(flipTimer);
  }, [lastReveal?.id]);

  useEffect(() => {
    if (!lastRoundSummary) return;
    soundFX.playFlip();
    const anyCorrect = lastRoundSummary.results?.some((r) => r.isCorrect);
    const t = setTimeout(() => {
      if (anyCorrect) soundFX.playSuccess();
      else soundFX.playError();
    }, 450);
    return () => clearTimeout(t);
  }, [lastRoundSummary?.roundNumber]);

  return (
    <AnimatePresence>
      {/* Overlay de Volteo en Modo Clásico */}
      {lastReveal && (
        <motion.div
          key={lastReveal.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4 max-w-sm w-full"
          >
            {/* Cabecera del jugador */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-mahogany-800/95 border border-gold-500/60 text-parchment-100 shadow-lg">
              <span className="text-xl">{lastReveal.playerAvatar}</span>
              <span className="font-semibold text-sm">{lastReveal.playerName} colocó...</span>
            </div>

            {/* Carta gigante con volteo 3D */}
            <TimelineCard
              card={lastReveal.card}
              revealed={flipped}
              flipAnimate={true}
              size="lg"
              highlight={flipped ? (lastReveal.isCorrect ? 'correct' : 'wrong') : null}
            />

            {/* Resultado tras el volteo */}
            <AnimatePresence>
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`w-full rounded-2xl px-5 py-3 text-center border-2 shadow-xl ${
                    lastReveal.isCorrect
                      ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                      : 'bg-rose-950/95 border-rose-400 text-rose-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 font-serif font-bold text-lg">
                    {lastReveal.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ¡EXACTO! ({lastReveal.card.year})
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        ¡INCORRECTO! Era {lastReveal.card.year}
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-90 mt-1">
                    {lastReveal.isCorrect
                      ? `+${lastReveal.pointsEarned} puntos • La carta queda en la línea temporal`
                      : 'Carta descartada • El jugador roba una nueva carta del mazo'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {/* Overlay de Resumen de Ronda en Modo Supervivencia / Simultáneo */}
      {!lastReveal && lastRoundSummary && (
        <motion.div
          key={`round-${lastRoundSummary.roundNumber}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl bg-mahogany-800 border-2 border-gold-600 shadow-2xl p-5 text-parchment-100 max-h-[82vh] flex flex-col"
          >
            <div className="text-center mb-3">
              <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
                Resultados Simultáneos
              </span>
              <h3 className="font-serif text-2xl font-bold text-parchment-50">
                Ronda {lastRoundSummary.roundNumber} Completada
              </h3>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 timeline-scroll">
              {lastRoundSummary.results.map((r) => (
                <div
                  key={r.playerId}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border ${
                    r.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500/40'
                      : 'bg-rose-950/50 border-rose-500/35'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{r.playerAvatar}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.playerName}</p>
                      <p className="text-xs text-parchment-300/80 truncate">
                        {r.timedOut
                          ? '⏱️ Sin respuesta a tiempo'
                          : `${r.card?.title} (${r.card?.year})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.isCorrect ? (
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        +{r.pointsEarned} pts
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                        <Heart className="w-3 h-3 fill-rose-400" /> {r.livesLeft}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
