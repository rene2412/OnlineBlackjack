import React, { useEffect, useRef, useCallback } from "react";
/**
 * CountRing — circular hand total badge.
 * animate prop triggers slide-in on mount (used after deal completes).
 */

export default function CountRing({ count, animate = false }) {
  // Safely coerce count — guard against objects, undefined, null
  const raw = (typeof count === "number" || typeof count === "string") ? count : "?";
  const num = typeof raw === "number" ? raw : parseInt(raw, 10);

  const bust      = !isNaN(num) && num > 21;
  const blackjack = !isNaN(num) && num === 21;

  const cls = [
    "count-ring",
    bust      ? "count-ring--bust" : "",
    blackjack ? "count-ring--bj"   : "",
    animate   ? "count-ring--pop"  : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <span className="count-ring__val">{raw}</span>
    </div>
  );
}