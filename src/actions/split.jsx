import React, { useState } from "react";
import "./split.css";

export default function Split({ canSplit, onSplitDone }) {
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [activeHand, setActiveHand] = useState(0);

  async function sendSplit(choice) {
    await fetch("/api/split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ split: choice }),
    });

    if (choice === "yes") {
      setIsSplitActive(true);
      setActiveHand(0);
    } else {
      onSplitDone();
    }
  }

  async function hit() {
    await fetch("/api/player-split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "hit",
        handIndex: activeHand,
      }),
    });
  }

  async function stand() {
    await fetch("/api/player-split-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "stand",
        handIndex: activeHand,
      }),
    });
    setActiveHand(activeHand + 1);
    onSplitDone();
  }

  if (!canSplit) return null;

  if (!isSplitActive) {
    return (
      <div className="split-ui">
        <label className="split-label">Split?</label>
        <div className="split-buttons">
          <button className="split-btn yes" onClick={() => sendSplit("yes")}>Yes</button>
          <button className="split-btn no" onClick={() => sendSplit("no")}>No</button>
        </div>
      </div>
    );
  }

  return (
    <div className="split-ui">
      <label className="split-label">Hand {activeHand}</label>
      <div className="split-buttons">
        <button className="split-btn yes" onClick={hit}>Hit</button>
        <button className="split-btn no" onClick={stand}>Stand</button>
      </div>
    </div>
  );
}
