import { useEffect, useState } from "react";
import useGameSocket from "./socket.js";
import { flipAnimation } from "../card/flipAnimation.js";

export default function UpdateGame({ cardRef, nextCardIndex }) {
  const [eventData, setEventData] = useState(null); 
  const [playerBust, setPlayerBust] = useState(false);
  
  useGameSocket((data) => {
    console.log("Socket Data Received:", data);
    setEventData(data);
  });
  
  useEffect(() => {
    if (!eventData) {
      return;
    }
    if (!cardRef?.current?.length) {
      console.error("Card ref is empty! Cannot flip cards.");
      return;
    }
  
  if (eventData.event === "playerBust") {
      console.log("Flipping PlayBust");
      setPlayerBust(true);
  }

   if (!playerBust) {
   if (eventData.event === "hit") {
        console.log("Animation triggered: Player Hit");
        flipAnimation("player", cardRef, nextCardIndex.current);
        nextCardIndex.current++;
     }
  }

    if (eventData.event === "dealerHit") {
      console.log("Animation triggered: Dealer Hit");
      const N = eventData.count;
      console.log("Animation Count: ",  N);
      if (N <= 0) return;
      for (let i = 0; i < N; i++) {
        setTimeout(() => {
        flipAnimation("dealer", cardRef, nextCardIndex.current);
        nextCardIndex.current++;
        }, i * 1000);
      }
    }

  }, [eventData, cardRef, nextCardIndex, playerBust]);

  return null; 
}