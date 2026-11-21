import React from 'react';
import { motion } from 'framer-motion';
import {
  Atom,
  BookOpen,
  Compass,
  Globe2,
  Landmark,
  Lightbulb,
  Microscope,
  Palette,
  Rocket,
  ScrollText,
  Sparkles,
} from 'lucide-react';

const CATEGORY_VISUALS = {
  Historia: { icon: Landmark, bg: 'from-amber-900/85 via-amber-800/80 to-stone-900/90' },
  Inventos: { icon: Lightbulb, bg: 'from-yellow-900/85 via-amber-800/80 to-amber-950/90' },
  Ciencia: { icon: Atom, bg: 'from-slate-800/90 via-indigo-950/85 to-stone-900/90' },
  Latinoamérica: { icon: Globe2, bg: 'from-emerald-900/85 via-teal-900/80 to-stone-900/90' },
  Cultura: { icon: Palette, bg: 'from-rose-950/85 via-amber-900/80 to-stone-900/90' },
  default: { icon: ScrollText, bg: 'from-amber-950/85 via-yellow-900/80 to-stone-900/90' },
};

function getVisualForCard(card) {
  if (card.imageKeyword?.includes('moon') || card.imageKeyword?.includes('space') || card.imageKeyword?.includes('webb') || card.imageKeyword?.includes('satellite') || card.imageKeyword?.includes('astronaut')) {
    return { icon: Rocket, bg: 'from-indigo-950/90 via-slate-900/85 to-amber-950/85' };
  }
  if (card.imageKeyword?.includes('dna') || card.imageKeyword?.includes('microscope') || card.imageKeyword?.includes('genetics')) {
    return { icon: Microscope, bg: 'from-teal-950/90 via-slate-900/85 to-stone-900/90' };
  }
  if (card.imageKeyword?.includes('book') || card.imageKeyword?.includes('encyclopedia') || card.imageKeyword?.includes('poetry')) {
    return { icon: BookOpen, bg: 'from-amber-950/90 via-stone-800/85 to-yellow-950/90' };
  }
  return CATEGORY_VISUALS[card.category] || CATEGORY_VISUALS.default;
}

function CardDivider() {
  return (
    <div className="flex items-center justify-center gap-1.5 my-1 px-2">
      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold-600/70 to-gold-600/80" />
      <span className="w-1.5 h-1.5 rotate-45 bg-gold-600 shrink-0" />
      <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-gold-600/70 to-gold-600/80" />
    </div>
  );
}

