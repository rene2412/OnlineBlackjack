import React, { useEffect, useRef, useCallback } from "react";
export default function CountRing({ count, hidden = false }) {
  const bust      = !hidden && count > 21;
  const blackjack = !hidden && count === 21;

  const cls = [
    "count-ring",
    bust      ? "count-ring--bust" : "",
    blackjack ? "count-ring--bj"   : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <span className="count-ring__val">
        {hidden ? "?" : (count || "–")}
      </span>
    </div>
  );
}