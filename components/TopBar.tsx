"use client";
import { currentMonth } from "@/lib/format";

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5"
      style={{
        background: "linear-gradient(135deg, #1F4E78 0%, #0d2d4a 100%)",
        borderBottom: "1px solid rgba(59,130,246,0.15)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight tracking-tight">Finance Control</div>
          <div className="text-xs leading-tight" style={{ color: "#60a5fa" }}>Personal Dashboard</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          style={{ color: "#60a5fa" }}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-medium" style={{ color: "#93c5fd" }}>{currentMonth()}</span>
      </div>
    </header>
  );
}
