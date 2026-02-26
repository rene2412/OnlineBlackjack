import React, { useState, useEffect } from "react";
import "./PlayerControlPanel.css";

export default function PlayerControlPanel({
  playerCount,
  dealerCount,
  canAct,
  canSplit,
  isChoosingSplit,
  gameStart,
  splitCounts = [],
  children,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gameStart) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, 3500);

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
          {splitCounts.length > 0 ? (
            <div className="split-counters-container">
              {splitCounts.map((counter, index) => (
                <div key={index} className={`counter-box split-counter ${counter.status || ''}`}>
                  <div className="counter-label">Hand {counter.hand + 1}</div>
                  <div className="counter-value">{counter.count}</div>
                  {counter.status === 'bust' && <div className="counter-overlay">✕</div>}
                  {counter.status === 'win' && <div className="counter-overlay win">✓</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="counter-box main-counter">
              <div className="counter-label">Your Hand</div>
              <div className="counter-value">{playerCount}</div>
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