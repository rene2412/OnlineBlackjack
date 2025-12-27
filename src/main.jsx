import React, { useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Table from "./table/table.jsx"; 
import Card from "./card/card.jsx";
import StartGame from "./actions/actions.jsx";
import HitOrStand from "./actions/HitStand.jsx";
import Insurance from "./actions/Insurance.jsx";
import Count from "./actions/Count.jsx";
import DealerCount from "./actions/DealerCount.jsx";
import UpdateGame from "./socket/updateGame.jsx";

function GameRoot() {
  const cardRef = useRef([]);
  const nextCardIndex = useRef(4);
  const lastDealerCard = useRef(0);
  const [gameStart, setGameStart] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [dealerCount, setDealerCount] = useState(0);

  const [wager, setWager] = useState(null);

  console.log("GameStart: ", gameStart); 

  return (
    <>
      <Table initialWager={wager} /> 
      {!gameStart ? (
        <StartGame 
          onGameStart={(submittedWager) => {
            setGameStart(true);
            setWager(Number(submittedWager));
          }} 
        />
      ) : ( 
        <>
          <Card cardRef={cardRef} gameStarted={gameStart} lastDealerCard={lastDealerCard}/>
          <UpdateGame 
            cardRef={cardRef} 
            nextCardIndex={nextCardIndex} 
            lastDealerCard={lastDealerCard} 
            setShowInsurance={setShowInsurance} 
            setPlayerCount={setPlayerCount} 
            setDealerCount={setDealerCount}
          />
          <HitOrStand/>
          {showInsurance && <Insurance/>}
          <Count count={playerCount}/>
          <DealerCount count={dealerCount}/>
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameRoot/>
  </React.StrictMode>
);
