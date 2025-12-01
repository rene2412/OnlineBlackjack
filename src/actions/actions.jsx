import React from "react";
import "./actions.css"

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
            onGameStart(); 
        }     
    }
        catch(error) { 
            console.log("ERROR: ", error);
        }
    }  
    if (!hasWagerSubmitted) {
     return (
            <div className="Decisions">
            <form className="wager" onSubmit={handleWager}>
                <label>Enter Wager: </label>
                <input type="text" placeholder="$" value={wager} onChange={(e) => setWager(e.target.value)}/>
                <button type="submit">Submit</button>
                </form>
                </div>
            );
        }
}