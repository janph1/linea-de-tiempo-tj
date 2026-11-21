import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Link2, Smartphone, X } from 'lucide-react';

export default function QRInviteModal({ roomCode, lanIp, onClose }) {
  const [copied, setCopied] = useState(false);

  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const port = window.location.port ? `:${window.location.port}` : '';
  const shareOrigin =
    isLocalhost && lanIp && lanIp !== 'localhost'
      ? `${window.location.protocol}//${lanIp}${port}`
      : window.location.origin;

  const inviteUrl = `${shareOrigin}/?room=${roomCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-mahogany-800 border-2 border-gold-600/70 shadow-2xl p-6 text-parchment-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-parchment-300 hover:bg-white/10 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-600/20 border border-gold-500/40 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Smartphone className="w-3.5 h-3.5" /> Invitar Jugadores (2 a 20+)
          </div>

          <h3 className="font-serif text-2xl font-bold text-parchment-50">
            Código de Sala: <span className="text-gold-400 tracking-widest">{roomCode}</span>
          </h3>
          <p className="text-sm text-parchment-300/80 mt-1">
            Escanea este QR con tu celular o comparte el enlace directo.
          </p>

          <div className="my-5 inline-block p-4 rounded-2xl bg-parchment-100 border-2 border-gold-600 shadow-lg">
            <QRCodeSVG
              value={inviteUrl}
              size={210}
              bgColor="#F8F2E4"
              fgColor="#2A1F17"
              level="M"
            />
          </div>

          <div className="flex items-center gap-2 bg-mahogany-950/70 border border-gold-600/40 rounded-xl p-2">
            <Link2 className="w-4 h-4 text-gold-400 shrink-0 ml-1" />
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs text-parchment-200 flex-1 outline-none truncate"
            />
            <button
              onClick={copyLink}
              className="px-3 py-1.5 rounded-lg bg-gold-600 hover:bg-gold-500 text-parchment-50 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          {isLocalhost && lanIp && lanIp !== 'localhost' && (
            <p className="text-[11px] text-parchment-300/70 mt-3">
              Red Wi-Fi detectada automáticamente (<code className="text-gold-400">{lanIp}</code>). Asegúrate de que los celulares estén en la misma red Wi-Fi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
