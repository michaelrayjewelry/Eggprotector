"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Shield } from "lucide-react";

export default function Header() {
  const [killSwitch, setKillSwitch] = useState(false);

  useEffect(() => {
    fetch("/api/settings/kill-switch", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setKillSwitch(d.enabled))
      .catch(() => {});
  }, []);

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {killSwitch && (
          <span className="flex items-center gap-1.5 text-xs bg-red-900/40 text-red-400 border border-red-800 px-2.5 py-1 rounded-full font-medium">
            <Shield className="w-3.5 h-3.5" />
            KILL SWITCH ACTIVE
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => {
            document.cookie = "xcontent_token=; Path=/; Max-Age=0";
            window.location.href = "/login";
          }}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
