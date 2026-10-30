
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useScenario } from "../ScenarioContext";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
} from "lucide-react";

// Temporary frontend preview data.
// Replace with database and ML data during backend integration.
const companies = [
  { name: "Reliance Industries", ticker: "RELIANCE", sector: "Energy & Conglomerates", price: 1450, marketCap: 1950000, baseImpact: 1.8 },
  { name: "Tata Consultancy Services", ticker: "TCS", sector: "Information Technology", price: 3850, marketCap: 1390000, baseImpact: 2.4 },
  { name: "Infosys", ticker: "INFY", sector: "Information Technology", price: 1780, marketCap: 740000, baseImpact: 2.1 },
  { name: "Wipro", ticker: "WIPRO", sector: "Information Technology", price: 520, marketCap: 272000, baseImpact: 1.5 },
  { name: "Hindustan Unilever", ticker: "HINDUNILVR", sector: "FMCG", price: 2450, marketCap: 575000, baseImpact: -0.7 },
  { name: "Sun Pharmaceutical", ticker: "SUNPHARMA", sector: "Pharmaceuticals", price: 1680, marketCap: 403000, baseImpact: 1.2 },
  { name: "Dr. Reddy's Laboratories", ticker: "DRREDDY", sector: "Pharmaceuticals", price: 1240, marketCap: 207000, baseImpact: 1.4 },
  { name: "Cipla", ticker: "CIPLA", sector: "Pharmaceuticals", price: 1490, marketCap: 120000, baseImpact: 0.9 },
  { name: "ONGC", ticker: "ONGC", sector: "Oil & Gas", price: 270, marketCap: 340000, baseImpact: -1.8 },
  { name: "Indian Oil Corporation", ticker: "IOC", sector: "Oil & Gas", price: 165, marketCap: 233000, baseImpact: -1.4 },
  { name: "Tata Motors", ticker: "TATAMOTORS", sector: "Automobile", price: 680, marketCap: 250000, baseImpact: -1.2 },
  { name: "Maruti Suzuki", ticker: "MARUTI", sector: "Automobile", price: 11800, marketCap: 370000, baseImpact: -2.0 },
  { name: "Mahindra & Mahindra", ticker: "M&M", sector: "Automobile", price: 2900, marketCap: 360000, baseImpact: -0.8 },
  { name: "Bajaj Auto", ticker: "BAJAJ-AUTO", sector: "Automobile", price: 9200, marketCap: 256000, baseImpact: -1.1 },
  { name: "Hero MotoCorp", ticker: "HEROMOTOCO", sector: "Automobile", price: 4800, marketCap: 96000, baseImpact: -0.9 },
];

const historicalOptions = [
  "2013 Rupee Pressure",
  "2008 Global Financial Crisis",
  "2018 Rupee Weakness",
  "2020 COVID-19 Shock",
];

