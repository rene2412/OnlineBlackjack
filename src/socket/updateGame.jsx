import React from "react";
import { useEffect, useRef, useState } from "react";
import useGameSocket from "./socket.js";
import { flipAnimation } from "../card/flipAnimation.js";
import "../actions/HitStand.css";

export default function UpdateGame({ cardRef, nextCardIndex, lastDealerCard, setShowInsurance, setPlayerCount, setDealerCount, setCanSplit, setIsChoosingSplit, onActionAnimationDone}) {
  const [eventData, setEventData] = useState(null);
  const [message, setMessage] = useState("");
  const hasBusted = useRef(false);
  
  const hasDealerBusted = useRef(false);
  const dealerWin = useRef(false);
  const push = useRef(false);
  const playerWin = useRef(false);
  const splitIndices = useRef([0, 0]);

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
    if (eventData.event === "playerSplitChoice") {
      console.log("RUNNING SPLIT FRONT");
      setTimeout(() => {
        setCanSplit(true);
        setIsChoosingSplit(true);
      }, 3000);
    } 
   if (eventData.event === "playerWin") {
      playerWin.current = true; 
   }
   if (eventData.event === "dealerBust") {
      hasDealerBusted.current = true; 
   }
   if (eventData.event === "dealerWin") {
      dealerWin.current = true;  
      console.log("dealerWin flag set to true"); 
   }
   if (eventData.event === "updateCount") {
      setPlayerCount(eventData.count);
   }
   if (eventData.event === "updateDealerCount") {
      setDealerCount(eventData.count);
   }
   if (eventData.event === "playerBust") {
      if (hasBusted.current) {
          console.log("Already handled bust ignoring");
          return;
    }
      console.log("Flipping PlayBust");
      hasBusted.current = true;
      flipAnimation("player", cardRef, nextCardIndex.current);
      nextCardIndex.current++;
      const playerName = eventData.playerName;
      setTimeout(() => {
        setMessage(`${playerName} has busted!`);
        setTimeout(() => {
          setMessage("");
        }, 4000);
      }, 1000);
      return; 
  }

  if (eventData.event === "push") {
      push.current = true;  
  }

  if (eventData.event === "playerInsuranceChoice") {
      setShowInsurance(true);
  }

  if (eventData.event == "insuranceCompleted") {
      setShowInsurance(false);
  } 
//split here
  if (eventData.event === "splitHit") {
       const hand = eventData.handCount; 
       console.log("SPLIT HIT on hand:", hand);
       setTimeout(() => {
         flipAnimation("splitPlayer", cardRef, nextCardIndex.current, hand);
         nextCardIndex.current++;
        setTimeout(() => {
         onActionAnimationDone?.();
        }, 1000); 
      }, hand * 1000);
       return;
   }

   if (eventData.event === "hit") {
        console.log("Animation triggered: Player Hit");
        flipAnimation("player", cardRef, nextCardIndex.current);
        nextCardIndex.current++;
        setTimeout(() => {
         onActionAnimationDone?.();
        }, 1000); 

        return;
     }
  
    if (eventData.event === "dealerHit") {
      console.log("Animation triggered: Dealer Hit");
      const N = eventData.count;
      console.log("Animation Count: ", N);
      if (N < 0) return;
      
      const dealerIndex = lastDealerCard.current;
      console.log("Dealer Index: ", dealerIndex);
      
      const values = eventData.values;
      
      if (N === 0) {
        flipAnimation("dealerFlipInPlace", cardRef, dealerIndex);
        setDealerCount(values[0]);

        setTimeout(() => {
          console.log("Checking flags now:", { 
            bust: hasDealerBusted.current, 
            win: dealerWin.current, 
            push: push.current, 
            playerWin: playerWin.current 
          });
          
          if (hasDealerBusted.current) {
            console.log("dealer bust!!!");
            setMessage("Dealer has busted!");
            setTimeout(() => setMessage(""), 5000);
            hasDealerBusted.current = false;
          } else if (dealerWin.current) {
            console.log("dealer win!!!");
            setMessage("Dealer Win");
            setTimeout(() => setMessage(""), 5000);
            dealerWin.current = false;
          } else if (push.current) {
            setMessage("PUSH!");
            setTimeout(() => setMessage(""), 5000);
            push.current = false;
          } else if (playerWin.current) {
            setMessage("Player Beats Dealer!");
            setTimeout(() => setMessage(""), 5000);
            playerWin.current = false;
          }
        }, 1500);

        return;
      }
      
      flipAnimation("dealerFlipInPlace", cardRef, dealerIndex);
      setDealerCount(values[0]);
      console.log(values);
      
      setTimeout(() => {
        let counter = 1;
        for (let i = 0; i < N; i++) {
          setTimeout(() => {
            setDealerCount("");
            flipAnimation("dealer", cardRef, nextCardIndex.current);
            nextCardIndex.current++;
            setDealerCount(values[counter]);
            counter++;
          }, i * 1000);
        }
      
        setTimeout(() => {
          console.log("Checking flags now:", { 
            bust: hasDealerBusted.current, 
            win: dealerWin.current, 
            push: push.current, 
            playerWin: playerWin.current 
          });
          
          if (hasDealerBusted.current) {
            console.log("dealer bust!!!");
            setMessage("Dealer has busted!");
            setTimeout(() => setMessage(""), 5000);
            hasDealerBusted.current = false;
          }
          if (dealerWin.current) {
            console.log("dealer win!!!");
            setMessage("Dealer Win");
            setTimeout(() => setMessage(""), 5000);
            dealerWin.current = false;
          }
          if (push.current) {
            setMessage("PUSH!");
            setTimeout(() => setMessage(""), 5000);
            push.current = false;
          }
          if (playerWin.current) {
            setMessage("Player Win!");
            setTimeout(() => setMessage(""), 5000);
            playerWin.current = false;
          }
        }, N * 1000 + 500);
      }, 1000);
    }
    
  }, [eventData, cardRef, nextCardIndex, setShowInsurance, setPlayerCount, setDealerCount]);

  return message ? (
    <div className="game-message visible">
      {message}
    </div>
  ) : null;
}