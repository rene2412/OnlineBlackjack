import React, { useState, useEffect } from "react";
import "./split.css";

export default function Split({ canSplit, onSplitDone, cardRef }) {
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [activeHand, setActiveHand] = useState(0);
  const [totalHands, setTotalHands] = useState(2); // max split hands

  // Show buttons after cards are dealt
  async function sendSplit(choice) {
    await fetch("/api/split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ split: choice }),
    });

    if (choice === "yes") {
      setIsSplitActive(true);
      setActiveHand(0);
      
    const playerFirstCard = cardRef.current?.[1];
    const playerSecondCard = cardRef.current?.[3];

    if (playerFirstCard && playerSecondCard) {
      playerFirstCard.dataset.hand = "0";
      playerSecondCard.dataset.hand = "1";

      playerFirstCard.classList.add("split-active");
    } else {
      console.warn("Split: initial player cards not found");
      }
    } else {
      onSplitDone();
    }
  }

  // Hit current hand
  async function hit() {
    await fetch("/api/player-split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hit", handIndex: activeHand }),
    });
  }

  // Stand current hand
  async function stand() {
    await fetch("/api/player-split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stand", handIndex: activeHand }),
    });

    // Remove glow from current hand
    document.querySelectorAll(".card.split-active").forEach(c => c.classList.remove("split-active"));

    // Move to next hand if exists
    if (activeHand + 1 < totalHands) {
      setActiveHand(prev => prev + 1);

      // Glow first card of next hand
      setTimeout(() => {
        const nextCard = document.querySelector(`.card[data-hand="${activeHand + 1}"]`);
        if (nextCard) nextCard.classList.add("split-active");
      }, 50);
    } else {
      onSplitDone();
    }
  }

  // Effect to keep glow on current hand
  useEffect(() => {
    if (!isSplitActive) return;
    document.querySelectorAll(".card.split-active").forEach(c => c.classList.remove("split-active"));
    document.querySelectorAll(`.card[data-hand="${activeHand}"]`).forEach(c => c.classList.add("split-active"));
  }, [activeHand, isSplitActive]);

  if (!canSplit) return null;

  // Split decision buttons
  if (!isSplitActive) {
    return (
      <div className="split-ui">
        <label className="split-label">Split?</label>
        <div className="split-decision-buttons">
          <button className="split-btn split-decision yes" onClick={() => sendSplit("yes")}>Yes</button>
          <button className="split-btn split-decision no" onClick={() => sendSplit("no")}>No</button>
        </div>
      </div>
    );
  }

  // Hit/Stand buttons
  return (
    <div className="split-ui">
      <div className="hit-stand-buttons">
        <button className="split-btn player-action yes" onClick={hit}>Hit</button>
        <button className="split-btn player-action no" onClick={stand}>Stand</button>
      </div>
    </div>
  );
}