function CardFace({ card, revealed, size = 'md', highlight = null }) {
  const sizeClasses = {
    sm: 'w-[148px] h-[242px] p-[5px]',
    md: 'w-[178px] h-[292px] p-[6px]',
    lg: 'w-[228px] h-[372px] p-[8px]',
  }[size];

  const badgeText = revealed && card.year !== undefined ? String(card.year) : '?';
  const footerLabel = card.footerText || 'LÍNEA DE TIEMPO TESTIGOS DE JEHOVÁ';
  const visual = getVisualForCard(card);
  const IconComp = visual.icon || Compass;

  const ringClass =
    highlight === 'correct'
      ? 'ring-4 ring-emerald-400 shadow-[0_0_28px_rgba(52,211,153,0.65)]'
      : highlight === 'wrong'
        ? 'ring-4 ring-rose-500 shadow-[0_0_28px_rgba(244,63,94,0.65)]'
        : highlight === 'selected'
          ? 'ring-4 ring-gold-400 shadow-gold-glow'
          : 'shadow-card';

  return (
    <div
      className={`relative rounded-[14px] parchment-surface select-none border-[2.5px] border-gold-600 ${sizeClasses} ${ringClass} transition-shadow duration-200`}
    >
      {/* Doble borde interior dorado fiel a la carta original del PDF */}
      <div className="w-full h-full rounded-[10px] border-[1.25px] border-gold-600/85 flex flex-col justify-between px-2 pt-1.5 pb-1.5 overflow-hidden">
        {/* Insignia superior dorada con '?' o AÑO */}
        <div className="flex justify-center shrink-0 mb-1">
          <div
            className={`px-4 py-0.5 rounded-full bg-gradient-to-b from-gold-500 via-gold-600 to-gold-700 text-parchment-50 font-serif font-bold tracking-wider shadow-sm border border-gold-400/50 flex items-center justify-center ${
              size === 'lg'
                ? 'min-w-[92px] text-xl py-1'
                : size === 'sm'
                  ? 'min-w-[60px] text-sm'
                  : 'min-w-[76px] text-base'
            }`}
          >
            {badgeText}
          </div>
        </div>

        {/* Ilustración de la carta */}
        <div
          className={`relative w-full overflow-hidden rounded-[8px] border border-gold-600/35 shrink-0 bg-parchment-200 ${
            size === 'lg' ? 'h-[168px]' : size === 'sm' ? 'h-[104px]' : 'h-[128px]'
          }`}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.title}
              draggable={false}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${visual.bg} flex flex-col items-center justify-center p-2 text-parchment-100 relative`}
            >
              <div className="absolute inset-1.5 rounded-[6px] border border-gold-400/35 pointer-events-none" />
              <div className="w-12 h-12 rounded-full bg-parchment-100/15 border border-gold-400/50 flex items-center justify-center mb-1.5 backdrop-blur-sm">
                <IconComp className="w-6 h-6 text-parchment-100" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-gold-400 font-semibold">
                {card.category || 'Historia'}
              </span>
            </div>
          )}
        </div>

        {/* Divisor ornamental superior */}
        <CardDivider />

        {/* Título + Reseña (solo en reverso) */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-1 overflow-hidden">
          <h3
            className={`font-display font-bold text-gold-700 leading-tight ${
              size === 'lg'
                ? 'text-[17px]'
                : size === 'sm'
                  ? 'text-[12px] line-clamp-3'
                  : 'text-[13.5px] line-clamp-3'
            }`}
          >
            {card.title}
          </h3>

          {revealed && card.hint && (
            <p
              className={`mt-1 text-stone-800 font-sans leading-snug ${
                size === 'lg'
                  ? 'text-[12.5px] line-clamp-4'
                  : size === 'sm'
                    ? 'text-[9.5px] line-clamp-3'
                    : 'text-[10.5px] line-clamp-3'
              }`}
            >
              {card.hint}
            </p>
          )}
        </div>

        {/* Pie de carta fiel al PDF */}
        <div className="shrink-0 mt-0.5">
          <CardDivider />
          <p
            className={`text-center font-sans font-semibold uppercase tracking-[0.06em] text-gold-700 truncate ${
              size === 'lg' ? 'text-[9.5px]' : size === 'sm' ? 'text-[6.8px]' : 'text-[7.5px]'
            }`}
          >
            {footerLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Carta con soporte de volteo 3D (Anverso '?' -> Reverso Año + Reseña)
 */
export default function TimelineCard({
  card,
  revealed = false,
  flipAnimate = false,
  size = 'md',
  highlight = null,
  className = '',
  onClick,
  draggable = false,
  onDragStart,
  onDragEnd,
}) {
  if (!flipAnimate) {
    return (
      <div
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`inline-block ${className}`}
      >
        <CardFace card={card} revealed={revealed} size={size} highlight={highlight} />
      </div>
    );
  }

  return (
    <div className={`perspective-1000 inline-block ${className}`} onClick={onClick}>
      <motion.div
        className="relative preserve-3d"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Anverso (?) */}
        <div className="backface-hidden">
          <CardFace card={card} revealed={false} size={size} highlight={null} />
        </div>

        {/* Reverso (Año + Reseña) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <CardFace card={card} revealed={true} size={size} highlight={highlight} />
        </div>
      </motion.div>
    </div>
  );
}
