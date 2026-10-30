
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../../components/Navbar";
import { useScenario } from "../ScenarioContext";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Coins,
  Info,
  Landmark,
  LoaderCircle,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ----------------------------------
   COMPANY DATABASE
---------------------------------- */

const companies = [
  { name: "Tata Consultancy Services", ticker: "TCS", sector: "IT Services" },
  { name: "Infosys", ticker: "INFY", sector: "IT Services" },
  { name: "Wipro", ticker: "WIPRO", sector: "IT Services" },

  { name: "InterGlobe Aviation", ticker: "INDIGO", sector: "Aviation" },

  { name: "Sun Pharmaceutical", ticker: "SUNPHARMA", sector: "Pharmaceuticals" },
  { name: "Dr. Reddy's Laboratories", ticker: "DRREDDY", sector: "Pharmaceuticals" },
  { name: "Cipla", ticker: "CIPLA", sector: "Pharmaceuticals" },

  { name: "Oil and Natural Gas Corporation", ticker: "ONGC", sector: "Oil & Gas" },
  { name: "Reliance Industries", ticker: "RELIANCE", sector: "Oil & Gas" },
  { name: "Indian Oil Corporation", ticker: "IOC", sector: "Oil & Gas" },

  { name: "Tata Motors", ticker: "TATAMOTORS", sector: "Automotive" },
  { name: "Maruti Suzuki", ticker: "MARUTI", sector: "Automotive" },
  { name: "Mahindra & Mahindra", ticker: "M&M", sector: "Automotive" },
  { name: "Bajaj Auto", ticker: "BAJAJ-AUTO", sector: "Automotive" },
  { name: "Hero MotoCorp", ticker: "HEROMOTOCO", sector: "Automotive" },
];

const scenarios = [
  "Rupee Depreciation",
  "Oil Price Shock",
  "Interest Rate Rise",
  "Global Recession",
  "New Export Tariffs",
  "Commodity Supply Shock",
  "Sudden Inflation Rise",
];

const historicalEvents = [
  "2013 Rupee Pressure",
  "2008 Global Financial Crisis",
  "2018 Rupee Weakness",
  "2020 COVID-19 Pandemic",
];

/* ----------------------------------
   SMALL REUSABLE COMPONENTS
---------------------------------- */

function SectionTitle({ number, title, icon: Icon }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 text-lg font-bold text-cyan-300">
        {number}
      </div>

      <div className="flex items-center gap-2">
        {Icon && <Icon size={19} className="text-cyan-400" />}
        <h2 className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h2>
      </div>
    </div>
  );
}

function Label({ children, info = false }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
      {children}
      {info && <CircleHelp size={14} className="text-slate-400" />}
    </div>
  );
}

