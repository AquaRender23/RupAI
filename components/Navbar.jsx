"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronDown } from "lucide-react";
import { useScenario } from "../app/ScenarioContext";

const navLinks = [
  { label: "Simulator", href: "/scenario-simulator" },
  { label: "Market Overview", href: "/market-overview" },
  { label: "Company Rankings", href: "/company-rankings" },
  { label: "Company Details", href: "/company-details" },
  { label: "Historical Validation", href: "/historical-validation" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { scenario } = useScenario();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071326]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1550px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Activity size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              Rup<span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
              Financial Intelligence
            </p>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="order-3 flex w-full gap-2 overflow-x-auto pb-1 lg:order-none lg:w-auto lg:pb-0">
          {navLinks.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* SCENARIO STATUS */}
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">
              Active scenario
            </p>

            <p className="text-xs font-semibold text-slate-200">
              Rupee depreciation · {scenario.depreciation}%
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}