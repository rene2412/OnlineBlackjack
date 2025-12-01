import React from "react";
export default function Count({ count }) {  
    return (
        <div className="dealer-count-container">
            <div className="dealer-count-value"> 
                {count}
            </div>
        </div> 
    );
}