import React from "react";
import { useState, useEffect } from "react";
import "./Count.css";

export default function Count({ count, gameStart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gameStart) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, 3500); // 1000ms delay after game start

    return () => clearTimeout(timer);
  }, [gameStart]);

  if (!visible) return null;

  return (
    <div className="count-container">
      <div className="count-value">{count}</div>
    </div>
  );
}