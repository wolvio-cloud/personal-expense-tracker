"use client";
import { currentMonth } from "@/lib/format";

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: "#1F4E78" }}
    >
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-white font-bold text-lg tracking-tight">Finance Control</span>
      </div>
      <span className="text-blue-200 text-sm">{currentMonth()}</span>
    </header>
  );
}
