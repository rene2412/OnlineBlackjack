import React from "react";

const CHIP_COLORS = {
  5:   "chip--green",
  25:  "chip--red",
  50:  "chip--blue",
  100: "chip--black",
  500: "chip--purple",
};

export default function Chip({ value, onClick, disabled, allIn, label }) {
  const cls = allIn
    ? "chip chip--allin"
    : ["chip", CHIP_COLORS[value] || "chip--black"].join(" ");

  return (
    <button className={cls} onClick={onClick} disabled={disabled} type="button">
       <span className="chip__label">{allIn ? "ALL IN" : `$${value}`}</span>
    </button>
  );
}