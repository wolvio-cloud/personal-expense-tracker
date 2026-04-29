"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/obligations",
    label: "Dues",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/pay",
    label: "Pay",
    highlight: true,
    icon: (_active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-7 h-7">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(13,30,48,0.97) 0%, #081525 100%)",
        borderTop: "1px solid rgba(59,130,246,0.12)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          if (tab.highlight) {
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.5)",
                  }}>
                  {tab.icon(false)}
                </div>
                <span className="text-xs font-medium" style={{ color: "#3b82f6" }}>{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center gap-1 min-w-[52px] py-1">
              <span style={{ color: active ? "#60a5fa" : "#4a6d8a", transition: "color 0.15s" }}>
                {tab.icon(active)}
              </span>
              <span className="text-xs font-medium transition-colors"
                style={{ color: active ? "#60a5fa" : "#4a6d8a" }}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
