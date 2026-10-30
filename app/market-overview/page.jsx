
"use client";

import { useState } from "react";

import Navbar from "../../components/Navbar";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Coins,
  History,
  Landmark,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

/* ------------------------------------------
   ILLUSTRATIVE MARKET DATA
------------------------------------------ */

const ranges = ["1M", "6M", "1Y", "5Y", "10Y", "All"];

const chartData = {
  "1M": [91.1, 91.3, 91.2, 91.5, 91.4, 91.7, 91.6, 91.9, 91.8, 92.1, 92.0, 92.4],
  "6M": [89.2, 89.5, 89.3, 89.8, 89.7, 90.1, 89.9, 90.4, 90.2, 90.9, 91.2, 92.4],
  "1Y": [86.1, 86.5, 86.3, 87.2, 87.0, 87.8, 88.1, 87.9, 89.0, 89.8, 91.0, 92.4],
  "5Y": [73, 74, 73.5, 75, 74.5, 76, 77, 76, 78, 79, 78, 80, 81, 80, 82, 83, 82, 84, 85, 84, 86, 85, 88, 89, 87, 90, 89, 92.4],
  "10Y": [66, 67, 68, 67, 69, 70, 69, 71, 72, 73, 72, 74, 75, 76, 75, 78, 79, 80, 81, 80, 82, 84, 85, 87, 89, 90, 92.4],
  "All": [44, 46, 45, 48, 49, 51, 50, 53, 55, 54, 58, 60, 59, 62, 65, 64, 68, 70, 72, 75, 74, 78, 80, 83, 86, 89, 92.4],
};

const indicators = [
  {
    name: "CPI Inflation",
    value: "5.1%",
    change: "+0.3%",
    status: "negative",
    icon: BarChart3,
  },
  {
    name: "RBI Repo Rate",
    value: "6.50%",
    change: "No change",
    status: "neutral",
    icon: Percent,
  },
  {
    name: "10Y G-Sec Yield",
    value: "7.12%",
    change: "+0.04%",
    status: "negative",
    icon: TrendingUp,
  },
  {
    name: "Import Bill",
    value: "$61.3 Bn",
    change: "+0.2%",
    status: "negative",
    icon: Coins,
  },
];

const historicalEpisodes = [
  {
    year: "1991",
    title: "Balance of Payments Crisis",
    description: "Major currency adjustment",
    color: "red",
  },
  {
    year: "2008",
    title: "Global Financial Crisis",
    description: "Global risk-off pressure",
    color: "red",
  },
  {
    year: "2013",
    title: "Taper Tantrum",
    description: "Capital outflow pressure",
    color: "cyan",
  },
  {
    year: "2020",
    title: "COVID-19 Pandemic",
    description: "Global market uncertainty",
    color: "cyan",
  },
];

/* ------------------------------------------
   EXCHANGE RATE CHART
------------------------------------------ */

