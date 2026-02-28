"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Tags,
  PenSquare,
  Settings,
  Power,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Image },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/composer", label: "Composer", icon: PenSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-950 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Power className="w-5 h-5 text-blue-400" />
          X Content Agent
        </h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">X Content Agent v1.0</p>
      </div>
    </aside>
  );
}