function SelectBox({ value, onChange, options }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border border-cyan-100/20 bg-[#0b2c47]/90 px-4 py-3 pr-10 text-sm text-white outline-none transition hover:border-cyan-400/50 focus:border-cyan-400"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#09233b]"
          >
            {option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

/* ----------------------------------
   HISTORICAL EXCHANGE RATE CHART
---------------------------------- */

function HistoricalChart() {
  const values = [
    62, 64, 65, 63, 66, 67, 69, 68, 71,
    70, 73, 74, 72, 76, 77, 75, 78, 79,
    81, 80, 82, 84, 83, 86, 85, 88, 90, 92,
  ];

  const points = values.map((value, index) => {
    const x = 40 + index * 29;
    const y = 180 - ((value - 50) / 50) * 145;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mt-5 rounded-xl border border-cyan-100/15 bg-[#061c30]/70 p-4">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-cyan-400" />

          <h3 className="text-sm font-semibold text-white">
            Historical USD/INR Exchange Rate
          </h3>

          <CircleHelp size={13} className="text-slate-500" />
        </div>

        <span className="text-[9px] text-amber-300">
          Illustrative chart
        </span>
      </div>

      <svg
        viewBox="0 0 850 205"
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="scenarioArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38cafa" stopOpacity=".28" />
            <stop offset="100%" stopColor="#38cafa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[35, 70, 105, 140, 180].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2="820"
            y2={y}
            stroke="#94b9d0"
            strokeOpacity=".14"
            strokeDasharray="4 5"
          />
        ))}

        <polygon
          points={`40,180 ${points} 823,180`}
          fill="url(#scenarioArea)"
        />

        <polyline
          points={points}
          fill="none"
          stroke="#35d5ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="823" cy="58" r="5" fill="#35d5ff" />
      </svg>

      <div className="flex justify-between px-2 text-[10px] text-slate-400">
        {["2020", "2021", "2022", "2023", "2024", "2025"].map((year) => (
          <span key={year}>{year}</span>
        ))}
      </div>

      <p className="mt-3 border-t border-white/10 pt-3 text-[10px] text-slate-500">
        Replace this illustrative series with your historical USD/INR dataset.
      </p>

    </div>
  );
}

/* ----------------------------------
   COMPANY SELECTOR MODAL
---------------------------------- */

function CompanyModal({
  open,
  onClose,
  selected,
  onChange,
  allCompanies,
  setAllCompanies,
}) {
  const [search, setSearch] = useState("");

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      `${company.name} ${company.ticker} ${company.sector}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  if (!open) return null;

  const toggleCompany = (ticker) => {
    setAllCompanies(false);

    if (selected.includes(ticker)) {
      onChange(selected.filter((item) => item !== ticker));
    } else {
      onChange([...selected, ticker]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">

      <div className="flex max-h-[85vh] w-full max-w-[570px] flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#09243d] shadow-2xl">

        <div className="flex items-center justify-between border-b border-white/10 p-5">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Select Companies
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Choose the companies to include in your analysis.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close company selector"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>

        </div>

        <div className="space-y-3 p-5">

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-3">
            <input
              type="checkbox"
              checked={allCompanies}
              onChange={(e) => {
                setAllCompanies(e.target.checked);
                if (e.target.checked) onChange([]);
              }}
              className="accent-cyan-400"
            />

            <span className="text-sm font-medium text-white">
              Analyse all 15 companies
            </span>
          </label>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or ticker..."
              className="w-full rounded-lg border border-white/15 bg-[#061a2d] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-5">

          {filteredCompanies.map((company) => {
            const checked = selected.includes(company.ticker);

            return (
              <label
                key={company.ticker}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.07] p-3 transition hover:border-cyan-400/30 hover:bg-white/[0.04]"
              >
                <input
                  type="checkbox"
                  checked={allCompanies || checked}
                  disabled={allCompanies}
                  onChange={() => toggleCompany(company.ticker)}
                  className="accent-cyan-400"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {company.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {company.ticker} · {company.sector}
                  </p>
                </div>

                {checked && !allCompanies && (
                  <Check size={17} className="text-cyan-400" />
                )}

              </label>
            );
          })}

          {filteredCompanies.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No matching companies found.
            </p>
          )}

        </div>

        <div className="flex items-center justify-between border-t border-white/10 p-5">

          <span className="text-xs text-slate-400">
            {allCompanies ? 15 : selected.length} companies selected
          </span>

          <button
            onClick={onClose}
            disabled={!allCompanies && selected.length === 0}
            className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-[#052238] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm Selection
          </button>

        </div>

      </div>

    </div>
  );
}

/* ----------------------------------
   PROGRESS MODAL
---------------------------------- */

const stages = [
  "Preparing scenario",
  "Estimating macroeconomic responses using Model 1",
  "Analysing company-level responses using Model 2",
  "Generating rankings, sector summaries and prediction ranges",
];

function SimulationProgress({ step }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">

      <div className="w-full max-w-[480px] rounded-2xl border border-cyan-200/20 bg-[#09243d] p-7 shadow-2xl">

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Activity size={30} />
        </div>

        <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-300">
          RUPAI ANALYSIS ENGINE
        </p>

        <h2 className="mt-2 text-xl font-bold text-white">
          Running Simulation
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Your scenario is being processed through the analysis pipeline.
        </p>

        <div className="mt-7 space-y-5">

          {stages.map((stage, index) => {
            const completed = index < step;
            const active = index === step;

            return (
              <div key={stage} className="flex items-center gap-3">

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    completed
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                      : active
                      ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                      : "border-white/15 text-slate-500"
                  }`}
                >
                  {completed ? (
                    <Check size={16} />
                  ) : active ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                <p
                  className={`text-xs ${
                    active
                      ? "font-semibold text-white"
                      : completed
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }`}
                >
                  {stage}
                </p>

              </div>
            );
          })}

        </div>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-500">
          Please keep this page open while processing.
        </p>

      </div>

    </div>
  );
}

