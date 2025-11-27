"use client"
// Basic start for Stock tracker, just and API call and styling as of now
import { useState } from "react";
import axios from "axios";


export default function Home() {

  const APIKEY = "d4jpb8pr01qgcb0unq7gd4jpb8pr01qgcb0unq80";

  // Main functions Usestate for the searching and such

  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const searchStock = async () =>  {
// If user enters nothing return (No point in calling API)
if (!ticker.trim()) return;
setLoading(true);
setError("");
setData(null);

// api call

try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${APIKEY}`
      );
      setData(response.data);
      
 }
 catch (error) {
  setError("Stock not found or the Api's busted");
 }
 finally {
  setLoading(false);
 }
};


  return (
  <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h1>Stock Price testing (US MARKET)</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter stock ticker (Exact)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchStock()}
          style={{ padding: "10px", width: "200px", fontSize: "16px",}}
        />
        <button onClick={searchStock} disabled={loading} style={{ padding: "10px 20px", marginLeft: "10px" }}>
          {loading ? "Loading" : "Search"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && data.c > 0 && (
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
          <h2>{ticker.toUpperCase()}</h2>
          <p><strong>Current Price:</strong> ${data.c?.toFixed(2)}</p>
          <p><strong>Change Today:</strong> 
            <span style={{ color: data.c >= data.pc ? "green" : "red" }}>
              {" "}{data.c >= data.pc ? "up" : "down"} {((data.c - data.pc)/data.pc*100).toFixed(2)}%
            </span>
          </p>
          <p>Previous Close: ${data.pc?.toFixed(2)}</p>
          <p>Day High: ${data.h?.toFixed(2)} | Day Low: ${data.l?.toFixed(2)}</p>
          <small>API Data from finnhub</small>
        </div>
      )}
    </div>
  );
  
}
