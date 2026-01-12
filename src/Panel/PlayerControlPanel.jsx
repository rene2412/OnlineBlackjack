import React, { useState, useEffect } from "react";
import "./PlayerControlPanel.css";

export default function PlayerControlPanel({
  playerCount,
  dealerCount,
  canAct,
  canSplit,
  isChoosingSplit,
  gameStart,
  splitCounts = [], // for future split hand support
  children, // will contain HitOrStand, Split, Insurance components
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gameStart) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, 3500); // 3500ms delay after game start

    return () => clearTimeout(timer);
  }, [gameStart]);

  if (!visible) return null;

  return (
    <>
      <div className="dealer-count-box">
        <div className="counter-box dealer-counter">
          <div className="counter-label">Dealer</div>
          <div className="counter-value">{dealerCount}</div>
        </div>
      </div>

      <div className="player-control-panel">
        <div className="player-count-section">
          <div className="counter-box main-counter">
            <div className="counter-label">Your Hand</div>
            <div className="counter-value">{playerCount}</div>
          </div>

          {splitCounts.length > 0 && (
            <div className="split-counters">
              {splitCounts.map((count, index) => (
                <div key={index} className="counter-box split-counter">
                  <div className="counter-label">Hand {index + 2}</div>
                  <div className="counter-value">{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="action-buttons-wrapper">
          {children}
        </div>
      </div>
    </>
  );
}