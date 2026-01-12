import React from "react";
import "./wager.css";

export default function StartGame({onGameStart}) {
    const [wager, setWager] = React.useState("");
    const [hasWagerSubmitted, setWagerSubmitted] = React.useState(false);

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
    async function handleWager(event) {
        event.preventDefault();
        if (wager.trim() === "") {
            alert("Please Enter A Valid Wager");
            return;
        }
        if (isNaN(wager)) {
            alert("Wager must be a valid number");
            return;
        }
        const wagerInt = Number(wager);
        if (wagerInt <= 0) {
            alert("A wager must be at least $15");
            return;
        }
        if (wagerInt > 100) {
            alert("Wager can only be max 1000");
            return;
        }
        if (wager < 25) {
            alert("Wager Must Be At Least 25");
            return;
        }
         try{
        const response = await fetch('/api/wager', {
         method: 'POST',
         headers: {
            "Content-Type": 'application/json'
         },
         body: JSON.stringify({ wager })
        })
        const data = await response.json();
        console.log("Player Wager Response:" , data);
        setWagerSubmitted(true);
        if (onGameStart) {
            console.log("Wager Submited");
        }   
         if (onGameStart) {
            onGameStart(wager); 
        }     
    }
        catch(error) { 
            console.log("ERROR: ", error);
        }
    }  
if (!hasWagerSubmitted) {
    return (
    <div className="wager-panel">
      <div className="wager-container">
        <div className="wager-header">
          <div className="chip-icon"></div>
          <h2 className="wager-title">Place Your Bet</h2>
          <div className="chip-icon"></div>
        </div>
        
        <form onSubmit={handleWager} className="wager-form">
          <div className="input-wrapper">
            <span className="dollar-sign">$</span>
            <input 
              type="text" 
              className="wager-input"
              placeholder="25" 
              value={wager} 
              onChange={(e) => setWager(e.target.value)} 
              autoFocus
            />
          </div>
          
          <div className="bet-limits">
            <span className="limit-text">Min: $25</span>
            <span className="limit-divider">•</span>
            <span className="limit-text">Max: $100</span>
          </div>
          
          <button type="submit" className="submit-wager-btn">
            <span className="btn-text">DEAL CARDS</span>
            <span className="btn-shine"></span>
          </button>
        </form>
      </div>
    </div>
        );
    }
}