"use client";

import { useState, useEffect } from "react";
import axios from "axios";

import { db, auth } from "../_utils/firebase";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function StockApp() {
  const APIKEY = "d4jpb8pr01qgcb0unq7gd4jpb8pr01qgcb0unq80";

  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setWatchlist([]);
        return;
      }

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "watchlist")
        );
        setWatchlist(snapshot.docs.map((doc) => doc.data()));
      } catch {
        setError("Failed to load watchlist");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setWatchlist([]);
    } catch {
      setError("Failed to log out");
    }
  };

  const searchStock = async () => {
    if (!ticker.trim()) return;

    setLoading(true);
    setError("");
    setData(null);
    setProfile(null);

    try {
      const symbol = ticker.toUpperCase();

      const quoteRes = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${APIKEY}`
      );

      const profileRes = await axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${APIKEY}`
      );

      // Check if we got valid data - even when market is closed, c will have the last price
      if (quoteRes.data.c === 0 && quoteRes.data.h === 0 && quoteRes.data.l === 0) {
        setError("Stock not found");
      } else {
        setData(quoteRes.data);
        setProfile(profileRes.data);
      }
    } catch {
      setError("Invalid ticker or API error");
    } finally {
      setLoading(false);
    }
  };

  const refreshWatchlistPrices = async () => {
    const user = auth.currentUser;
    if (!user || watchlist.length === 0) return;

    setRefreshing(true);

    try {
      const updatedStocks = await Promise.all(
        watchlist.map(async (stock) => {
          try {
            const quoteRes = await axios.get(
              `https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${APIKEY}`
            );

            // Check if we got valid data (c is current price, even when market is closed)
            if (quoteRes.data.c !== undefined && quoteRes.data.c !== null) {
              const updatedStock = {
                ...stock,
                price: quoteRes.data.c,
                change: ((quoteRes.data.c - quoteRes.data.pc) / quoteRes.data.pc) * 100,
                updatedAt: serverTimestamp(),
              };

              // Update in Firestore
              await setDoc(
                doc(db, "users", user.uid, "watchlist", stock.ticker),
                updatedStock
              );

              return updatedStock;
            }
            return stock;
          } catch {
            return stock;
          }
        })
      );

      setWatchlist(updatedStocks);
    } catch {
      setError("Failed to refresh prices");
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (watchlist.length === 0) return;

    const interval = setInterval(() => {
      refreshWatchlistPrices();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [watchlist]);

  const addToWatchlist = async () => {
    if (!data || !profile) return;

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in");
      return;
    }

    const stockInfo = {
      ticker: ticker.toUpperCase(),
      name: profile.name || ticker.toUpperCase(),
      price: data.c,
      change: ((data.c - data.pc) / data.pc) * 100,
      logo: profile.logo || "",
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(
        doc(db, "users", user.uid, "watchlist", stockInfo.ticker),
        stockInfo
      );

      setWatchlist((prev) => [
        ...prev.filter((s) => s.ticker !== stockInfo.ticker),
        stockInfo,
      ]);
    } catch {
      setError("Failed to save Dashboard");
    }
  };

  const changeColor = (val) =>
    val >= 0 ? "text-green-600" : "text-red-600";

  const arrow = (val) => (val >= 0 ? "↑" : "↓");
  
  //ui

  return (
    <div className="min-h-screen bg-blue-200 text-black p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Stock Tracker</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
          >
            Logout
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Enter ticker (AAPL, TSLA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && searchStock()}
            className="border px-4 py-2 rounded w-56 bg-white"
          />
          <button
            onClick={searchStock}
            disabled={loading}
            className="border bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && (
          <p className="text-center text-red-600 mb-4">{error}</p>
        )}

        {/* Stock Result */}
        {data && profile && data.c > 0 && (
          <div className="bg-white border rounded-xl p-5 shadow mb-8">
            <div className="flex gap-4 items-center mb-4">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={profile.name}
                  className="w-14 h-14 rounded"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-300 flex items-center justify-center font-bold rounded">
                  {ticker[0]}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold">{ticker}</h2>
                <p className="text-sm text-gray-600">{profile.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Current Price</p>
                <p className="text-xl font-semibold">
                  ${data.c.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Change</p>
                <p className={`text-lg font-semibold ${changeColor(data.c - data.pc)}`}>
                  {arrow(data.c - data.pc)}{" "}
                  {Math.abs(((data.c - data.pc) / data.pc) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <button
              onClick={addToWatchlist}
              className="w-full bg-gray-100 border py-2 rounded hover:bg-gray-200"
            >
              Add to Dashboard
            </button>
          </div>
        )}

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Dashboard</h2>
              <button
                onClick={refreshWatchlistPrices}
                disabled={refreshing}
                className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200 text-sm"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {watchlist.map((stock) => (
                <div
                  key={stock.ticker}
                  className="bg-white rounded-xl shadow-md p-5 border hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {stock.logo ? (
                      <img
                        src={stock.logo}
                        alt={stock.name}
                        className="w-12 h-12 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 flex items-center justify-center font-bold rounded">
                        {stock.ticker[0]}
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-lg font-bold">{stock.ticker}</p>
                      <p className="text-sm text-gray-600">{stock.name}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ${stock.price.toFixed(2)}
                      </p>
                      <p className={`text-sm font-semibold ${changeColor(stock.change)}`}>
                        {arrow(stock.change)} {Math.abs(stock.change).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 text-center text-sm border-t pt-3">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium">Tracked</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trend</p>
                      <p className={`font-medium ${changeColor(stock.change)}`}>
                        {stock.change >= 0 ? "Bullish" : "Bearish"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Updated</p>
                      <p className="font-medium">Today</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
