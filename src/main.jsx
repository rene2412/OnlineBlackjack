import React from "react";
import ReactDOM from "react-dom/client";
import Table from "./table/table.jsx"; 
import Card from "./card/card.jsx";
import Animations from "./Animations/animations.jsx"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Table/>
    <Card/>
  </React.StrictMode>
);
