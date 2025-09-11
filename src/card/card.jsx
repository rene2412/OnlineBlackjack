import React from "react"
import "./card.css"

const num_values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const face_values = ['K', 'Q', 'J'];
const suits = [
    { symbol: '♣️', color: "black" },
    { symbol: '♠️', color: "black" },
    { symbol: '♥️', color: "red"   },
    { symbol: '♦️', color: "red"   }
]

export default function Card({value, suit}) {
    const deck = []; 
        for (let k = 0; k < suits.length; k++) {
            for (let i = 0; i < num_values.length; i++) {
                const suit = suits[k];
                const value = num_values[i];
                if (value === 'A') {
                    deck.push(
                        <div key={value + suit.symbol} className={`card ${suit.color}`}> 
                            <div className="top-left-number">{value}</div>
                            <div className="top-left-suit">{suit.symbol}</div>
                            <div className="bottom-right-suit">{suit.symbol}</div> 
                            <div className="middle">{suit.symbol}</div>
                            <div className="upside-down">{value}</div>
                    </div>
                    );
                }
           }
    }
        return (   
                <div className="deck">{deck} </div>            
        );
}
