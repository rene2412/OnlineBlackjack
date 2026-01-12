import React from "react";
import "./Balance.css";

export default function Balance({ balance, visible = true }) {
  if (!visible) return null;

  return (
    <div className="balance-panel">
      <div className="balance-label">BALANCE</div>
      <div className="balance-value">${balance}</div>
    </div>
  );
}