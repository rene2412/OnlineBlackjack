import React from "react";
import "./LandingApp.css";

export default function Landing() {

  const startGame = () => {
    window.location.href = "index.html"; 
  };

  return (
    <div className="landing-container">

      <img
        src="/landingPage.jpg"
        className="landing-image"
        alt="Blackjack table"
      />

      <button className="play-btn" onClick={startGame}>
        PLAY NOW
      </button>

    </div>
  );
}