function ExchangeRateChart({ selectedRange, setSelectedRange }) {
  const values = chartData[selectedRange];

  const minValue = 40;
  const maxValue = 100;

  const chartWidth = 740;
  const chartHeight = 235;
  const leftPadding = 45;
  const rightPadding = 10;
  const topPadding = 12;
  const bottomPadding = 15;

  const xPosition = (index) =>
    leftPadding +
    (index / (values.length - 1)) *
      (chartWidth - leftPadding - rightPadding);

  const yPosition = (value) =>
    chartHeight -
    bottomPadding -
    ((value - minValue) / (maxValue - minValue)) *
      (chartHeight - topPadding - bottomPadding);

  const points = values
    .map((value, index) => `${xPosition(index)},${yPosition(value)}`)
    .join(" ");

  const areaPoints =
    `${leftPadding},${chartHeight - bottomPadding} ` +
    points +
    ` ${xPosition(values.length - 1)},${chartHeight - bottomPadding}`;

  const finalX = xPosition(values.length - 1);
  const finalY = yPosition(values[values.length - 1]);

  const yearLabels = {
    "1M": ["01 Oct", "08 Oct", "15 Oct", "22 Oct", "31 Oct"],
    "6M": ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    "1Y": ["Nov", "Jan", "Mar", "May", "Jul", "Sep", "Oct"],
    "5Y": ["2021", "2022", "2023", "2024", "2025"],
    "10Y": ["2016", "2018", "2020", "2022", "2024", "2026"],
    "All": ["1991", "2000", "2010", "2015", "2020", "2026"],
  };

  return (
    <div>

      {/* CHART TITLE AND RANGE */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">
              USD/INR Exchange Rate
            </h2>

            <CircleHelp size={15} className="text-slate-400" />
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            Historical rupee movement against the US dollar
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#061d33]/70 p-1">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${
                selectedRange === range
                  ? "bg-cyan-400 text-[#05243b]"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

      </div>

      {/* RATE VALUE */}
      <div className="mt-5 flex flex-wrap items-end gap-3">

        <span className="text-4xl font-bold tracking-tight text-white">
          ₹92.40
        </span>

        <div className="mb-1 flex items-center gap-1 text-sm font-semibold text-red-400">
          <ArrowUpRight size={16} />
          +0.82 (0.90%)
        </div>

        <span className="mb-1 text-[10px] text-slate-400">
          Illustrative demo value
        </span>

      </div>

      {/* CHART */}
      <div className="mt-5 w-full overflow-hidden">

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-auto w-full overflow-visible"
          preserveAspectRatio="none"
        >

          <defs>
            <linearGradient
              id="rupaiChartGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#22c8f4"
                stopOpacity="0.32"
              />

              <stop
                offset="100%"
                stopColor="#22c8f4"
                stopOpacity="0.01"
              />
            </linearGradient>

            <filter id="rupaiGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* GRID */}
          {[100, 90, 80, 70, 60, 50, 40].map((value) => {
            const y = yPosition(value);

            return (
              <g key={value}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={chartWidth - rightPadding}
                  y2={y}
                  stroke="#8db5d1"
                  strokeOpacity="0.16"
                  strokeDasharray="3 5"
                />

                <text
                  x="2"
                  y={y + 4}
                  fontSize="12"
                  fill="#a5bacb"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* VERTICAL GRID */}
          {[0, 1, 2, 3, 4].map((index) => {
            const x =
              leftPadding +
              (index / 4) * (chartWidth - leftPadding - rightPadding);

            return (
              <line
                key={index}
                x1={x}
                y1={topPadding}
                x2={x}
                y2={chartHeight - bottomPadding}
                stroke="#8db5d1"
                strokeOpacity="0.10"
              />
            );
          })}

          {/* AREA */}
          <polygon
            points={areaPoints}
            fill="url(#rupaiChartGradient)"
          />

          {/* LINE */}
          <polyline
            points={points}
            fill="none"
            stroke="#35d7ff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#rupaiGlow)"
          />

          {/* END POINT */}
          <circle
            cx={finalX}
            cy={finalY}
            r="6"
            fill="#39dafa"
            stroke="#e0faff"
            strokeWidth="2"
          />

          {/* LAST VALUE LABEL */}
          <rect
            x={finalX - 72}
            y={Math.max(2, finalY - 43)}
            width="68"
            height="34"
            rx="6"
            fill="#082b48"
            stroke="#27bfe8"
            strokeOpacity="0.65"
          />

          <text
            x={finalX - 38}
            y={Math.max(2, finalY - 43) + 13}
            fill="#d9f7ff"
            fontSize="10"
            textAnchor="middle"
          >
            92.40
          </text>

          <text
            x={finalX - 38}
            y={Math.max(2, finalY - 43) + 25}
            fill="#93b9d0"
            fontSize="8"
            textAnchor="middle"
          >
            Latest
          </text>

        </svg>

        {/* X AXIS */}
        <div className="flex justify-between pl-10 pr-1 text-[10px] text-slate-400">
          {yearLabels[selectedRange].map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

      </div>

      {/* CHART FOOTER */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          USD/INR historical trend
        </div>

        <span className="text-[10px] text-slate-500">
          Higher USD/INR = weaker rupee
        </span>

      </div>

    </div>
  );
}

/* ------------------------------------------
   ECONOMIC INDICATOR CARD
------------------------------------------ */

function IndicatorCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0c2b45]/75 px-3 py-3 transition hover:border-cyan-300/30 hover:bg-[#123853]/90">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-300">
          {item.name}
        </p>

        <p className="mt-1 text-lg font-semibold text-white">
          {item.value}
        </p>
      </div>

      <div className="text-right">

        {item.status === "negative" && (
          <span className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-red-400">
            <ArrowUpRight size={12} />
            {item.change}
          </span>
        )}

        {item.status === "positive" && (
          <span className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-emerald-400">
            <ArrowDownRight size={12} />
            {item.change}
          </span>
        )}

        {item.status === "neutral" && (
          <span className="text-[10px] text-slate-400">
            {item.change}
          </span>
        )}

        <p className="mt-1 text-[9px] text-slate-500">
          Demo data
        </p>

      </div>

    </div>
  );
}

/* ------------------------------------------
   HISTORICAL EPISODES
------------------------------------------ */

function HistoricalEpisodes() {
  return (
    <section className="mt-6">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <History size={19} className="text-cyan-400" />

          <h2 className="text-base font-semibold text-white">
            Historical Depreciation Episodes
          </h2>
        </div>

        <button className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">
          Explore historical events
          <ArrowRight size={13} />
        </button>

      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {historicalEpisodes.map((episode) => (
          <div
            key={episode.year}
            className="group flex min-h-[105px] items-start gap-3 rounded-xl border border-white/10 bg-[#0a2942]/80 p-4 backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-400/40"
          >

            <div
              className={`mt-1 h-10 w-[3px] shrink-0 rounded-full ${
                episode.color === "red"
                  ? "bg-red-400"
                  : "bg-cyan-400"
              }`}
            />

            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                {episode.year}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-200">
                {episode.title}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {episode.description}
              </p>
            </div>

            <ArrowUpRight
              size={14}
              className="ml-auto shrink-0 text-slate-500 transition group-hover:text-cyan-300"
            />

          </div>
        ))}

      </div>

    </section>
  );
}

/* ------------------------------------------
   MAIN MARKET OVERVIEW PAGE
------------------------------------------ */

export default function MarketOverview() {
  const [selectedRange, setSelectedRange] = useState("5Y");

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-[#06172b] bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: `
          linear-gradient(
            100deg,
            rgba(3, 17, 33, 0.87),
            rgba(3, 23, 42, 0.76),
            rgba(3, 17, 33, 0.90)
          ),
          url('/images/rupai-bg.jpeg')
        `,
      }}
    >

      {/* BACKGROUND OVERLAY */}
      <div className="pointer-events-none fixed inset-0 -z-0 bg-gradient-to-b from-[#06172b]/20 via-transparent to-[#041426]/80" />

      <div className="relative z-10">

        <Navbar />

        <div className="mx-auto max-w-[1500px] px-5 pb-10 pt-7 sm:px-8 lg:px-10">

          {/* PAGE INTRODUCTION */}
          <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div>
              <p className="mb-2 text-[11px] font-bold tracking-[0.28em] text-cyan-300">
                MARKET INTELLIGENCE
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[42px]">
                Market <span className="text-cyan-300">Overview</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Understand currency movements, track India's economic
                indicators and explore historical rupee depreciation trends.
              </p>
            </div>

            {/* EXPLANATION PANEL */}
            <div className="flex max-w-[440px] items-center gap-4 rounded-xl border border-cyan-200/20 bg-[#082943]/65 p-4 shadow-xl backdrop-blur-xl">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <TrendingUp size={27} />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Understanding currency movements
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-300">
                  A rising USD/INR rate means the rupee is weakening
                  against the US dollar, potentially affecting imports,
                  exports and company earnings.
                </p>
              </div>

            </div>

          </section>

          {/* MAIN DASHBOARD */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">

            {/* LEFT: EXCHANGE RATE */}
            <div className="rounded-2xl border border-cyan-100/20 bg-[#092842]/75 p-4 shadow-2xl backdrop-blur-xl sm:p-6">

              <ExchangeRateChart
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
              />

            </div>

            {/* RIGHT: ECONOMIC INDICATORS */}
            <div className="rounded-2xl border border-cyan-100/20 bg-[#092842]/75 p-4 shadow-2xl backdrop-blur-xl sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-300">
                    ECONOMY AT A GLANCE
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Key Economic Indicators
                  </h2>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                  <Landmark size={19} />
                </div>

              </div>

              <div className="flex flex-col gap-3">

                {indicators.map((item) => (
                  <IndicatorCard key={item.name} item={item} />
                ))}

              </div>

              <div className="mt-5 rounded-lg border border-cyan-300/15 bg-cyan-400/[0.06] p-3">

                <p className="text-[11px] leading-5 text-slate-300">
                  These indicators help explain how currency shocks can
                  influence inflation, borrowing costs and import expenses.
                </p>

              </div>

            </div>

          </section>

          {/* HISTORICAL EPISODES */}
          <HistoricalEpisodes />

          {/* FOOTER */}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">

            <p className="text-[10px] text-slate-400">
              © 2026 RupAI. Financial Market Scenario Intelligence.
            </p>

            <p className="text-[10px] text-slate-500">
              Demonstration interface · Illustrative data · Not investment advice
            </p>

          </footer>

        </div>

      </div>

    </main>
  );
}
