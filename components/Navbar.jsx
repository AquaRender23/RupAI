
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  ChevronDown,
  CircleUserRound,
  Activity,
} from "lucide-react";

import { useScenario } from "../app/ScenarioContext";

const navigation = [
  { label: "Scenario Simulator", href: "/scenario-simulator" },
  { label: "Market & Sector Impact", href: "/market-overview" },
  { label: "Company Rankings", href: "/company-rankings" },
  { label: "Company Details", href: "/company-details" },
  { label: "Historical Validation", href: "/historical-validation" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { scenario } = useScenario();

  const companyCount = scenario.allCompanies
    ? 15
    : scenario.selectedCompanies.length;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061c30]/95 backdrop-blur-xl">

      <div className="mx-auto flex min-h-[66px] max-w-[1650px] items-center justify-between gap-5 px-5 lg:px-8">

        {/* LOGO */}
        <Link
          href="/scenario-simulator"
          className="flex shrink-0 items-center gap-2"
        >
          <ChartNoAxesCombined
            size={34}
            className="text-cyan-400"
          />

          <span className="text-2xl font-bold tracking-tight text-white">
            Rup<span className="text-cyan-400">AI</span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden items-center gap-5 xl:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative whitespace-nowrap py-6 text-[12px] font-medium transition ${
                  active
                    ? "border-b-[3px] border-cyan-400 text-cyan-300"
                    : "border-b-[3px] border-transparent text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* SCENARIO SUMMARY */}
        <div className="hidden items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#0a2b46] px-3 py-2 lg:flex">

          <Activity size={15} className="text-amber-400" />

          <div>
            <p className="text-[10px] font-semibold text-white">
              {scenario.shockType === "Rupee Depreciation"
                ? `Rupee depreciation · ${scenario.depreciation}%`
                : scenario.shockType}
            </p>

            <p className="text-[9px] text-slate-400">
              {scenario.horizon} · {companyCount}/15 companies
            </p>
          </div>

          <ChevronDown size={13} className="text-slate-400" />
        </div>

        {/* STATUS */}
        <div className="hidden items-center gap-2 whitespace-nowrap lg:flex">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-[10px] font-semibold text-amber-300">
            FRONTEND PREVIEW
          </span>
        </div>

        {/* PROFILE */}
        <button
          aria-label="User profile"
          className="hidden h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-blue-500/30 text-white lg:flex"
        >
          <CircleUserRound size={19} />
        </button>

      </div>

      {/* MOBILE NAV */}
      <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 xl:hidden">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-[11px] ${
              pathname === item.href
                ? "bg-cyan-400/15 text-cyan-300"
                : "text-slate-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

    </header>
  );
}
