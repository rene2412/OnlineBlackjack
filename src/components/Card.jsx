import React, { useEffect, useRef, useCallback } from "react";
const SUIT_SYMBOLS = { H: "♥", D: "♦", C: "♣", S: "♠" };
const RED_SUITS    = new Set(["H", "D"]);

function rankDisplay(value) {
  if (value === 1 || value === 11) return "A";
  if (value === 10)                return "10";
  if (!value)                      return "";
  return String(value);
}
/**
 * Card.jsx
 * Props:
 *   rank    {string}  — "A","2"–"10","J","Q","K"
 *   suit    {string}  — "H"|"D"|"C"|"S"
 *   color   {string}  — "red"|"black"
 *   symbol  {string}  — "♥"|"♦"|"♣"|"♠"
 *   hidden  {boolean} — show card back
 *   dealing {boolean} — play deal animation
 *   delay   {number}  — animation delay ms
 *   dimmed  {boolean} — grey out (loss state)
 */
export default function Card({
  rank, suit, color="black", symbol="♠",
  hidden=false, dealing=false, delay=0, dimmed=false
}) {
  const style = dealing ? { animationDelay: `${delay}ms` } : undefined;

  if (hidden) {
    return <div className="card card--back card--deal" style={style} />;
  }

  return (
    <div
      className={[
        "card",
        color === "red" ? "card--red" : "card--black",
        dealing  ? "card--deal"   : "",
        dimmed   ? "card--dimmed" : "",
      ].filter(Boolean).join(" ")}
      style={style}
    >
      <div className="card__corner card__corner--tl">
        <span className="card__rank">{rank}</span>
        <span className="card__suit-sm">{symbol}</span>
      </div>
      <div className="card__center">{symbol}</div>
      <div className="card__corner card__corner--br">
        <span className="card__rank">{rank}</span>
        <span className="card__suit-sm">{symbol}</span>
      </div>
    </div>
  );
}