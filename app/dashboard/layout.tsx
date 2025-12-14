"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { Link as VTLink } from "next-view-transitions";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Bell,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/dashboard/objects", label: "Объекты", icon: Building2 },
  { href: "/dashboard/shifts", label: "Смены", icon: Briefcase },
  { href: "/dashboard/notifications", label: "Уведомления", icon: Bell },
  { href: "/dashboard/profile", label: "Профиль", icon: User },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col bg-white border-r border-gray-200 px-3 py-4 transition-all duration-200 ${
          collapsed ? "md:w-16" : "md:w-64"
        }`}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          {!collapsed && <div className="text-lg font-semibold">Smenuberu</div>}

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50"
            title="Свернуть меню"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <VTLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 ${
                  active ? "text-gray-900" : "text-gray-700"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 text-gray-600" />
                {!collapsed && <span>{item.label}</span>}
              </VTLink>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main
        className={`p-4 pb-28 md:p-10 transition-all duration-200 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {children}
      </main>

      {/* Mobile glass bottom nav + liquid bubble (NO view transitions here) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 mobile-bottom-bar">
        <div
          className="
            relative
            flex justify-around items-center
            h-14 rounded-2xl
            bg-white/70
            backdrop-blur-xl backdrop-saturate-150
            shadow-[0_10px_30px_rgba(0,0,0,0.12)]
            border border-white/40
          "
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <NextLink
                key={item.href}
                href={item.href}
                scroll={false}
                className="relative flex items-center justify-center w-full h-full"
                aria-label={item.label}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-tab-bubble"
                    className="absolute inset-2 rounded-2xl bg-black/10"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}

                <span className="relative z-10">
                  <Icon className="h-6 w-6 text-gray-800" />
                </span>
              </NextLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
