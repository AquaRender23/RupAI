
"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Coins,
  Percent,
  History,
  Search,
  TrendingUp,
  Landmark,
  Globe2,
  Activity,
} from "lucide-react";

import Navbar from "@/components/Navbar";

// Illustrative chart data for the frontend.
// Replace with actual market data when the backend is connected.

const chartData = {
  "1M": [78, 79, 77, 80, 81, 79, 83, 82, 85, 84, 88, 86, 90, 89, 93, 92],
  "6M": [68, 70, 69, 73, 72, 76, 74, 78, 77, 81, 80, 84, 83, 88, 87, 92],
  "1Y": [61, 64, 63, 67, 66, 71, 69, 73, 72, 77, 76, 81, 80, 85, 88, 92],
  "5Y": [32, 35, 34, 39, 38, 43, 41, 48, 47, 52, 50, 57, 55, 63, 61, 70, 68, 75, 73, 80, 78, 86, 84, 92],
  "10Y": [15, 18, 17, 22, 21, 27, 25, 31, 30, 36, 34, 41, 39, 47, 45, 53, 51, 59, 57, 66, 64, 75, 72, 92],
  "All": [10, 13, 12, 16, 15, 19, 18, 24, 22, 28, 26, 34, 32, 39, 37, 45, 43, 52, 50, 61, 58, 71, 69, 92],
};

const indicators = [
  {
    name: "CPI Inflation",
    value: "5.1%",
    change: "0.3%",
    positive: false,
    icon: BarChart3,
  },
  {
    name: "Repo Rate",
    value: "6.5%",
    change: "0.0%",
    positive: null,
    icon: Percent,
  },
  {
    name: "10Y G-Sec Yield",
    value: "7.12%",
    change: "0.4%",
    positive: true,
    icon: Activity,
  },
  {
    name: "Import Bill",
    subtitle: "(USD Bn)",
    value: "61.3",
    change: "0.2%",
    positive: true,
    icon: Coins,
  },
];

const episodes = [
  {
    year: "2008",
    title: "Global Financial Crisis",
    impact: "-16.7%",
    type: "negative",
  },
  {
    year: "2013",
    title: "Taper Tantrum",
    impact: "-18.4%",
    type: "negative",
  },
  {
    year: "2018",
    title: "Global Trade Tensions",
    impact: "-10.1%",
    type: "negative",
  },
  {
    year: "2020",
    title: "COVID-19 Pandemic",
    impact: "-7.5%",
    type: "negative",
  },
];

function ExchangeRateChart({ selectedRange }) {
  const values = chartData[selectedRange];

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 570;
    const y = 155 - ((value - 10) / 90) * 130;

    return `${x},${y}`;
  }).join(" ");

  const firstPoint = `0,170`;
  const lastPoint = `570,170`;

  const areaPoints = `${firstPoint} ${points} ${lastPoint}`;

  const finalValue = values[values.length - 1];

  return (
    <div className="chart-wrapper">

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            USD/INR Exchange Rate
          </p>
        </div>

        <button
          aria-label="Exchange rate details"
          className="text-slate-400 hover:text-cyan-400"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            92.40
          </span>

          <span className="text-xs font-semibold text-emerald-400">
            +0.82 (0.90%)
          </span>
        </div>

      </div>

      <div className="relative w-full">

        <div className="absolute right-0 top-0 z-10 rounded bg-[#102c4b] px-2 py-1 text-right shadow-lg">
          <p className="text-[9px] text-slate-400">
            30 Oct 2026
          </p>
          <p className="text-xs font-bold text-white">
            ₹92.40
          </p>
        </div>

        <svg
          viewBox="0 0 600 205"
          className="w-full overflow-visible"
          preserveAspectRatio="none"
        >

          {/* Horizontal grid lines */}
          {[25, 58, 91, 124, 157].map((y, index) => (
            <g key={y}>
              <line
                x1="0"
                y1={y}
                x2="570"
                y2={y}
                stroke="#24415e"
                strokeWidth="0.8"
                strokeDasharray="3 5"
              />

              <text
                x="0"
                y={y - 5}
                fill="#8298b0"
                fontSize="10"
              >
                {[100, 95, 90, 85, 80][index]}
              </text>
            </g>
          ))}

          {/* Area below chart */}
          <polygon
            points={areaPoints}
            fill="url(#chartGradient)"
          />

          {/* Chart line */}
          <polyline
            points={points}
            fill="none"
            stroke="#17bdf3"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Final point */}
          <circle
            cx="570"
            cy={155 - ((finalValue - 10) / 90) * 130}
            r="4"
            fill="#17bdf3"
            stroke="#d9f5ff"
            strokeWidth="2"
          />

          <defs>
            <linearGradient
              id="chartGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#0ba9f0"
                stopOpacity="0.28"
              />

              <stop
                offset="100%"
                stopColor="#0ba9f0"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between pl-5 pr-2 text-[10px] text-slate-400">
          {(
            selectedRange === "1M"
              ? ["01 Oct", "08 Oct", "15 Oct", "22 Oct", "30 Oct"]
              : selectedRange === "6M"
              ? ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]
              : selectedRange === "1Y"
              ? ["Nov", "Jan", "Mar", "May", "Jul", "Sep"]
              : selectedRange === "5Y"
              ? ["2021", "2022", "2023", "2024", "2025", "2026"]
              : selectedRange === "10Y"
              ? ["2016", "2018", "2020", "2022", "2024", "2026"]
              : ["2000", "2005", "2010", "2015", "2020", "2026"]
          ).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

      </div>

    </div>
  );
}

