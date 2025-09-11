import React, { useEffect, useRef } from "react";
import "./table.css";

export default function Table() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
    
        const tableImg = new Image();
        tableImg.src = "../blackjack_table.jpeg"; // image stored in public folder
        tableImg.onload = () => {
          // draw table background
          canvas.width = tableImg.width;
          canvas.height = tableImg.height;
          ctx.drawImage(tableImg, 0, 0);    
        };
        }, []);

  return (
    <div className="table_styles">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
