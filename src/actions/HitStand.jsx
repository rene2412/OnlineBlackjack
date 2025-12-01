import React from "react";
export default function HitOrStand() {
    async function handleClick(action) {
    try {
      await fetch('/api/current-player-decision', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      console.log("Sent action:", action);

    } catch (error) {
      console.error("ERROR:", error);
    }
  }
        return (
        <div className="Decisions">
              <div style={{ display: 'flex', gap: '20px' }}>
            <button className="hit" onClick={() => handleClick("hit")}>Hit</button>
            <button className="stand" onClick={() => handleClick("stand")}>Stand</button>
            </div>
        </div> 
        );
    }