import React, { useEffect, useRef, useCallback } from "react";

//const WS_URL = `ws://${window.location.host}/ws/game`;
const WS_URL = import.meta.env.VITE_WS_URL
?? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

const RECONNECT_BASE_MS  = 1500;
const RECONNECT_MAX_MS   = 15000;


export default function useGameSocket(onMessage) {
  const onMessageRef  = useRef(onMessage);
  const socketRef     = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const unmountedRef  = useRef(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    const existingToken = sessionStorage.getItem("sessionToken");
    const url = existingToken ? `${WS_URL}?token=${existingToken}` : WS_URL;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      if (unmountedRef.current) return;
      retryCountRef.current = 0;
      onMessageRef.current({ event: "__connected" });
    };

    socket.onmessage = (event) => {
      if (unmountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
      }
    };

    socket.onclose = (e) => {
      if (unmountedRef.current) return;
      console.warn("🔌 WebSocket closed:", e.code, e.reason);
      onMessageRef.current({ event: "__disconnected" });
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(1.6, retryCountRef.current),
        RECONNECT_MAX_MS
      );
      retryCountRef.current += 1;
      console.log(`⏳ Reconnecting in ${Math.round(delay)}ms (attempt ${retryCountRef.current})…`);
      retryTimerRef.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      // onclose fires after onerror — reconnect handled there
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
        console.log("🧹 Closing WebSocket");
        s.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  const sendMessage = useCallback((payload) => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    }
  }, []);

  return { sendMessage };
}