import React from "react"
import "./card.css"

const num_values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'K', 'Q'];
const suits = [
    { symbol: '♣️', color: "black" },
    { symbol: '♠️', color: "black" },
    { symbol: '♥️', color: "red"   },
    { symbol: '♦️', color: "red"   }
]
const cards = [];

export default function Card({value, suit}) {
    const deck = []; 
        for (let k = 0; k < suits.length; k++) {
            for (let i = 0; i < num_values.length; i++) {
                const suit = suits[k];
                const value = num_values[i];
                if (value === 'A') {
		    deck.push(
                       <div
                        key={value}
                            className={`card ${suit.color}`}
                //                  onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                            <div className="front">
                            <div className="top-left-number">{value}</div>
                            <div className="top-left-suit">{suit.symbol}</div>
                            <div className="bottom-right-suit">{suit.symbol}</div>
                            <div className="middle">{suit.symbol}</div>
                            <div className="upside-down">{value}</div>
                            </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>
                    );
                }
                if (value === '2') {
                    deck.push(
                          <div
                            key={value}
                            className={`card ${suit.color}`}
                 //                 onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                            <div className="front">
                            <div className="upside-down">{value}</div>
                            <div className="top-left-number">{value}</div>
                            <div className="top-left-suit">{suit.symbol}</div>
                            <div className="bottom-right-suit">{suit.symbol}</div> 
                            <div className="second">{suit.symbol}</div>
                            <div className="second2">{suit.symbol}</div>
                            </div>
                             <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                    </div>
                    );
                }
                if (value === '3') {
                    deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
                 //                 onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="third0">{suit.symbol}</div>
                           <div className="third1">{suit.symbol}</div>
                           <div className="third2">{suit.symbol}</div>
                            </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>
                    );
                }
                if (value === '4') {
                    deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
               //                   onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div> 
                    );       
              }
              if (value === '5') {
                deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
                   //               onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           <div className="middle">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>  
                );
            }
            if (value === '6') {
                deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
                           //   onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           <div className="middle-left">{suit.symbol}</div>
                           <div className="middle-right">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>  
                );
            }
            if (value === '7') {
                       deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
                       //       onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           <div className="middle-left">{suit.symbol}</div>
                           <div className="middle-right">{suit.symbol}</div>
                           <div className="middle-top">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>    
                    );
            }
             if (value === '8') {
                       deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
             //                 onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           <div className="middle-left">{suit.symbol}</div>
                           <div className="middle-right">{suit.symbol}</div>
                           <div className="middle-top">{suit.symbol}</div>
                           <div className="middle-bottom">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                        </div>    
                    );
            }
            if (value === '9') {
                 deck.push(
                      <div
                            key={value}
                            className={`card ${suit.color}`}
                     //         onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="fourth0">{suit.symbol}</div>
                           <div className="fourth1">{suit.symbol}</div>
                           <div className="middle-left-1">{suit.symbol}</div>
                           <div className="middle-left-2">{suit.symbol}</div>
                           <div className="middle-right-1">{suit.symbol}</div>
                           <div className="middle-right-2">{suit.symbol}</div>
                           <div className="middle-top-2">{suit.symbol}</div>
                           <div className="fourth2">{suit.symbol}</div>
                           <div className="fourth3">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                           </div>
                 );
            }
             if (value === '10') {
                 	deck.push(
                     <div
                            key={value}
                            className={`card ${suit.color}`}
             //                 onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                           <div className="front">
                           <div className="top-left-number">{value}</div>
                           <div className="top-left-suit">{suit.symbol}</div>
                           <div className="bottom-right-suit">{suit.symbol}</div> 
                           <div className="upside-down">{value}</div>
                           <div className="ten-middle-top-left">{suit.symbol}</div>
                           <div className="ten-middle-top-right">{suit.symbol}</div>
                           <div className="ten-left-1">{suit.symbol}</div>
                           <div className="ten-left-2">{suit.symbol}</div>
                           <div className="ten-left-3">{suit.symbol}</div>
                           <div className="ten-right-1">{suit.symbol}</div>
                           <div className="ten-right-2">{suit.symbol}</div>
                           <div className="ten-right-3">{suit.symbol}</div>
                           <div className="ten-top-middle">{suit.symbol}</div>
                           <div className="ten-bottom-middle">{suit.symbol}</div>
                           </div>
                            <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                           </div>
                    );
             }
             if (value === 'J') {
                  deck.push(
                        <div
                            key={value}
                            className={`card ${suit.color}`}
                       //      onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                             >
                   <div className="front">
                     <div className="top-left-number">{value}</div>
                     <div className="top-left-suit">{suit.symbol}</div>
                     <div className="bottom-right-suit">{suit.symbol}</div> 
                     <div className="upside-down">{value}</div>
                     <div className="face-inside-suites">{suit.symbol}</div>
                     <div className="upside-down-face-inside-suites">{suit.symbol}</div>
                     </div>
                     <img src="/J_Face.png" alt="Jack" className="Jack-Face"/>
                      <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                    </div>
                 );
             } 
             if (value === 'K') {
                  deck.push(
                    <div
                          key={value}
                          className={`card ${suit.color}`}
                          //   onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                         >
                   <div className="front">
                     <div className="top-left-number">{value}</div>
                     <div className="top-left-suit">{suit.symbol}</div>
                     <div className="bottom-right-suit">{suit.symbol}</div> 
                     <div className="upside-down">{value}</div>
                     <div className="face-inside-suites">{suit.symbol}</div>
                     <div className="upside-down-face-inside-suites">{suit.symbol}</div>
                     </div>
                     <img src="/K-Face.png" alt="King" className="King-Face"/>
                         <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                    </div>
                 );
             }     
              if (value === 'Q') {
                  deck.push(
                    <div
                        key={value}
                        className={`card ${suit.color}`}
                              //onClick={(e) => e.currentTarget.classList.toggle("card-player-flip")}
                    >
                   <div className="front">
                     <div className="top-left-number">{value}</div>
                     <div className="top-left-suit">{suit.symbol}</div>
                     <div className="bottom-right-suit">{suit.symbol}</div> 
                     <div className="upside-down">{value}</div>
                     <div className="face-inside-suites">{suit.symbol}</div>
                     <div className="upside-down-face-inside-suites">{suit.symbol}</div>
                    </div>
                     <img src="/Q-Face.png" alt="Queen" className="Queen-Face"/>
                         <div className="card-backside">
                            <img src="/card-backside.png" alt="backside" />
                            </div>
                    </div>
                 );
             }
         }
    }

    function Shuffle(deck) {
        const array = [...deck];
        for (let i = array.length - 1; i > 0; i--) {
            let random_index = Math.floor(Math.random() * (i + 1));
             [array[i], array[random_index]] = [array[random_index], array[i]];    
	}
        return array;
    }
    
    const sendDeckToBackend = async (deck) => {
        try {
        const response = await fetch("http://localhost:8080/api/shuffle", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ deck }) 
    });

    const data = await response.json();
    console.log("Backend response:", data);
  } catch (err) {
    console.error("Error sending deck:", err);
  }
};
   
    function DealAnimation(deck) {
        <div>
        <button className="card-player-flip">Start</button>
        </div>
    }
     

    const random_deck = Shuffle(deck);

    const onlyValues = random_deck.map(d => `${d.key}`);
    sendDeckToBackend(onlyValues);
    console.log("Random deck:", random_deck);
    console.log("Values: ", onlyValues);
        return ( 
                <div className="deck">{random_deck} </div>  
        );
}