function formatMarketCap(value) {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L Cr`;
  }

  return `₹${value.toLocaleString("en-IN")} Cr`;
}

function CompanyCard({ company, depreciation }) {
  // Illustrative frontend-only calculation.
  const impact = company.baseImpact * (depreciation / 10);
  const isPositive = impact >= 0;

  const estimatedPrice = company.price * (1 + impact / 100);
  const estimatedMarketCap = company.marketCap * (1 + impact / 100);

  return (
    <div className="group min-w-0 rounded-2xl border border-white/10 bg-[#101e35]/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-[#142642]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {company.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {company.ticker}
          </p>
        </div>

        <span className="max-w-[48%] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-right text-[10px] text-slate-300">
          {company.sector}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-xs text-slate-400">
          Illustrative stock impact
        </p>

        <div
          className={`mt-2 flex items-center gap-2 text-2xl font-bold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight size={23} />
          ) : (
            <ArrowDownRight size={23} />
          )}
          {isPositive ? "+" : ""}
          {impact.toFixed(2)}%
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Current stock price</span>
          <span className="text-sm font-medium text-slate-200">
            ₹{company.price.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Estimated stock price</span>
          <span className="text-sm font-medium text-white">
            ₹{estimatedPrice.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Current market cap</span>
          <span className="text-sm font-medium text-slate-200">
            {formatMarketCap(company.marketCap)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Estimated market cap</span>
          <span className="text-sm font-medium text-white">
            {formatMarketCap(estimatedMarketCap)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScenarioSimulator() {
  const router = useRouter();

  const { scenario, updateScenario, resetScenario } = useScenario();

  const [selectedCompanies, setSelectedCompanies] = useState(
    companies.map((company) => company.ticker)
  );

  const [filterOpen, setFilterOpen] = useState(false);

  const depreciation = Number(scenario.depreciation);
  const startingRate = Number(scenario.startingRate);

  const estimatedRate = useMemo(() => {
    return startingRate * (1 + depreciation / 100);
  }, [startingRate, depreciation]);

  const visibleCompanies = companies.filter((company) =>
    selectedCompanies.includes(company.ticker)
  );

  const toggleCompany = (ticker) => {
    setSelectedCompanies((previous) =>
      previous.includes(ticker)
        ? previous.filter((item) => item !== ticker)
        : [...previous, ticker]
    );
  };

  const selectAllCompanies = () => {
    setSelectedCompanies(companies.map((company) => company.ticker));
  };

  const clearCompanies = () => {
    setSelectedCompanies([]);
  };

  const positiveCount = visibleCompanies.filter(
    (company) => company.baseImpact * depreciation > 0
  ).length;

  const negativeCount = visibleCompanies.filter(
    (company) => company.baseImpact * depreciation < 0
  ).length;

  const handleRunSimulation = () => {
    updateScenario({
      simulationResult: {
        depreciation,
        startingRate,
        estimatedRate,
        horizon: scenario.horizon,
        historicalReference: scenario.historicalReference,
      },
    });

    router.push("/market-overview");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071326] text-white">
      <Navbar />

      <div className="mx-auto w-full max-w-[1450px] px-5 pb-16 pt-10 sm:px-8 lg:px-12">

        {/* PAGE HEADER */}
        <div className="mb-9">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Activity size={15} />
            Scenario Analysis
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rupee Depreciation Simulator
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Explore how changes in the Indian rupee's value against
            the US dollar could affect companies across different
            sectors of the Indian market.
          </p>
        </div>

        {/* PREVIEW NOTICE */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
          <Activity
            size={18}
            className="mt-0.5 shrink-0 text-amber-300"
          />
          <p className="text-xs leading-5 text-amber-100/80">
            Frontend preview: company impacts and estimated values
            are illustrative examples, not live market data or
            actual ML predictions.
          </p>
        </div>

        {/* DEPRECIATION CONTROL */}
        <section className="min-w-0 rounded-2xl border border-white/10 bg-[#101e35] p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <TrendingDown size={18} className="text-cyan-400" />
                Rupee Depreciation
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Select the percentage depreciation against the US dollar.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-5 py-3 text-right">
              <p className="text-xs text-slate-400">Selected shock</p>
              <p className="mt-1 text-3xl font-bold text-cyan-300">
                {depreciation}%
              </p>
            </div>
          </div>

          {/* FIXED RESPONSIVE SLIDER */}
          <div className="mt-8 w-full min-w-0">
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={depreciation}
              onChange={(e) =>
                updateScenario({
                  depreciation: Number(e.target.value),
                })
              }
              style={{
                "--slider-progress": `${(depreciation / 20) * 100}%`,
              }}
              className="shock-slider block w-full"
            />

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>

          {/* QUICK SELECT */}
          <div className="mt-7 flex flex-wrap gap-2">
            {[0, 5, 8, 10, 15, 20].map((value) => (
              <button
                key={value}
                onClick={() => updateScenario({ depreciation: value })}
                className={`rounded-lg border px-5 py-2 text-sm transition ${
                  depreciation === value
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>

          {/* EXCHANGE RATE */}
          <div className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-white/10 bg-[#0b192d] p-5">
              <p className="text-xs text-slate-400">
                Starting USD/INR rate
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xl text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={scenario.startingRate}
                  onChange={(e) =>
                    updateScenario({
                      startingRate: e.target.value,
                    })
                  }
                  className="w-full min-w-0 bg-transparent text-2xl font-semibold text-white outline-none"
                />
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
              <p className="text-xs text-slate-400">
                Estimated USD/INR rate
              </p>
              <p className="mt-3 text-2xl font-semibold text-cyan-300">
                ₹{estimatedRate.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Based on the selected depreciation
              </p>
            </div>
          </div>
        </section>

        {/* COMPANY IMPACT */}
        <section className="mt-12 min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Building2 size={18} className="text-cyan-400" />
                Company-wise Impact
              </div>
              <h2 className="mt-2 text-2xl font-bold">
                Company Performance Overview
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                View the impact on the companies you select.
              </p>
            </div>

            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Positive
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Negative
              </span>
            </div>
          </div>

          {/* COMPANY FILTER */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-[#101e35] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Filter size={17} className="text-cyan-400" />
                  Filter Companies
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Select the companies you want to analyse.
                </p>
              </div>

              <button
                onClick={() => setFilterOpen(!filterOpen)}
                aria-expanded={filterOpen}
                className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.07] px-4 py-2.5 text-sm text-cyan-300 hover:bg-cyan-400/15"
              >
                <Building2 size={16} />
                {selectedCompanies.length} of {companies.length} selected
                <span className="text-xs">
                  {filterOpen ? "▲" : "▼"}
                </span>
              </button>
            </div>

            {filterOpen && (
              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="mb-4 flex flex-wrap gap-3">
                  <button
                    onClick={selectAllCompanies}
                    className="rounded-lg bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20"
                  >
                    Select All
                  </button>

                  <button
                    onClick={clearCompanies}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {companies.map((company) => {
                    const checked = selectedCompanies.includes(company.ticker);

                    return (
                      <label
                        key={company.ticker}
                        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCompany(company.ticker)}
                          className="h-4 w-4 shrink-0 accent-cyan-400"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {company.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {company.ticker}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COMPANY SUMMARY */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#101e35] p-4">
              <p className="text-xs text-slate-400">Companies displayed</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {visibleCompanies.length}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <p className="text-xs text-slate-400">Positive preview impact</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {positiveCount}
              </p>
            </div>

            <div className="rounded-xl border border-red-400/15 bg-red-400/[0.04] p-4">
              <p className="text-xs text-slate-400">Negative preview impact</p>
              <p className="mt-2 text-2xl font-bold text-red-400">
                {negativeCount}
              </p>
            </div>
          </div>

          {/* FILTERED COMPANY CARDS */}
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCompanies.length > 0 ? (
              visibleCompanies.map((company) => (
                <CompanyCard
                  key={company.ticker}
                  company={company}
                  depreciation={depreciation}
                />
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-[#101e35] px-6 py-12 text-center">
                <Building2 size={30} className="mx-auto text-slate-500" />
                <p className="mt-3 font-semibold text-white">
                  No companies selected
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Select companies using the filter above to view their data.
                </p>
                <button
                  onClick={selectAllCompanies}
                  className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#071326]"
                >
                  Show All Companies
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SIMULATION SETTINGS */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-[#101e35] p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-2">
            <SlidersHorizontal size={19} className="text-cyan-400" />
            <h2 className="text-xl font-bold">Simulation Settings</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Prediction Horizon
              </label>
              <select
                value={scenario.horizon}
                onChange={(e) =>
                  updateScenario({ horizon: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>12 Months</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Period over which the impact will be analysed.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Historical Reference
              </label>
              <select
                value={scenario.historicalReference}
                onChange={(e) =>
                  updateScenario({
                    historicalReference: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {historicalOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Historical event used as a reference for analysis.
              </p>
            </div>
          </div>

          {/* ADVANCED SETTINGS */}
          <details className="mt-8 border-t border-white/10 pt-6">
            <summary className="cursor-pointer list-none text-sm font-semibold text-cyan-300">
              <span className="flex items-center justify-between">
                Advanced Settings
                <SlidersHorizontal size={16} />
              </span>
            </summary>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Confidence Level
                </label>
                <select
                  value={scenario.confidenceLevel}
                  onChange={(e) =>
                    updateScenario({ confidenceLevel: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option>80%</option>
                  <option>85%</option>
                  <option>90%</option>
                  <option>95%</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Sensitivity
                </label>
                <select
                  value={scenario.sensitivity}
                  onChange={(e) =>
                    updateScenario({ sensitivity: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option>Conservative</option>
                  <option>Default</option>
                  <option>Aggressive</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={scenario.historicalAssumptions}
                  onChange={(e) =>
                    updateScenario({
                      historicalAssumptions: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
                Use historical assumptions
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={scenario.sectorAnalysis}
                  onChange={(e) =>
                    updateScenario({
                      sectorAnalysis: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
                Include sector-wise analysis
              </label>
            </div>
          </details>
        </section>

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex flex-col-reverse justify-between gap-4 sm:flex-row">
          <button
            onClick={() => {
              resetScenario();
              setSelectedCompanies(companies.map((company) => company.ticker));
              setFilterOpen(false);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            <RotateCcw size={16} />
            Reset Settings
          </button>

          <button
            onClick={handleRunSimulation}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-7 py-3.5 text-sm font-bold text-[#071326] transition hover:bg-cyan-300"
          >
            <ChartNoAxesCombined size={18} />
            Run Simulation
          </button>
        </div>
      </div>
    </main>
  );
}
