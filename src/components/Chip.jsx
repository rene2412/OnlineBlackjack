import React, { useEffect, useRef, useCallback } from "react";
const CHIP_COLORS = {
  5:   "chip--green",
  25:  "chip--red",
  50:  "chip--blue",
  100: "chip--black",
  500: "chip--purple",
};

export default function Chip({ value, onClick, disabled }) {
  return (
    <button
      className={["chip", CHIP_COLORS[value] || "chip--black"].join(" ")}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="chip__label">${value}</span>
    </button>
  );
}