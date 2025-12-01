import React from "react";

let dealerIndex = 2;
export function flipAnimation(type, cardRef, cardIndex) {
    console.log("Flip Animation Called");
    const cards = cardRef.current;
    if (cards === null || !cards[cardIndex]) return;
    let nextCard = cards[cardIndex];
    console.log("Ready to hit: ", type);
    console.log("Card Index:" , cardIndex);
    nextCard.classList.remove("card-player-flip", "card-dealer-flip", "card-dealer-flip-reverse");
    if (type === "dealerFlipInPlace") { 
        nextCard.classList.add("card-flip-in-place");
    }
    let playerOffset = (cardIndex) * 30;
    if (cardIndex > 4) {
        playerOffset = playerOffset + 25;
    }
    nextCard.style.setProperty('--card-offset', `${playerOffset}px`);
    if (type === "player") nextCard.classList.add("card-player-flip");
    if (type === "dealer") { 
            const dealerOffset = dealerIndex * 45;
            nextCard.style.setProperty('--card-offset', `${dealerOffset}px`);
            nextCard.classList.add("card-dealer-flip");
            dealerIndex ++;
        }
}