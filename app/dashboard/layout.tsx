"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col bg-white border-r border-gray-200 px-3 py-4 transition-all duration-200 ${
          collapsed ? "md:w-16" : "md:w-64"
        }`}
      >
        {/* Top */}
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

        {/* Nav */}
        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 text-gray-600" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main
        className={`p-4 pb-20 md:p-10 transition-all duration-200 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
