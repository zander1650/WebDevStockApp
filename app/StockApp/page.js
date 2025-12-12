"use client";

import { useState } from "react";
import axios from "axios";

export default function StockApp() {
  const APIKEY = "d4jpb8pr01qgcb0unq7gd4jpb8pr01qgcb0unq80";

  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [watchlist, setWatchlist] = useState([]);

  const searchStock = async () => {
    if (!ticker.trim()) return;

    setLoading(true);
    setError("");
    setData(null);
    setProfile(null);

    try {
      const quoteRes = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${APIKEY}`
      );

      const profileRes = await axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker.toUpperCase()}&token=${APIKEY}`
      );

      if (quoteRes.data.c === 0 && quoteRes.data.h === 0) {
        setError("Stock not found or market closed");
      } else {
        setData(quoteRes.data);
        setProfile(profileRes.data);
      }
    } catch (err) {
      setError("Invalid ticker or API error. Try AAPL, TSLA, etc.");
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = () => {
    if (!data || !profile) return;

    const stockInfo = {
      ticker: ticker.toUpperCase(),
      name: profile.name || ticker.toUpperCase(),
      price: data.c,
      change: ((data.c - data.pc) / data.pc) * 100,
      logo: profile.logo,
      id: ticker.toUpperCase(),
    };

    if (!watchlist.find((s) => s.id === stockInfo.id)) {
      setWatchlist([...watchlist, stockInfo]);
    }
  };

  const changeColor = (change) => (change >= 0 ? "text-green-600" : "text-red-600");
  const arrow = (change) => (change >= 0 ? "↑" : "↓");

  return (
    <div className="min-h-screen bg-blue-200 text-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Stock Tracker</h1>

        <div className="flex justify-center mb-8 gap-2">
          <input
            type="text"
            placeholder="Enter ticker (AAPL, TSLA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && searchStock()}
            className="border border-gray-400 px-4 py-2 rounded w-56 bg-white"
          />
          <button
            onClick={searchStock}
            disabled={loading}
            className="border bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        {data && profile && data.c > 0 && (
          <div className="border border-gray-400 rounded p-4 mb-8 bg-white shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="w-14 h-14 rounded" />
              ) : (
                <div className="w-14 h-14 bg-gray-300 flex items-center justify-center font-bold rounded">
                  {ticker[0]}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{ticker.toUpperCase()}</h2>
                <p className="text-sm text-gray-600">{profile.name || "Unknown Company"}</p>
                <p className="text-xs text-gray-500">{profile.exchange} • {profile.country}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Current Price</p>
                <p className="text-xl font-semibold">${data.c.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Change</p>
                <p className={`text-lg font-semibold ${changeColor(data.c - data.pc)}`}>
                  {arrow(data.c - data.pc)} {Math.abs(((data.c - data.pc) / data.pc) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-gray-500">Open</p>
                <p>${data.o?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">High</p>
                <p>${data.h?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Low</p>
                <p>${data.l?.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={addToWatchlist}
              className="mt-4 w-full border bg-gray-100 py-2 rounded hover:bg-gray-200 font-medium"
            >
              Add to Watchlist
            </button>
          </div>
        )}

        {watchlist.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Watchlist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map((stock) => (
                <div key={stock.id} className="border p-4 rounded bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    {stock.logo ? (
                      <img src={stock.logo} alt={stock.name} className="w-12 h-12 rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 flex items-center justify-center font-bold rounded">
                        {stock.ticker[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg">{stock.ticker}</p>
                      <p className="text-sm text-gray-600">{stock.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-sm mb-2">
                    <p className="text-gray-500">Price:</p>
                    <p className="text-right font-semibold">${stock.price.toFixed(2)}</p>
                    <p className="text-gray-500">Change:</p>
                    <p className={`text-right font-semibold ${changeColor(stock.change)}`}>
                      {arrow(stock.change)} {Math.abs(stock.change).toFixed(2)}%
                    </p>
                  </div>

                  
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Stock Tracker</h1>

        <div className="flex justify-center mb-8 gap-2">
          <input
            type="text"
            placeholder="Enter ticker (AAPL, TSLA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && searchStock()}
            className="border border-gray-400 px-4 py-2 rounded w-56"
          />
          <button
            onClick={searchStock}
            disabled={loading}
            className="border bg-gray-200 px-4 py-2 rounded"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        {data && profile && data.c > 0 && (
          <div className="border border-gray-400 rounded p-4 mb-8 bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="w-12 h-12" />
              ) : (
                <div className="w-12 h-12 bg-gray-300 flex items-center justify-center font-bold">
                  {ticker[0]}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{ticker.toUpperCase()}</h2>
                <p className="text-sm text-gray-600">{profile.name || "Unknown Company"}</p>
              </div>
            </div>

            <p className="text-lg font-semibold mb-2">Price: ${data.c.toFixed(2)}</p>
            <p className={`text-md font-semibold ${changeColor(data.c - data.pc)}`}>
              {arrow(data.c - data.pc)} {Math.abs(((data.c - data.pc) / data.pc) * 100).toFixed(2)}%
            </p>

            <button
              onClick={addToWatchlist}
              className="mt-4 w-full border bg-gray-200 py-2 rounded"
            >
              Add to Watchlist
            </button>
          </div>
        )}

        {watchlist.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Watchlist</h2>
            <div className="grid grid-cols-1 gap-4">
              {watchlist.map((stock) => (
                <div key={stock.id} className="border p-4 rounded bg-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    {stock.logo ? (
                      <img src={stock.logo} alt={stock.name} className="w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 flex items-center justify-center font-bold">
                        {stock.ticker[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{stock.ticker}</p>
                      <p className="text-sm text-gray-600">{stock.name}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">${stock.price.toFixed(2)}</p>
                    <p className={`${changeColor(stock.change)} font-semibold`}>
                      {arrow(stock.change)} {Math.abs(stock.change).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ;
}
