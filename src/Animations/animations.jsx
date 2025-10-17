import React, { useState } from "react";
import Card from "../card/card.jsx";
import "../card/card.css";


/*
function Deal() {
  const [playerCard, setPlayerCard] = useState(0);
  const [dealerCard, setDealerCard] = useState(0);
  let i  = 0;
  let playerCount = 0;
  let dealerCount = 0;
    <div className="card-player-flip" 
      onClick={() =>playerCard(playerCount++)}
    >
    </div> 
}
*/

export default function Animations({value, suit}) {
    const [playerFlipped, setPlayerFlipped] = useState(false);
 return (
    <div
      className={`card-container ${playerFlipped ? "card-player-flip" : ""}`}
      onClick={() => setPlayerFlipped(!playerFlipped)}
    >
      <Card value={value} suit={suit} />

      <div className="card-backside">
        <img src="/card-backside.png" alt="backside"/>
      </div>
    </div>
  );
}