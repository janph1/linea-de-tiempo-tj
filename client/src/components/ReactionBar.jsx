import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_EMOJIS = ['👏', '🔥', '😱', '😂', '🤔', '🎉'];

export default function ReactionBar({ reactions, onSendReaction }) {
  return (
    <>
      {/* Emojis flotantes en tiempo real */}
      <div className="pointer-events-none fixed inset-x-0 bottom-44 z-30 flex justify-center overflow-hidden h-56">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 80, x: r.offsetX, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.7, 1.25, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.1, ease: 'easeOut' }}
              className="absolute bottom-0 flex flex-col items-center"
            >
              <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
              <span className="text-[10px] font-semibold bg-mahogany-950/80 text-parchment-100 px-2 py-0.5 rounded-full border border-gold-500/40 mt-0.5 whitespace-nowrap">
                {r.playerName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Barra compacta de botones de reacción */}
      <div className="flex items-center gap-1 bg-mahogany-950/70 border border-gold-600/35 px-2 py-1 rounded-full backdrop-blur-sm">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            className="w-7 h-7 rounded-full hover:bg-gold-600/25 active:scale-125 transition flex items-center justify-center text-base"
            title={`Reaccionar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
