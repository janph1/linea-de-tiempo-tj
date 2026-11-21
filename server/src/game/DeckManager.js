import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tjCardsPath = path.join(__dirname, '..', 'data', 'tjCards.json');

const TJ_CARDS = JSON.parse(fs.readFileSync(tjCardsPath, 'utf-8'));

export const DECK_THEMES = {
  tj: {
    id: 'tj',
    name: 'Línea de Tiempo Testigos de Jehová',
    description: 'Las 60 cartas originales ilustradas (1870–2024).',
    count: TJ_CARDS.length,
    coverImage: '/cards/tj-cover.jpg',
  },
};

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Oculta el año y la reseña histórica para cartas en la mano del jugador (anti-trampa).
 */
export function sanitizeCardForHand(card) {
  return {
    id: card.id,
    title: card.title,
    category: card.category,
    imageUrl: card.imageUrl || null,
    imageKeyword: card.imageKeyword || null,
    deck: card.deck || 'tj',
    footerText: card.footerText || 'LÍNEA DE TIEMPO TESTIGOS DE JEHOVÁ',
  };
}

export class DeckManager {
  constructor(theme = 'tj') {
    this.theme = theme;
    this.drawPile = [];
    this.discardPile = [];
    this.reset(theme);
  }

  reset(theme = 'tj') {
    this.theme = 'tj';
    this.drawPile = shuffleArray(TJ_CARDS);
    this.discardPile = [];
  }

  draw() {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length === 0) {
        return null;
      }
      this.drawPile = shuffleArray(this.discardPile);
      this.discardPile = [];
    }
    return this.drawPile.pop();
  }

  discard(card) {
    if (card) {
      this.discardPile.push(card);
    }
  }

  get remaining() {
    return this.drawPile.length;
  }

  get totalAvailable() {
    return this.drawPile.length + this.discardPile.length;
  }
}
