import React from "react";
import "./chips.css";

export default function Chip({ value, color, x, y, onClick }) {
  return (
    <div
      className="chip_wrapper"
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onClick={onClick}
    >
    <div className="chip">
  <div className={`chip-face chip-front chip-${color}`}>
    <span className="chip-value">{value}</span>
  </div>
  <div className={`chip-face chip-back chip-${color}`}>
    <span className="chip-value">{value}</span>
        </div>
    </div>
</div>
  );
}

