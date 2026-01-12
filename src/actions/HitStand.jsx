
import React, { useEffect, useState } from "react";

export default function HitOrStand({ canAct }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canAct) {
      setVisible(false);
      return;
    }

    // delay appearance to let cards deal
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [canAct]);

  async function handleClick(action) {
    if (!canAct) return; // prevent accidental clicks

    try {
      await fetch("/api/current-player-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
    } catch (error) {
      console.error("ERROR:", error);
    }
  }

return (
     <div className="hit-stand-buttons">
      <button 
        className="split-btn player-action yes" 
        disabled={!canAct} 
        onClick={() => handleClick("hit")}
      >
        HIT
      </button>
      <button 
        className="split-btn player-action no" 
        disabled={!canAct} 
        onClick={() => handleClick("stand")}
      >
        STAND
      </button>
    </div>
  );
}
