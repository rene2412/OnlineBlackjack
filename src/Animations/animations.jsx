import React, { useState } from "react";
import Card from "../card/card.jsx";
import "../card/card.css";

export default function Animations({front, back}) {
    const [flipped, setFlipped] = useState(false);
 return (
    <div
      className={`card-container ${flipped ? "card-flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
    >
      <Card value={value} suit={suit} />

      <div className="card-backside">
        <img src="/card-backside.png" alt="backside"/>
      </div>
    </div>
  );
}