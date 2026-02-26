import React, { useEffect, useRef, useCallback } from "react";

const WS_URL             = "ws://localhost:8080/ws/game"; // ← your Drogon WS path
const RECONNECT_BASE_MS  = 1500;
const RECONNECT_MAX_MS   = 15000;

export default function useGameSocket(onMessage) {
  const onMessageRef  = useRef(onMessage);
  const socketRef     = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const unmountedRef  = useRef(false);

  // Keep onMessage ref fresh without re-running the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    console.log("🔄 WebSocket connecting…", WS_URL);
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      if (unmountedRef.current) return;
      console.log("✅ WebSocket connected");
      retryCountRef.current = 0;
      onMessageRef.current({ event: "__connected" });
    };

    socket.onmessage = (event) => {
      if (unmountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Server event:", data.event, data);
        onMessageRef.current(data);
      } catch (err) {
        console.error("❌ Invalid JSON from server:", err, event.data);
      }
    };

    socket.onclose = (e) => {
      if (unmountedRef.current) return;
      console.warn("🔌 WebSocket closed:", e.code, e.reason);
      onMessageRef.current({ event: "__disconnected" });

      // Exponential backoff reconnect
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(1.6, retryCountRef.current),
        RECONNECT_MAX_MS
      );
      retryCountRef.current += 1;
      console.log(`⏳ Reconnecting in ${Math.round(delay)}ms (attempt ${retryCountRef.current})…`);
      retryTimerRef.current = setTimeout(connect, delay);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      // onclose will fire after onerror — reconnect happens there
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearTimeout(retryTimerRef.current);
      const s = socketRef.current;
      if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
        console.log("🧹 Cleaning up WebSocket");
        s.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  // Expose sendMessage for any future client→server needs
  const sendMessage = useCallback((payload) => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    } else {
      console.warn("sendMessage called but socket not open");
    }
  }, []);

  return { sendMessage };
}