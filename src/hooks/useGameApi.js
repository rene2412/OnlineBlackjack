import { useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function post(endpoint, body) {
  console.log(`[api] POST ${endpoint}`, body);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`[api] ${endpoint} response:`, res.status);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
  return res.json();
}

export default function useGameApi() {

  // POST /api/wager — GameController::PlayerWager()
  // Body: { wager: string }
  const sendWager = useCallback((amount) => {
    return post("/api/wager", { wager: String(amount) });
  }, []);

  // POST /api/shuffle — main.cpp inline handler
  // Body: { deck: string[] }  e.g. ["AH","KD","7C",...]
  // Backend shuffles, deals, fires WS events
  const sendShuffle = useCallback((deckArray) => {
    return post("/api/shuffle", { deck: deckArray });
  }, []);

  // POST /api/current-player-decision — GameController::CurrentPlayerDecision()
  // Body: { action: "hit" | "stand" }
  const sendDecision = useCallback((action) => {
    return post("/api/current-player-decision", { action });
  }, []);

  // POST /api/insurance-decision — GameController::Insurance()
  // Body: { action: "yes" | "no" }
  const sendInsurance = useCallback((action) => {
    return post("/api/insurance-decision", { action });
  }, []);

  // POST /api/split-decision — GameController::Split()
  // Body: { split: "yes" | "no" }
  const sendSplit = useCallback((accept) => {
    return post("/api/split-decision", { split: accept ? "yes" : "no" });
  }, []);

  // POST /api/player-split-decision — GameController::SplitDecision()
  // Body: { action: "hit" | "stand", handIndex: number }
  const sendSplitDecision = useCallback((action, handIndex) => {
    return post("/api/player-split-decision", { action, handIndex });
  }, []);

  // POST /api/next-game — GameController::NextGame() (reset handler)
  const sendNextGame = useCallback(() => {
    console.log("[api] POST /api/next-game");
    return post("/api/next-game", { action: "next-game" });
  }, []);

  const sendEndSession = useCallback(() => {
    return post("/api/end-session", {});
  }, []);

  return { sendWager, sendShuffle, sendDecision, sendInsurance, sendSplit, sendSplitDecision, sendNextGame, sendEndSession };
}