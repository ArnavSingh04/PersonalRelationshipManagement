"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  MessageSquareText,
  Lightbulb,
  Zap,
  Settings,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/messages", label: "Messages", icon: MessageSquareText },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/quick-add", label: "Quick Add", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(pathname, href)
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="flex items-stretch justify-around">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive(pathname, href) ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function FloatingAddButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/contacts/new") || pathname.startsWith("/quick-add")) {
    return null;
  }
  return (
    <Link
      href="/contacts/new"
      aria-label="Add contact"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-300 hover:bg-indigo-700 md:hidden"
    >
      <Plus size={26} />
    </Link>
  );
}
