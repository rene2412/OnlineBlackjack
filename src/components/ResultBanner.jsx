
import React, { useEffect, useState } from "react";

export default function ResultBanner({ text, type }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState({ text, type });

  useEffect(() => {
    if (!text) return;
    setCurrent({ text, type });
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [text, type]);

  if (!visible) return null;

  return (
    <div className="result-banner">
      <span className={`result-banner__text result-banner__text--${current.type}`}>
        {current.text}
      </span>
    </div>
  );
}