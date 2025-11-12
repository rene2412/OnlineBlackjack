export function flipAnimation(type, cardRef, cardIndex) {
    console.log("Flip Animation Called");
    console.log("Card Index", cardIndex)
    const cards = cardRef.current;
    if (cards === null || !cards[cardIndex]) return;
    console.log("Card Ref After Calling in Function Parameter: ", cards);
    let nextCard = cards[cardIndex];
    console.log("Ready to hit: ", type);
    if (type === "player") nextCard.classList.add("card-player-flip");
    if (type === "dealer") nextCard.classList.add("card-dealer-flip");
 }