/* ----------------------------------
   MAIN PAGE
---------------------------------- */

export default function ScenarioSimulator() {
  const router = useRouter();

  const {
    scenario,
    updateScenario,
    resetScenario,
  } = useScenario();

  const [companyModal, setCompanyModal] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(
    String(scenario.startingRate)
  );

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const depreciation = Number(scenario.depreciation);
  const startingRate = Number(scenario.startingRate);

  const estimatedRate =
    startingRate * (1 + depreciation / 100);

  const update = (key, value) => {
    updateScenario({ [key]: value });
  };

  const companyCount = scenario.allCompanies
    ? 15
    : scenario.selectedCompanies.length;

  const chooseRate = (value) => {
    update("depreciation", value);
  };

  const saveRate = () => {
    const parsed = Number(rateInput);

    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 500) {
      update("startingRate", parsed);
      setEditingRate(false);
    } else {
      setError("Enter a valid starting exchange rate.");
    }
  };

  const handleReset = () => {
    resetScenario();
    setRateInput("83.5");
    setError("");
  };

  const runSimulation = async () => {
    setError("");

    if (!Number.isFinite(startingRate) || startingRate <= 0) {
      setError("Please enter a valid starting exchange rate.");
      return;
    }

    if (!scenario.allCompanies && scenario.selectedCompanies.length === 0) {
      setError("Please select at least one company.");
      return;
    }

    setRunning(true);
    setProgress(0);

    try {
      const payload = {
        ...scenario,
        depreciation: Number(scenario.depreciation),
        startingRate,
        estimatedRate,
        companyCount,
      };

      // Progress stages are shown while the backend processes the request.
      const responsePromise = fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      for (let i = 1; i <= 3; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 550));
      }

      const response = await responsePromise;

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.message ||
          `Simulation API returned status ${response.status}.`
        );
      }

      const result = await response.json();

      setProgress(4);

      updateScenario({
        simulationResult: result,
      });

      await new Promise((resolve) => setTimeout(resolve, 450));

      router.push("/market-overview");

    } catch (err) {
      console.error("Simulation failed:", err);

      setError(
        err.message ||
        "Simulation failed. Please check your backend connection and try again."
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#06182b] bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: `
          linear-gradient(
            100deg,
            rgba(3, 18, 34, .88),
            rgba(3, 24, 43, .80),
            rgba(3, 17, 32, .91)
          ),
          url('/images/rupai-bg.jpeg')
        `,
      }}
    >

      <Navbar />

      <div className="mx-auto max-w-[1550px] px-5 pb-10 pt-7 lg:px-10">

        {/* PAGE HEADER */}
        <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-cyan-300">
              SCENARIO SIMULATOR
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[42px]">
              Simulate a{" "}
              <span className="text-cyan-300">
                Rupee Shock
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Explore how rupee depreciation could affect Indian markets,
              sectors and company performance through intelligent
              scenario analysis.
            </p>
          </div>

          <div className="flex max-w-[380px] items-center gap-4 rounded-xl border border-cyan-200/20 bg-[#082943]/75 p-4 backdrop-blur-xl">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <ChartNoAxesCombinedIcon />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Understand the impact
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-300">
                Trace the movement from currency shocks to
                macroeconomic responses and company earnings.
              </p>
            </div>

          </div>

        </section>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* SCENARIO CONFIGURATION */}
            <section className="rounded-2xl border border-cyan-100/20 bg-[#092943]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

              <SectionTitle
                number="1"
                title="Scenario & Shock Configuration"
              />

              {/* SCENARIO TYPE */}
              <div className="mb-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-[180px_1fr]">

                <Label>Scenario type</Label>

                <SelectBox
                  value={scenario.shockType}
                  onChange={(e) => update("shockType", e.target.value)}
                  options={scenarios}
                />

              </div>

              {/* DEPRECIATION SLIDER */}
              <div className="mb-7">

                <div className="flex flex-wrap items-end justify-between gap-3">

                  <div>
                    <Label info>
                      {scenario.shockType === "Rupee Depreciation"
                        ? "Depreciation shock"
                        : "Shock size"}
                    </Label>

                    <p className="text-5xl font-bold tracking-tight text-[#F4B942]">
                      {depreciation}%
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.08] px-3 py-2 text-[10px] text-amber-200">
                    Adjustable shock size
                  </div>

                </div>

                <div className="mt-6 px-2">

                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={depreciation}
                    onChange={(e) => chooseRate(Number(e.target.value))}
                    className="shock-slider w-full"
                    style={{
                      "--slider-progress": `${(depreciation / 20) * 100}%`,
                    }}
                    aria-label="Depreciation shock percentage"
                  />

                  <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                    {[0, 5, 10, 15, 20].map((value) => (
                      <span key={value}>{value}%</span>
                    ))}
                  </div>

                </div>

                {/* QUICK SELECT */}
                <div className="mt-5 grid grid-cols-5 gap-2">

                  {[5, 8, 10, 15, 20].map((value) => (
                    <button
                      key={value}
                      onClick={() => chooseRate(value)}
                      className={`rounded-lg border py-2.5 text-xs font-semibold transition ${
                        depreciation === value
                          ? "border-amber-300 bg-[#F4B942] text-[#172337] shadow-[0_0_18px_rgba(244,185,66,.2)]"
                          : "border-white/15 bg-[#0b2d48] text-slate-200 hover:border-amber-300/60 hover:text-amber-200"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}

                </div>

              </div>

              {/* EXCHANGE RATE PREVIEW */}
              <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">

                {/* STARTING RATE */}
                <div className="rounded-xl border border-white/10 bg-[#123650]/80 p-4">

                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <Coins size={17} className="text-cyan-300" />
                    Starting USD/INR
                    <Info size={13} className="text-slate-500" />
                  </div>

                  {editingRate ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-cyan-300/30 bg-[#061c30] px-2 py-2 text-lg text-white outline-none"
                      />

                      <button
                        onClick={saveRate}
                        className="rounded-lg bg-cyan-400 px-3 text-sm font-bold text-[#052238]"
                      >
                        <Check size={17} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">
                        ₹{startingRate.toFixed(2)}
                      </span>

                      <button
                        onClick={() => {
                          setRateInput(String(startingRate));
                          setEditingRate(true);
                        }}
                        className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                        aria-label="Edit starting exchange rate"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[9px] text-slate-400">
                    User-configurable baseline · Not live data
                  </p>

                </div>

                {/* ARROW */}
                <div className="flex flex-row items-center justify-center gap-2 py-2 md:flex-col">
                  <ArrowRight size={25} className="text-cyan-300" />
                  <span className="text-sm font-bold text-[#F4B942]">
                    +{depreciation.toFixed(1)}%
                  </span>
                </div>

                {/* ESTIMATED RATE */}
                <div className="rounded-xl border border-cyan-300/20 bg-gradient-to-br from-[#125078] to-[#0c304c] p-4">

                  <div className="flex items-center gap-2 text-[11px] text-slate-200">
                    <TrendingUp size={18} className="text-cyan-300" />
                    Estimated after shock
                  </div>

                  <p className="mt-2 text-2xl font-bold text-white">
                    ₹{estimatedRate.toFixed(2)}
                  </p>

                  <p className="mt-2 text-[9px] text-slate-300">
                    Illustrative arithmetic preview
                  </p>

                </div>

              </div>

              {/* HISTORICAL REFERENCE */}
              <div className="mt-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-[180px_1fr]">

                <Label>
                  Historical reference
                </Label>

                <SelectBox
                  value={scenario.historicalReference}
                  onChange={(e) =>
                    update("historicalReference", e.target.value)
                  }
                  options={historicalEvents}
                />

              </div>

            </section>

            {/* HISTORICAL CHART */}
            <HistoricalChart />

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* SIMULATION SETTINGS */}
            <section className="rounded-2xl border border-cyan-100/20 bg-[#092943]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

              <SectionTitle
                number="2"
                title="Simulation Settings"
                icon={Settings2}
              />

              {/* PREDICTION HORIZON */}
              <div className="mb-7">

                <Label info>
                  Prediction horizon
                </Label>

                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-[#061d31] p-1">

                  {["1 Month", "3 Months", "6 Months"].map((period) => (
                    <button
                      key={period}
                      onClick={() => update("horizon", period)}
                      className={`rounded-md py-3 text-xs font-semibold transition ${
                        scenario.horizon === period
                          ? "bg-[#F4B942] text-[#172337]"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {period}
                    </button>
                  ))}

                </div>

              </div>

              {/* COMPANY SELECTION */}
              <div>

                <Label info>
                  Companies to analyse
                </Label>

                <div className="space-y-3">

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="companySelection"
                      checked={scenario.allCompanies}
                      onChange={() => {
                        updateScenario({
                          allCompanies: true,
                          selectedCompanies: [],
                        });
                      }}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    All 15 companies
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="companySelection"
                        checked={!scenario.allCompanies}
                        onChange={() => {
                          update("allCompanies", false);
                        }}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      Select companies
                    </label>

                    <button
                      onClick={() => {
                        update("allCompanies", false);
                        setCompanyModal(true);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-cyan-200/25 bg-[#0c3450] px-4 py-3 text-xs font-medium text-white transition hover:border-cyan-400 hover:bg-cyan-400/10"
                    >
                      <Users size={16} className="text-cyan-300" />
                      Choose companies
                    </button>

                  </div>

                  {!scenario.allCompanies && (
                    <p className="text-[10px] text-cyan-300">
                      {companyCount} of 15 companies selected
                    </p>
                  )}

                </div>

              </div>

              {/* ADVANCED SETTINGS */}
              <div className="mt-7 border-t border-white/10 pt-5">

                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-white"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 size={19} className="text-cyan-300" />
                    Advanced settings
                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition ${
                      advancedOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {advancedOpen && (
                  <div className="mt-5 space-y-5">

                    {/* CONFIDENCE */}
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_150px]">

                      <Label info>
                        Prediction interval
                      </Label>

                      <SelectBox
                        value={scenario.confidenceLevel}
                        onChange={(e) =>
                          update("confidenceLevel", e.target.value)
                        }
                        options={["80%", "90%", "95%"]}
                      />

                    </div>

                    {/* HISTORICAL ASSUMPTIONS */}
                    <div className="flex items-center justify-between gap-3">

                      <span className="text-xs text-slate-300">
                        Use historical reference for macro assumptions
                      </span>

                      <input
                        type="checkbox"
                        checked={scenario.historicalAssumptions}
                        onChange={(e) =>
                          update("historicalAssumptions", e.target.checked)
                        }
                        className="rupai-toggle"
                      />

                    </div>

                    {/* SECTOR ANALYSIS */}
                    <div className="flex items-center justify-between gap-3">

                      <span className="text-xs text-slate-300">
                        Include sector-level analysis
                      </span>

                      <input
                        type="checkbox"
                        checked={scenario.sectorAnalysis}
                        onChange={(e) =>
                          update("sectorAnalysis", e.target.checked)
                        }
                        className="rupai-toggle"
                      />

                    </div>

                    {/* SENSITIVITY */}
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_150px]">

                      <Label>Model sensitivity</Label>

                      <SelectBox
                        value={scenario.sensitivity}
                        onChange={(e) =>
                          update("sensitivity", e.target.value)
                        }
                        options={[
                          "Conservative",
                          "Default",
                          "High Sensitivity",
                        ]}
                      />

                    </div>

                    {/* MACRO VARIABLES */}
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_150px]">

                      <Label>Additional macro variables</Label>

                      <SelectBox
                        value={scenario.macroVariables}
                        onChange={(e) =>
                          update("macroVariables", e.target.value)
                        }
                        options={[
                          "Standard Set",
                          "Extended Set",
                          "Custom Set",
                        ]}
                      />

                    </div>

                  </div>
                )}

              </div>

            </section>

            {/* SIMULATION SUMMARY */}
            <section className="rounded-xl border border-amber-300/15 bg-[#102c43]/90 p-4">

              <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-amber-300">
                YOUR SCENARIO SUMMARY
              </p>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-[10px] text-slate-400">
                    Shock size
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#F4B942]">
                    {depreciation}%
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">
                    Prediction horizon
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {scenario.horizon}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">
                    Companies
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {companyCount} / 15
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">
                    Confidence interval
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {scenario.confidenceLevel}
                  </p>
                </div>

              </div>

            </section>

            {/* RUN SIMULATION BUTTON */}
            <button
              onClick={runSimulation}
              disabled={running}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-cyan-200/30 bg-gradient-to-r from-[#F4B942] via-[#f6ca67] to-[#48d8ee] p-4 text-[#10263b] shadow-[0_8px_30px_rgba(48,202,231,.12)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#102e48]/15">
                {running ? (
                  <LoaderCircle size={25} className="animate-spin" />
                ) : (
                  <BarChart3 size={25} />
                )}
              </div>

              <div className="flex-1 text-left">
                <p className="text-base font-bold">
                  {running ? "Processing..." : "Run Simulation"}
                </p>

                <p className="mt-1 text-[10px] opacity-75">
                  Model 1 (Macroeconomic) + Model 2 (Company-level)
                </p>
              </div>

              {!running && (
                <ArrowRight
                  size={22}
                  className="transition group-hover:translate-x-1"
                />
              )}

            </button>

            {/* RESET */}
            <button
              onClick={handleReset}
              disabled={running}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0a253b]/80 py-3 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-40"
            >
              <RotateCcw size={14} />
              Reset to defaults
            </button>

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
              >
                {error}
              </div>
            )}

          </div>

        </div>

        {/* FOOTER NOTE */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">

          <p className="text-[10px] text-slate-400">
            RupAI · Financial Market Scenario Intelligence
          </p>

          <p className="text-[10px] text-slate-500">
            Model estimates are not guaranteed outcomes or investment advice.
          </p>

        </div>

      </div>

      {/* MODALS */}
      <CompanyModal
        open={companyModal}
        onClose={() => setCompanyModal(false)}
        selected={scenario.selectedCompanies}
        onChange={(value) => update("selectedCompanies", value)}
        allCompanies={scenario.allCompanies}
        setAllCompanies={(value) => update("allCompanies", value)}
      />

      {running && <SimulationProgress step={progress} />}

    </main>
  );
}

function ChartNoAxesCombinedIcon() {
  return <Activity size={27} />;
}
