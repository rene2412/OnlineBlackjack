const SUITS = ['H', 'D', 'C', 'S'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS = { H: '♥', D: '♦', C: '♣', S: '♠' };
export const RED_SUITS    = new Set(['H', 'D']);

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a shuffled 6-deck shoe as string array: ["AH","KD","7C",...] */
export function generateShoe(numDecks = 6) {
  const shoe = [];
  for (let d = 0; d < numDecks; d++)
    for (const suit of SUITS)
      for (const rank of RANKS)
        shoe.push(rank + suit);
  return shuffle(shoe);
}

/**
 * Parse a card string into display data.
 * "AH"  → { rank:"A",  suit:"H", value:11, color:"red",   symbol:"♥" }
 * "10D" → { rank:"10", suit:"D", value:10, color:"red",   symbol:"♦" }
 * "KS"  → { rank:"K",  suit:"S", value:10, color:"black", symbol:"♠" }
 * "7C"  → { rank:"7",  suit:"C", value:7,  color:"black", symbol:"♣" }
 */
export function parseCard(cardStr) {
  if (!cardStr) return null;
  // Last char is always suit, everything before is rank
  const suit   = cardStr[cardStr.length - 1];
  const rank   = cardStr.slice(0, -1);
  const color  = RED_SUITS.has(suit) ? 'red' : 'black';
  const symbol = SUIT_SYMBOLS[suit] || '?';
  let value;
  if (rank === 'A')                        value = 11;
  else if (['K','Q','J'].includes(rank))   value = 10;
  else                                     value = parseInt(rank, 10);
  return { rank, suit, value, color, symbol };
}