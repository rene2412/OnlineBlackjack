import React from "react";
import "./actions.css"

export default function HitOrStand() {
     async function handleClick(action)  {
       try{
        const response = await fetch('/api/current-player-decision', {
         method: 'POST',
         headers: {
            "Content-Type": 'application/json'
         },
         body: JSON.stringify({ action })
        })
        const data = await response.json();
        console.log("Player Response:" , action);
        console.log("Server Response: ", data);
        }
        catch(error) { 
            console.log("ERROR: ", error);
        }
    }   
     return (
            <div className="Hit-Stand-Container">
            <p className="hit-stand-text"> Do you want to Hit Or Stand?</p>
            <button className="hit" onClick={() => handleClick("hit")}>Hit</button>
            <button className="stand" onClick={() => handleClick("stand")}>Stand</button>
            </div>
        );
    }