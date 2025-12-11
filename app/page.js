// app/page.js
"use client";

import { useAuth } from "./_utils/authcontent";
import AuthPage from "./_auth/page";
import StockApp from "./StockApp/page";

export default function Home() {
  const { currentUser, loading } = useAuth();

  // Show a nice loading screen while Firebase checks if user is logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-3xl font-light animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // Main logic: 
  // - If user is logged in → show the Stock App
  // - If not logged in → show Login/Signup page
  return <>{currentUser ? <StockApp /> : <AuthPage />}</>;
}