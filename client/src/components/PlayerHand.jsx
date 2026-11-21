import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Hand, Lock, Sparkles } from 'lucide-react';
import TimelineCard from './TimelineCard';
import { soundFX } from '../services/sound';

export default function PlayerHand({
  hand,
  canPlay,
  isSurvivalMode,
  hasSubmitted,
  eliminated,
  activePlayerName,
  selectedCardId,
  onSelectCard,
  onDragStartCard,
  onDragEndCard,
}) {
  const handleCardClick = (cardId) => {
    if (!canPlay) return;
    soundFX.playSelect();
    onSelectCard(selectedCardId === cardId ? null : cardId);
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-mahogany-950 via-mahogany-900/95 to-mahogany-900/80 border-t-2 border-gold-600/45 px-3 md:px-6 pt-2.5 pb-3 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] z-20">
      {/* Encabezado de la mano */}
      <div className="flex items-center justify-between gap-2 mb-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-gold-400">
            <Hand className="w-3.5 h-3.5" /> Tu Mano ({hand.length})
          </span>
          {canPlay ? (
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3" />
              {selectedCardId
                ? 'Ahora toca un "+" en la mesa'
                : 'Elige o arrastra una carta'}
            </span>
          ) : eliminated ? (
            <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2.5 py-0.5 rounded-full">
              Eliminado — observando partida
            </span>
          ) : isSurvivalMode && hasSubmitted ? (
            <span className="inline-flex items-center gap-1 text-[11px] bg-gold-500/20 text-gold-300 border border-gold-400/40 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> ¡Jugada enviada! Esperando al resto...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/5 text-parchment-300/80 border border-white/10 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> Turno de {activePlayerName || '...'}
            </span>
          )}
        </div>

        <span className="hidden sm:inline text-[11px] text-parchment-300/60">
          Año oculto (?) hasta colocar en mesa
        </span>
      </div>

      {/* Cartas de la mano (SOLO ANVERSO) */}
      <div className="overflow-x-auto timeline-scroll pb-1">
        <div className="flex items-end justify-start sm:justify-center gap-3 px-2 min-w-max mx-auto pt-2">
          {hand.length === 0 ? (
            <div className="py-8 px-6 text-center text-sm text-gold-400 font-serif">
              🎉 ¡Ya no tienes cartas en la mano!
            </div>
          ) : (
            hand.map((card) => {
              const isSelected = selectedCardId === card.id;
              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{
                    opacity: canPlay ? 1 : 0.78,
                    y: isSelected ? -14 : 0,
                    scale: isSelected ? 1.04 : 1,
                  }}
                  whileHover={canPlay ? { y: isSelected ? -16 : -8 } : {}}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className={canPlay ? 'cursor-pointer' : 'cursor-not-allowed'}
                >
                  <TimelineCard
                    card={card}
                    revealed={false}
                    size="sm"
                    highlight={isSelected ? 'selected' : null}
                    onClick={() => handleCardClick(card.id)}
                    draggable={canPlay}
                    onDragStart={(e) => {
                      if (!canPlay) return;
                      e.dataTransfer.setData('text/plain', card.id);
                      e.dataTransfer.effectAllowed = 'move';
                      onSelectCard(card.id);
                      onDragStartCard(card.id);
                    }}
                    onDragEnd={() => onDragEndCard()}
                  />
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
