import React, { useState, useCallback } from "react";

let _id = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "") => {
    const id = ++_id;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return { toasts, addToast };
}

export default function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={["toast", t.type ? `toast--${t.type}` : ""].join(" ")}>
          {t.message}
        </div>
      ))}
    </div>
  );
}