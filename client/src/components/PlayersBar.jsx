import React from 'react';
import { Check, Crown, Flame, Heart, Layers, WifiOff } from 'lucide-react';

export default function PlayersBar({ players, activePlayerId, myId, gameMode }) {
  const isSurvival = gameMode === 'survival';

  return (
    <div className="bg-mahogany-900/75 border-b border-gold-600/25 px-3 md:px-6 py-1.5 overflow-x-auto timeline-scroll">
      <div className="flex items-center gap-2 min-w-max max-w-7xl mx-auto">
        {players.map((p) => {
          const isTurn = !isSurvival && p.id === activePlayerId;
          const isMe = p.id === myId;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs transition shrink-0 ${
                p.eliminated
                  ? 'bg-mahogany-950/60 border-white/10 opacity-45 grayscale'
                  : isTurn
                    ? 'bg-gold-600/30 border-gold-400 shadow-[0_0_12px_rgba(200,164,77,0.3)]'
                    : isMe
                      ? 'bg-parchment-100/10 border-gold-500/45'
                      : 'bg-mahogany-950/50 border-white/10'
              }`}
            >
              <span className="text-base leading-none">{p.avatar}</span>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-parchment-100 max-w-[92px] truncate">
                    {p.name}
                  </span>
                  {p.isHost && <Crown className="w-3 h-3 text-gold-400 shrink-0" />}
                  {!p.connected && <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-parchment-300/80">
                  <span className="inline-flex items-center gap-0.5 font-semibold text-gold-300">
                    <Layers className="w-2.5 h-2.5" /> {p.cardCount}
                  </span>
                  <span>{p.score} pts</span>
                  {p.streak >= 2 && (
                    <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                      <Flame className="w-2.5 h-2.5" /> {p.streak}
                    </span>
                  )}
                  {isSurvival && (
                    <span className="inline-flex items-center gap-0.5 text-rose-300 font-bold">
                      <Heart className="w-2.5 h-2.5 fill-rose-400" /> {p.lives}
                    </span>
                  )}
                </div>
              </div>
              {isSurvival && p.hasSubmitted && !p.eliminated && (
                <span
                  className="w-4 h-4 rounded-full bg-emerald-500/25 border border-emerald-400 flex items-center justify-center text-emerald-300"
                  title="Jugada enviada"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
