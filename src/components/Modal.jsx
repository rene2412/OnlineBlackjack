import React, { useEffect, useRef, useCallback } from "react";
export default function Modal({ open, suit, title, body, yesLabel, noLabel, onYes, onNo }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onNo()}>
      <div className="modal-box">
        <div className="modal-suit">{suit}</div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-body">{body}</p>
        <div className="modal-actions">
          <button className="btn btn--yes" onClick={onYes}>{yesLabel}</button>
          <button className="btn btn--no"  onClick={onNo}>{noLabel}</button>
        </div>
      </div>
    </div>
  );
}