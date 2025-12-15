"use client";
import { useState, useEffect, useRef } from "react";
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
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function StockApp() {
  const APIKEY = "d4jpb8pr01qgcb0unq7gd4jpb8pr01qgcb0unq80";
  const REFRESH_INTERVAL = 10000; // 10 seconds

  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef(null);

  // Load watchlist on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setWatchlist([]);
        clearInterval(intervalRef.current);
        return;
      }
      await loadWatchlist(user.uid);
    });
    return () => {
      unsubscribe();
      clearInterval(intervalRef.current);
    };
  }, []);

  const loadWatchlist = async (uid) => {
    try {
      const snapshot = await getDocs(collection(db, "users", uid, "watchlist"));
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWatchlist(loaded);
      // Start auto-refresh if watchlist has items or current stock is shown
      if (loaded.length > 0 || data) startAutoRefresh();
    } catch (err) {
      console.error(err);
      setError("Failed to load watchlist");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setWatchlist([]);
      setData(null);
      setProfile(null);
      clearInterval(intervalRef.current);
    } catch {
      setError("Failed to log out");
    }
  };

  const fetchStockData = async (symbol) => {
    try {
      const [quoteRes, profileRes] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${APIKEY}`),
        axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${APIKEY}`),
      ]);

      const quote = quoteRes.data;
      if (quote.c === 0 && quote.h === 0 && quote.l === 0) {
        return null; // Invalid or no data
      }

      return {
        quote,
        profile: profileRes.data,
      };
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
      return null;
    }
  };

  const searchStock = async (manual = false) => {
    if (!ticker.trim()) return;

    if (manual) setLoading(true);
    setError("");

    const symbol = ticker.toUpperCase();
    const result = await fetchStockData(symbol);

    if (result) {
      setData(result.quote);
      setProfile(result.profile);
      startAutoRefresh(); // Start refreshing this stock
    } else {
      setError("Stock not found or no data available");
      setData(null);
      setProfile(null);
    }

    if (manual) setLoading(false);
  };

  const refreshCurrentStock = async () => {
    if (!data || !ticker) return;
    setRefreshing(true);
    await searchStock(); // Reuses same logic
    setRefreshing(false);
  };

  const refreshWatchlist = async () => {
    if (watchlist.length === 0 && !data) return;

    setRefreshing(true);

    // Refresh current searched stock if visible
    if (data && ticker) {
      const result = await fetchStockData(ticker.toUpperCase());
      if (result) {
        setData(result.quote);
        setProfile(result.profile);
      }
    }

    // Refresh all watchlist items
    if (watchlist.length > 0 && auth.currentUser) {
      const updates = await Promise.all(
        watchlist.map(async (stock) => {
          const result = await fetchStockData(stock.ticker);
          if (result) {
            const updatedStock = {
              ...stock,
              price: result.quote.c,
              change: ((result.quote.c - result.quote.pc) / result.quote.pc) * 100,
              logo: result.profile.logo || stock.logo,
              name: result.profile.name || stock.name,
              updatedAt: serverTimestamp(),
            };

            // Update Firestore
            await setDoc(
              doc(db, "users", auth.currentUser.uid, "watchlist", stock.ticker),
              updatedStock
            );

            return updatedStock;
          }
          return stock; // Keep old if failed
        })
      );

      setWatchlist(updates);
    }

    setRefreshing(false);
  };

  const startAutoRefresh = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(refreshWatchlist, REFRESH_INTERVAL);
  };

  // Initial search on Enter
  useEffect(() => {
    if (ticker) startAutoRefresh();
  }, [data]); // When a stock is successfully loaded

  const addToWatchlist = async () => {
    if (!data || !profile || !auth.currentUser) {
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
        doc(db, "users", auth.currentUser.uid, "watchlist", stockInfo.ticker),
        stockInfo
      );

      setWatchlist((prev) => {
        const filtered = prev.filter((s) => s.ticker !== stockInfo.ticker);
        return [...filtered, stockInfo];
      });

      startAutoRefresh(); // Ensure refresh is running
    } catch {
      setError("Failed to add");
    }
  };

  const removeFromWatchlist = async (tickerToRemove) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "watchlist", tickerToRemove)
      );
      setWatchlist((prev) => prev.filter((s) => s.ticker !== tickerToRemove));

      if (watchlist.length === 1 && data) {
        // If removing last item and no current stock, stop refresh
        if (!data) clearInterval(intervalRef.current);
      }
    } catch {
      setError("Failed to remove");
    }
  };

  const isInWatchlist = (tickerUpper) =>
    watchlist.some((s) => s.ticker === tickerUpper);

  const changeColor = (val) => (val >= 0 ? "text-green-600" : "text-red-600");
  const arrow = (val) => (val >= 0 ? "↑" : "↓");

  const currentTickerUpper = ticker.toUpperCase();

  return (
    <div className="min-h-screen bg-blue-200 text-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Stock Tracker</h1>
          <div className="flex items-center gap-4">
            {refreshing && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm font-medium text-blue-700">Updating...</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 transition text-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center gap-4 mb-8">
          <input
            type="text"
            placeholder="Enter ticker (e.g. AAPL, TSLA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && searchStock(true)}
            className="border-2 border-gray-300 px-5 py-3 rounded-lg w-80 text-lg bg-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => searchStock(true)}
            disabled={loading}
            className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 disabled:bg-gray-400 transition text-lg"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && (
          <p className="text-center text-red-600 text-lg mb-6 font-medium">{error}</p>
        )}

        {/* Current Stock Card */}
        {data && profile && data.c > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 relative">
            <button
              onClick={refreshCurrentStock}
              disabled={refreshing}
              className="absolute top-6 right-6 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 p-3 rounded-lg transition group"
              title="Refresh now"
            >
              <svg 
                className={`h-6 w-6 text-blue-600 group-hover:text-blue-700 group-disabled:text-gray-400 ${refreshing ? "animate-spin" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.582M4.582 4.582a8 8 0 1114.836 0M19.418 19.418a8 8 0 11-14.836 0" />
              </svg>
            </button>

            <div className="flex items-center gap-6 mb-6">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="w-20 h-20 rounded-full border" onError={(e) => (e.target.style.display = "none")} />
              ) : (
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
                  {currentTickerUpper[0] || "?"}
                </div>
              )}
              <div>
                <h2 className="text-3xl font-bold">{currentTickerUpper}</h2>
                <p className="text-lg text-gray-600">{profile.name || "Unknown Company"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Current Price</p>
                <p className="text-3xl font-bold mt-1">${data.c.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Daily Change</p>
                <p className={`text-2xl font-bold mt-1 ${changeColor(data.c - data.pc)}`}>
                  {arrow(data.c - data.pc)} {Math.abs(data.c - data.pc).toFixed(2)} ({Math.abs(((data.c - data.pc) / data.pc) * 100).toFixed(2)}%)
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Previous Close</p>
                <p className="text-2xl font-semibold mt-1">${data.pc.toFixed(2)}</p>
              </div>
            </div>

            <div className="text-center">
              {isInWatchlist(currentTickerUpper) ? (
                <button
                  onClick={() => removeFromWatchlist(currentTickerUpper)}
                  className="bg-red-800 text-white px-10 py-4 rounded-lg hover:bg-red-900 transition text-lg font-medium"
                >
                  Remove from Watchlist
                </button>
              ) : (
                <button
                  onClick={addToWatchlist}
                  className="bg-green-800 text-white px-10 py-4 rounded-lg hover:bg-green-900 transition text-lg font-medium"
                >
                  Add to Watchlist
                </button>
              )}
            </div>
          </div>
        )}

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <>
            <div className="flex items-center justify-center gap-4 mb-8">
              <h2 className="text-3xl font-bold">Your Watchlist</h2>
              <button
                onClick={refreshWatchlist}
                disabled={refreshing}
                className="bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition font-medium shadow-md"
                title="Refresh all stocks"
              >
                Refresh
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {watchlist.map((stock) => {
                const safeTicker = stock.ticker?.toUpperCase() || "???";
                const firstLetter = safeTicker[0] || "?";
                const safeChange = stock.change || 0;

                return (
                  <div key={stock.ticker} className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-2xl transition relative">
                    <button
                      onClick={() => removeFromWatchlist(stock.ticker)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold transition"
                      title="Remove"
                    >
                      ×
                    </button>

                    <div className="flex items-center gap-5 mb-5">
                      {stock.logo ? (
                        <img src={stock.logo} alt={stock.name} className="w-16 h-16 rounded-full border" onError={(e) => (e.target.style.display = "none")} />
                      ) : (
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                          {firstLetter}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-2xl font-bold">{safeTicker}</p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {stock.name || "Unknown Company"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right mb-6">
                      <p className="text-2xl font-bold">${Number(stock.price || 0).toFixed(2)}</p>
                      <p className={`text-lg font-semibold ${changeColor(safeChange)}`}>
                        {arrow(safeChange)} {Math.abs(safeChange).toFixed(2)}%
                      </p>
                    </div>

                    <div className="grid grid-cols-2 text-center text-sm border-t pt-4">
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium text-green-600">Live</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Trend</p>
                        <p className={`font-medium ${changeColor(safeChange)}`}>
                          {safeChange >= 0 ? "Bullish" : "Bearish"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {watchlist.length === 0 && auth.currentUser && !data && (
          <p className="text-center text-gray-600 text-xl mt-20">
            Your watchlist is empty. Search for stocks and add them!
          </p>
        )}
      </div>
    </div>
  );
}
