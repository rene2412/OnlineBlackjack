import React from "react";
export default function Count({ count }) {  
    return (
        <div className="count-container">
            <div className="count-value"> 
                {count}
            </div>
        </div> 
    );
}