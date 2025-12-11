// Improved Auth Page with consistent dark theme and enhanced UI
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_utils/authcontent";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  const googleSignIn = async () => {
    try {
      setError("");
      await loginWithGoogle();
      router.push("/");
    } catch (err) {
      setError("Google sign-in failed");
    }
  };

  const continueAsGuest = () => {
    router.push("/StockApp");
  };

  return (
    <div className="min-h-screen bg-blue-200 flex items-center justify-center px-4 py-10">
      <div className="bg-gray-700/80 backdrop-blur-xl border border-gray-600 p-10 shadow-[0_0_40px_rgba(0,0,0,0.4)] w-full max-w-md animate-fadeIn">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            StockCentral
          </h1>
          <p className="text-gray-300 text-sm">
            Track your favorite stocks with real updates
          </p>
        </div>

        {/* Welcome Text */}
        <h2 className="text-3xl font-semibold text-center text-white mb-6">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center shadow-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submitHandler} className="space-y-5">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition shadow-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition shadow-sm"
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-4 rounded-lg transition transform hover:scale-[1.02] active:scale-100 shadow-lg"
          >
            {isLogin ? "Log In" : "Create Account"}
          </button>
        </form>

        {/* Google Sign In */}
        <button
          onClick={googleSignIn}
          className="w-full mt-5 bg-white text-gray-900 font-medium py-3.5 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 6.75c1.63 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Toggle Login/Signup */}
        <p className="text-center text-gray-300">
          {isLogin ? "Create an account" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 hover:text-purple-300 font-large underline-offset-4 hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>

        {/* Guest Access */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <button
            onClick={continueAsGuest}
            className="w-full text-gray-300 hover:text-white font-medium py-3 rounded-lg border border-gray-600 hover:border-gray-500 transition shadow-sm"
          >
            Continue as Guest (no save features)
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Guest mode lets you view stocks but won't save added ones
        </p>
      </div>
    </div>
  );
}