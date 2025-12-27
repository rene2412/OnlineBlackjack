/*
import React, { useEffect, useRef, useState } from "react";
import Chip from "../chips/chips.jsx";
import StartGame from "../actions/actions.jsx";
import "./table.css";

export default function Table() {
  const canvasRef = useRef(null);
  const playerPos = { x: 620, y: 280 }; // target position for clicked chips

  // store all chips in a single state array
  const [chips, setChips] = useState([
    { id: 0, value: 1, color: "white", x: 415, y: 115, visible: false },
    { id: 1, value: 5, color: "green", x: 465, y: 115, visible: false },
    { id: 2, value: 10, color: "blue", x: 515, y: 115, visible: false },
    { id: 3, value: 25, color: "red", x: 565, y: 115, visible: false },
    { id: 4, value: 50, color: "black", x: 615, y: 115, visible: false },
  ]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const tableImg = new Image();
    tableImg.src = "../blackjack_table.jpeg"; // image stored in public folder
    tableImg.onload = () => {
      canvas.width = tableImg.width;
      canvas.height = tableImg.height;
      ctx.drawImage(tableImg, 0, 0);
    };
  }, []);

  const moveChipToPlayer = (chipId) => {
    setChips(prev =>
      prev.map(chip =>
        chip.id === chipId ? { ...chip, visible: true } : chip
      )
    );

    setTimeout(() => {
      setChips(prev =>
        prev.map(chip =>
          chip.id === chipId ? { ...chip, x: playerPos.x + chip.id * 40, y: playerPos.y } : chip
        )
      );
    }, 100);
  };

  return (
    <div className="table_styles">
      <div className="table_stack">
        <canvas ref={canvasRef} className="table_canvas"></canvas>
        <div className="table_frame"></div>
        <div className="chips_tray"></div>

        {chips.map(
          (chip) =>
            chip.visible && (
              <Chip
                key={chip.id}
                value={chip.value}
                color={chip.color}
                x={chip.x}
                y={chip.y}
                onClick={() => moveChipToPlayer(chip.id)}
              />
            )
        )}
      </div>
    </div>
  );
}
*/
import React, { useEffect, useRef, useState } from "react";
import Chip from "../chips/chips.jsx";
import "./table.css";

export default function Table({ initialWager }) {
  const canvasRef = useRef(null);
  const playerPos = { x: 620, y: 300 }; // target position for chips
  const [count, setCount] = useState(0);
  const chipValues = [
    { value: 1, color: "white" },
    { value: 5, color: "green" },
    { value: 10, color: "blue" },
    { value: 25, color: "red" },
    { value: 50, color: "black" },
  ];

  const [chips, setChips] = useState(
    chipValues.map((chip, i) => ({
      id: i,
      value: chip.value,
      color: chip.color,
      x: 400 + i * 50, // starting tray x
      y: 115,          // starting tray y
      visible: false,
      count: 0,
      targetX: 400 + i * 50, // initial same as x
      targetY: 115,          // initial same as y
    }))
  );

  // Draw table background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const tableImg = new Image();
    tableImg.src = "../blackjack_table.jpeg"; 
    tableImg.onload = () => {
      canvas.width = tableImg.width;
      canvas.height = tableImg.height;
      ctx.drawImage(tableImg, 0, 0);    
    };
  }, []);

  // Animate chips after wager is set
  useEffect(() => {
    if (!initialWager) return;

    let remaining = initialWager;
    const updatedChips = [...chips];

    // Determine count per chip (largest first)
    chipValues
      .slice()
      .reverse()
      .forEach((chip) => {
        const chipCount = Math.floor(remaining / chip.value);
        remaining -= chipCount * chip.value;

        const index = updatedChips.findIndex(c => c.value === chip.value);
        updatedChips[index].count = chipCount;
      });

    // Show chips at tray first
    setChips(updatedChips.map(c => ({ ...c, visible: c.count > 0 })));

    // Animate to playerPos after 0.8s
    setTimeout(() => {
      setChips(prev =>
        prev.map(chip => {
          if (chip.count === 0) return chip;
          return {
            ...chip,
            x: playerPos.x + chip.id * 45, // space each type horizontally
            y: playerPos.y,
          };
        })
      );
    }, 800);

  }, [initialWager]);
  return (
    <div className="table_styles">
      <div className="table_stack">
        <canvas ref={canvasRef} className="table_canvas"></canvas>
        <div className="table_frame"></div>
        <div className="chips_tray"></div>

        {chips.map((chip) => {
          if (!chip.visible) return null;
          return Array.from({ length: chip.count }).map((_, i) => (
            <Chip
              key={`${chip.id}-${i}`}
              value={chip.value}
              color={chip.color}
              x={chip.x + i * 45} 
              y={chip.y}
            />
          ));
        })}
      </div>
    </div>
  );
}
