import React from "react";
export default function Insurance() {
    async function handleClick(action) {
        try {
            await fetch('/api/insurance-decision', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });

            console.log("Sent insurance action:", action);

        } catch (error) {
            console.error("ERROR:", error);
        }
    }

    return (
        <div className="Decisions">
            <p className="insurance-text">Do you want Insurance?</p>
            <div style={{ display: 'flex', gap: '20px' }}>
                <button className="insurance-yes" onClick={() => handleClick("yes")}>Yes</button>
                <button className="insurance-no" onClick={() => handleClick("no")}>No</button>
            </div>
        </div>
    );
}