function IndicatorCard({ indicator }) {
  const Icon = indicator.icon;

  return (
    <div className="indicator-row">

      <div className="indicator-icon">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-300">
          {indicator.name}
        </p>

        {indicator.subtitle && (
          <p className="text-[10px] text-slate-500">
            {indicator.subtitle}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-white">
          {indicator.value}
        </p>

        <p
          className={`text-[10px] font-semibold ${
            indicator.positive === true
              ? "text-emerald-400"
              : indicator.positive === false
              ? "text-red-400"
              : "text-slate-400"
          }`}
        >
          {indicator.positive === true && (
            <ArrowUpRight className="inline" size={11} />
          )}

          {indicator.positive === false && (
            <ArrowDownRight className="inline" size={11} />
          )}

          {indicator.change}
        </p>
      </div>

    </div>
  );
}

export default function MarketOverview() {
  const [selectedRange, setSelectedRange] = useState("5Y");

  return (
    <main className="market-page min-h-screen text-white">

      <Navbar />

      <div className="market-container">

        {/* PAGE HEADING */}
        <section className="market-heading">

          <p className="market-eyebrow">
            FINANCIAL MARKET INTELLIGENCE
          </p>

          <h1>
            Market Overview
          </h1>

          <p>
            Track exchange rate trends, key economic indicators, and
            <br className="hidden sm:block" />
            historical episodes of rupee depreciation.
          </p>

        </section>

        {/* MAIN MARKET SECTION */}
        <section className="market-main-grid">

          {/* EXCHANGE RATE CHART */}
          <div className="market-panel exchange-panel">

            <div className="chart-header">

              <ExchangeRateChart selectedRange={selectedRange} />

              {/* Chart range selector */}
              <div className="chart-range-selector">
                {Object.keys(chartData).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={
                      selectedRange === range ? "selected" : ""
                    }
                  >
                    {range}
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* ECONOMIC INDICATORS */}
          <div className="market-panel indicators-panel">

            <div className="panel-heading">
              <h2>Key Economic Indicators</h2>

              <button aria-label="View indicators">
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="indicator-list">
              {indicators.map((indicator) => (
                <IndicatorCard
                  key={indicator.name}
                  indicator={indicator}
                />
              ))}
            </div>

          </div>

        </section>

        {/* HISTORICAL EPISODES */}
        <section className="historical-section">

          <div className="historical-heading">

            <div className="flex items-center gap-2">
              <History
                size={19}
                className="text-cyan-400"
              />

              <h2>
                Historical Depreciation Episodes
              </h2>
            </div>

            <button className="history-button">
              View Full History
              <ArrowRight size={13} />
            </button>

          </div>

          {/* Episode cards */}
          <div className="episodes-grid">

            {episodes.map((episode) => (
              <div
                key={episode.year}
                className="episode-card"
              >

                <div className="episode-marker" />

                <div className="episode-content">

                  <p className="episode-year">
                    {episode.year}
                  </p>

                  <p className="episode-title">
                    {episode.title}
                  </p>

                  <p className="episode-impact">
                    {episode.impact}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* DATA DISCLAIMER */}
        <p className="market-disclaimer">
          Illustrative interface data. Live market values will be
          connected through the RupAI data pipeline.
        </p>

      </div>

    </main>
  );
}
