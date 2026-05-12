"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

type AuthGateProps = {
  children: React.ReactNode;
};

const STORAGE_KEY = "erp_admin_auth_ok";

export default function AuthGate({ children }: AuthGateProps) {
  const requiredPassword = useMemo(
    () => process.env.NEXT_PUBLIC_APP_PASSWORD || "Admin@777",
    []
  );
  const authedFromStore = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => callback();
      window.addEventListener("storage", handler);
      window.addEventListener("erp-auth", handler as EventListener);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("erp-auth", handler as EventListener);
      };
    },
    () => (typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY)),
    () => null
  );
  const authed = authedFromStore === "1";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === requiredPassword) {
      localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event("erp-auth"));
      setError("");
      setPassword("");
      return;
    }
    setError("Incorrect password.");
  };

  if (authed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-9999 bg-[#0a0c12] text-white flex items-center justify-center">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#0e1018] shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-300">lock</span>
          </div>
          <div>
            <div className="text-lg font-semibold">Admin Access</div>
            <div className="text-xs text-white/50">Enter the password to continue.</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              placeholder="Enter admin password"
              autoFocus
              required
            />
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Unlock
          </button>
          <div className="text-[11px] text-white/40">
            This is a simple client-side gate.
          </div>
        </form>
      </div>
    </div>
  );
}
