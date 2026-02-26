/**
 * utils/deck.js
 * Generates a shuffled casino shoe and sends it to the C++ backend.
 *
 * Backend card format (from main.cpp /api/shuffle handler):
 *   card[0] == 'A'          → value 11,  suit = card[0]
 *   card[0] == 'K'|'Q'|'J' → value 10,  suit = card[0]
 *   else stoi(card)         → numeric,   suit = card[0]
 *
 * So card[0] is ALWAYS the suit key in the backend's suits deck.
 * For face cards the rank IS card[0] which works perfectly.
 * For numeric cards stoi("7") = 7, card[0] = '7'.
 * The suits deck is only used for split validity (matching suits).
 *
 * Safe format: send rank first, suit second.
 *   "AH", "KD", "QC", "JS" → face/ace, card[0] = rank ✓
 *   "7H", "10D"             → numeric, stoi stops at letter ✓
 */

const SUITS = ['H', 'D', 'C', 'S'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS = { H: '♥', D: '♦', C: '♣', S: '♠' };
export const RED_SUITS    = new Set(['H', 'D']);

/** Generate a shuffled shoe of numDecks * 52 cards */
export function generateShoe(numDecks = 6) {
  const shoe = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push(rank + suit);
      }
    }
  }
  return fisherYatesShuffle(shoe);
}

/** Fisher-Yates shuffle */
function fisherYatesShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Parse a card string into display info for React components.
 * e.g. "AH" → { rank:"A", suit:"H", value:11, color:"red", symbol:"♥" }
 *      "10D" → { rank:"10", suit:"D", value:10, color:"red", symbol:"♦" }
 */
export function parseCard(cardStr) {
  if (!cardStr) return null;
  const suit  = cardStr[cardStr.length - 1];
  const rank  = cardStr.slice(0, -1);
  const color = RED_SUITS.has(suit) ? 'red' : 'black';
  const symbol = SUIT_SYMBOLS[suit] || '?';
  let value;
  if (rank === 'A')                       value = 11;
  else if (['K','Q','J'].includes(rank))  value = 10;
  else                                    value = parseInt(rank, 10);
  return { rank, suit, value, color, symbol };
}