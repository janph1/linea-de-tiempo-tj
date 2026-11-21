import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, PlusCircle, Sparkles, Users } from 'lucide-react';

const AVATARS = [
  '🧭', '📜', '⏳', '🕊️', '📖', '🌟', '🌿', '🦉',
  '🦁', '🦊', '🐝', '🌍', '⛵', '🏛️', '🎵', '✨',
];

export default function HomeScreen({ initialRoomCode = '', onCreateRoom, onJoinRoom, errorMessage }) {
  const [mode, setMode] = useState(initialRoomCode ? 'join' : 'create');
  const [name, setName] = useState(() => localStorage.getItem('timeline_player_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('timeline_player_avatar') || '🧭');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setMode('join');
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    localStorage.setItem('timeline_player_name', cleanName);
    localStorage.setItem('timeline_player_avatar', avatar);

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await onCreateRoom({ name: cleanName, avatar });
      } else {
        if (!roomCode.trim()) return;
        await onJoinRoom({ roomCode: roomCode.trim().toUpperCase(), name: cleanName, avatar });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 table-felt">
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center">
        {/* Columna izquierda: Presentación + Carta Portada del PDF */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-600/20 border border-gold-500/45 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Juego Multijugador • 2 a 20+ Jugadores
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-parchment-50 leading-tight">
            Línea de Tiempo
            <span className="block text-gold-400 text-2xl md:text-3xl mt-1">
              Testigos de Jehová
            </span>
          </h1>

          <p className="mt-4 text-parchment-200/80 text-sm md:text-base max-w-md leading-relaxed">
            Ordena hitos históricos cronológicamente en tiempo real desde celulares o PC con las{' '}
            <strong className="text-parchment-50">60 cartas ilustradas oficiales</strong> (1870–2024).
          </p>

          {/* Vista previa elegante de la carta portada extraída del PDF */}
          <div className="mt-6 flex items-center gap-5">
            <motion.div
              whileHover={{ rotate: -2, scale: 1.04 }}
              className="w-28 md:w-32 rounded-xl overflow-hidden border-2 border-gold-500 shadow-card shrink-0 bg-parchment-100"
            >
              <img
                src="/cards/tj-cover.jpg"
                alt="Portada Línea de Tiempo Testigos de Jehová"
                className="w-full h-auto block"
              />
            </motion.div>

            <div className="space-y-2.5 text-left text-xs text-parchment-200/85">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Salas con código corto y <strong>QR instantáneo</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Modo <strong>Clásico</strong> (turnos + muerte súbita) y <strong>Supervivencia</strong> (simultáneo)</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Volteo 3D, reacciones en vivo e historial de jugadas</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Columna derecha: Formulario Pergamino / Madera */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-6"
        >
          <div className="rounded-3xl bg-mahogany-800/95 border-2 border-gold-600/60 shadow-2xl p-6 md:p-7 backdrop-blur-md">
            {/* Tabs Crear / Unirse */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-mahogany-950/70 border border-gold-600/30 mb-6">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  mode === 'create'
                    ? 'bg-gradient-to-b from-gold-500 to-gold-600 text-parchment-50 shadow-md'
                    : 'text-parchment-300 hover:text-parchment-100'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Crear Sala
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  mode === 'join'
                    ? 'bg-gradient-to-b from-gold-500 to-gold-600 text-parchment-50 shadow-md'
                    : 'text-parchment-300 hover:text-parchment-100'
                }`}
              >
                <Users className="w-4 h-4" /> Unirse a Sala
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-1.5">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  maxLength={22}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Jazmín, Sofía, Daniel..."
                  className="w-full px-4 py-3 rounded-xl bg-mahogany-950/80 border border-gold-600/40 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 outline-none text-parchment-50 placeholder:text-parchment-300/40"
                />
              </div>

              {/* Código de sala (solo en modo Unirse) */}
              {mode === 'join' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-1.5">
                    Código de Sala
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Ej. K7P3M"
                    className="w-full px-4 py-3 rounded-xl bg-mahogany-950/80 border border-gold-600/40 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 outline-none text-parchment-50 font-mono text-lg tracking-[0.25em] uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-parchment-300/40"
                  />
                </div>
              )}

              {/* Selector de Avatar */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
                  Elige tu Avatar
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {AVATARS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAvatar(item)}
                      className={`h-10 rounded-xl text-xl flex items-center justify-center transition border ${
                        avatar === item
                          ? 'bg-gold-600/35 border-gold-400 scale-110 shadow-md'
                          : 'bg-mahogany-950/50 border-white/10 hover:border-gold-500/50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim() || (mode === 'join' && !roomCode.trim())}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:brightness-110 disabled:opacity-50 text-parchment-50 font-serif font-bold text-base tracking-wide shadow-lg flex items-center justify-center gap-2 transition"
              >
                {submitting
                  ? 'Conectando...'
                  : mode === 'create'
                    ? 'Crear Nueva Sala'
                    : 'Entrar a la Sala'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
