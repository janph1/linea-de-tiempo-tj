import React from 'react';
import { CheckCircle2, Clock, History, Sparkles, Trophy, X, XCircle } from 'lucide-react';

export default function ActivityFeed({ history, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 max-w-[90vw] bg-mahogany-900/95 backdrop-blur-md border-l-2 border-gold-600/50 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold-600/35">
        <div className="flex items-center gap-2 font-serif font-bold text-gold-400">
          <History className="w-4 h-4" /> Historial de Jugadas
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-parchment-300 hover:bg-white/10 transition"
          aria-label="Cerrar historial"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 timeline-scroll">
        {history.length === 0 ? (
          <p className="text-xs text-parchment-300/60 text-center py-8">
            Aún no hay jugadas registradas.
          </p>
        ) : (
          history.map((item) => {
            const icon =
              item.type === 'correct' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : item.type === 'wrong' ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : item.type === 'timeout' ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : item.type === 'victory' ? (
                <Trophy className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              );

            const bg =
              item.type === 'correct'
                ? 'bg-emerald-950/40 border-emerald-500/25'
                : item.type === 'wrong'
                  ? 'bg-rose-950/35 border-rose-500/25'
                  : 'bg-mahogany-950/55 border-gold-600/20';

            return (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs leading-relaxed text-parchment-100 ${bg}`}
              >
                {icon}
                <span>{item.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
