import { useEffect } from "react";

export default function useGameSocket(onMessage) {
  useEffect(() => {
        console.log("🔄 Attempting WebSocket connection...");
    const socket = new WebSocket("ws://localhost:8080/ws/game");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Server event:", data);
        onMessage(data);
      } catch (err) {
        console.error("Invalid JSON:", err);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [onMessage]);
}
