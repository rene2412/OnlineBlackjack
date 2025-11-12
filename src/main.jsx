import React from "react";
import ReactDOM from "react-dom/client";
import { useRef, useState } from "react";
import Table from "./table/table.jsx"; 
import Card from "./card/card.jsx";
import Action from "./actions/actions.jsx";
import UpdateGame from "./socket/updateGame.js";

function GameRoot() {
  const cardRef = useRef([]);
  const nextCardIndex = useRef(4);
  
  return (
    <>
      <Table/>
        <Card cardRef={cardRef}/>
        <Action />
         <UpdateGame cardRef={cardRef} nextCardIndex={nextCardIndex} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameRoot/>
  </React.StrictMode>
); 
