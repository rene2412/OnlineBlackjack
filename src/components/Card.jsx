import React, { useEffect, useRef, useCallback } from "react";
const SUIT_SYMBOLS = { H: "♥", D: "♦", C: "♣", S: "♠" };
const RED_SUITS    = new Set(["H", "D"]);

function rankDisplay(value) {
  if (value === 1 || value === 11) return "A";
  if (value === 10)                return "10";
  if (!value)                      return "";
  return String(value);
}

export default function Card({ value, suit, hidden = false, dealing = false, delay = 0, dimmed = false }) {
  if (hidden) {
    return (
      <div
        className="card card--back"
        style={dealing ? { animationDelay: `${delay}ms` } : undefined}
        data-dealing={dealing || undefined}
      />
    );
  }

  const suitSym = SUIT_SYMBOLS[suit] || "♠";
  const rank    = rankDisplay(value);
  const isRed   = suit ? RED_SUITS.has(suit) : false;

  return (
    <div
      className={[
        "card",
        isRed   ? "card--red"   : "card--black",
        dealing ? "card--deal"  : "",
        dimmed  ? "card--dimmed": "",
      ].filter(Boolean).join(" ")}
      style={dealing ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Top-left corner */}
      <div className="card__corner card__corner--tl">
        <span className="card__rank">{rank}</span>
        <span className="card__suit-sm">{suitSym}</span>
      </div>

      {/* Center pip */}
      <div className="card__center">{suitSym}</div>

      {/* Bottom-right corner (rotated) */}
      <div className="card__corner card__corner--br">
        <span className="card__rank">{rank}</span>
        <span className="card__suit-sm">{suitSym}</span>
      </div>
    </div>
  );
}