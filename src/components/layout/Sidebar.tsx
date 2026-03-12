"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  ShoppingBag,
  Megaphone,
  Search,
  BarChart3,
  Package,
  Lightbulb,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Shopify", href: "/shopify", icon: ShoppingBag },
  { label: "Meta", href: "/meta", icon: Megaphone },
  { label: "Google", href: "/google", icon: Search },
  { label: "Analytics", href: "/analytics/profitability", icon: BarChart3 },
  { label: "Products", href: "/products", icon: Package },
  { label: "Insights", href: "/insights", icon: Lightbulb },
  { label: "Settings", href: "/settings/business", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[220px] flex-col bg-surface border-r border-border">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-5 border-b border-border">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white text-xs font-bold">
          D
        </span>
        <span className="text-sm font-semibold tracking-wide text-foreground">
          DATASTORE
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-white/[0.08] text-foreground"
                      : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-muted">Brand Data Center</p>
      </div>
    </aside>
  );
}
