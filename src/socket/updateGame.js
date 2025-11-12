import { useEffect, useState } from "react";
import useGameSocket from "./socket.js";
import { flipAnimation } from "../card/flipAnimation.js";

export default function UpdateGame({ cardRef, nextCardIndex }) {
  const [eventData, setEventData] = useState(null); 
  
  useGameSocket((data) => {
    console.log("Socket Data Received:", data);
    setEventData(data);
  });
  
  useEffect(() => {
    if (!cardRef?.current?.length) {
      console.error("Card ref is empty! Cannot flip cards.");
      return;
    }
    
    if (eventData.event === "hit") {
      console.log("Animation triggered: Player Hit");
      flipAnimation("player", cardRef, nextCardIndex.current);
      nextCardIndex.current++;
    }

    if (eventData.event === "dealerHit") {
      console.log("Animation triggered: Dealer Hit");
      flipAnimation("dealer", cardRef, nextCardIndex.current);
      nextCardIndex.current++;
    }
  }, [eventData, cardRef, nextCardIndex]);

  return null; 
}