import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import TimelineCard from './TimelineCard';

function InsertSlot({
  index,
  prevYear,
  nextYear,
  active,
  draggingCardId,
  onPlace,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const rangeLabel =
    prevYear && nextYear
      ? `${prevYear}–${nextYear}`
      : !prevYear && nextYear
        ? `< ${nextYear}`
        : prevYear && !nextYear
          ? `> ${prevYear}`
          : 'Aquí';

  const handleDragOver = (e) => {
    if (!active) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!active) return;
    const droppedCardId = e.dataTransfer.getData('text/plain') || draggingCardId;
    onPlace(index, droppedCardId);
  };

  if (!active) {
    return (
      <div className="w-4 md:w-6 shrink-0 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-gold-600/20 via-gold-500/45 to-gold-600/20" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onPlace(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.95 }}
      className={`shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed transition-all duration-150 cursor-pointer select-none ${
        isDragOver
          ? 'w-28 h-[268px] border-emerald-400 bg-emerald-500/25 shadow-[0_0_25px_rgba(52,211,153,0.45)]'
          : 'w-16 md:w-20 h-[250px] border-gold-400/70 bg-gold-600/15 hover:bg-gold-500/25 hover:border-gold-400 hover:w-24'
      }`}
      title={`Colocar aquí (${rangeLabel})`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
          isDragOver
            ? 'bg-emerald-400 text-mahogany-950 scale-110'
            : 'bg-gradient-to-b from-gold-400 to-gold-600 text-mahogany-950'
        }`}
      >
        <Plus className="w-6 h-6 stroke-[2.75]" />
      </div>
      <span className="text-[10px] font-bold text-parchment-100 bg-mahogany-950/75 px-2 py-0.5 rounded-full border border-gold-500/40 whitespace-nowrap">
        {rangeLabel}
      </span>
    </motion.button>
  );
}

export default function TimelineBoard({
  timeline,
  canPlace,
  selectedCardId,
  draggingCardId,
  lastPlacedCardId,
  onPlaceAtIndex,
}) {
  const scrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const panStartX = useRef(0);
  const panScrollLeft = useRef(0);

  const isInsertionActive = Boolean(canPlace && (selectedCardId || draggingCardId));

  // Auto-centrar suavemente cuando se agrega una nueva carta
  useEffect(() => {
    if (!scrollRef.current || !lastPlacedCardId) return;
    const el = scrollRef.current.querySelector(`[data-card-id="${lastPlacedCardId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [lastPlacedCardId, timeline.length]);

  const scrollByAmount = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('[draggable="true"]')) return;
    isPanning.current = true;
    panStartX.current = e.pageX - scrollRef.current.offsetLeft;
    panScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - panStartX.current) * 1.4;
    scrollRef.current.scrollLeft = panScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const minYear = timeline[0]?.year;
  const maxYear = timeline[timeline.length - 1]?.year;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col justify-center table-felt overflow-hidden">
      {/* Barra superior flotante de controles de línea temporal (Rango + Zoom) */}
      <div className="flex items-center justify-between px-3 md:px-6 pt-2 pb-1 z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-parchment-200/90 bg-mahogany-950/65 border border-gold-600/35 px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="font-serif text-gold-400 font-bold">Línea Temporal</span>
          <span className="text-parchment-300/60">•</span>
          <span>
            {timeline.length} {timeline.length === 1 ? 'carta' : 'cartas'}
          </span>
          {minYear !== undefined && (
            <>
              <span className="text-parchment-300/60">•</span>
              <span className="font-semibold text-parchment-100">
                {minYear === maxYear ? minYear : `${minYear} — ${maxYear}`}
              </span>
            </>
          )}
        </div>

        {/* Controles de zoom y navegación rápida */}
        <div className="flex items-center gap-1.5 bg-mahogany-950/65 border border-gold-600/35 px-2 py-1 rounded-full backdrop-blur-sm">
          <button
            type="button"
            onClick={() => scrollByAmount(-340)}
            className="p-1 rounded-full hover:bg-white/10 text-parchment-200 transition"
            title="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(340)}
            className="p-1 rounded-full hover:bg-white/10 text-parchment-200 transition"
            title="Desplazar a la derecha"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-gold-600/30 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
            className="p-1 rounded-full hover:bg-white/10 text-parchment-200 transition"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-gold-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
            className="p-1 rounded-full hover:bg-white/10 text-parchment-200 transition"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 rounded-full hover:bg-white/10 text-parchment-300 transition"
              title="Restablecer zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Aviso interactivo cuando el jugador eligió una carta */}
      <AnimatePresence>
        {isInsertionActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mb-1 px-4 py-1 rounded-full bg-gold-600/90 text-parchment-50 text-xs font-semibold shadow-lg border border-gold-400/60 z-10"
          >
            ✨ Toca un botón <strong>+</strong> o arrastra tu carta hasta el lugar correcto en la línea temporal
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor horizontal desplazable de la línea temporal */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 overflow-x-auto overflow-y-hidden timeline-scroll flex items-center cursor-grab active:cursor-grabbing px-6 md:px-14 py-3"
      >
        <div
          className="flex items-center mx-auto origin-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Ranura inicial (antes de la primera carta) */}
          <InsertSlot
            index={0}
            prevYear={null}
            nextYear={timeline[0]?.year}
            active={isInsertionActive}
            draggingCardId={draggingCardId}
            onPlace={onPlaceAtIndex}
          />

          {timeline.map((card, idx) => (
            <React.Fragment key={card.id}>
              <motion.div
                layout
                data-card-id={card.id}
                initial={{ opacity: 0, scale: 0.85, y: -18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="shrink-0 flex flex-col items-center gap-1.5"
              >
                <TimelineCard
                  card={card}
                  revealed={true}
                  size="md"
                  highlight={card.id === lastPlacedCardId ? 'correct' : null}
                />
                {card.placedBy && (
                  <span className="text-[10px] text-parchment-300/75 bg-mahogany-950/60 px-2 py-0.5 rounded-full border border-gold-600/25 max-w-[168px] truncate">
                    {card.placedBy === 'Mesa Inicial' ? 'Carta inicial' : `Por ${card.placedBy}`}
                  </span>
                )}
              </motion.div>

              {/* Ranura después de cada carta */}
              <InsertSlot
                index={idx + 1}
                prevYear={card.year}
                nextYear={timeline[idx + 1]?.year}
                active={isInsertionActive}
                draggingCardId={draggingCardId}
                onPlace={onPlaceAtIndex}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
