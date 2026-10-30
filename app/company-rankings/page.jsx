"use client";

import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { useScenario } from "../ScenarioContext";

import {
  Activity,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Building2,
  Filter,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  BarChart3,
  Target,
  ShieldAlert,
  Info,
} from "lucide-react";

// --------------------------------------------------
// TEMPORARY FRONTEND COMPANY DATA
// Replace with database and ML output later.
// --------------------------------------------------

const companyData = [
  {
    id: 1,
    name: "Tata Consultancy Services",
    ticker: "TCS",
    sector: "Information Technology",
    netFxExposure: 1250,
    exposureType: "Net Exporter",
    baseReturn: 2.8,
    baseImpact: 2.5,
    uncertainty: 0.8,
  },
  {
    id: 2,
    name: "Infosys",
    ticker: "INFY",
    sector: "Information Technology",
    netFxExposure: 980,
    exposureType: "Net Exporter",
    baseReturn: 2.5,
    baseImpact: 2.2,
    uncertainty: 0.9,
  },
  {
    id: 3,
    name: "Wipro",
    ticker: "WIPRO",
    sector: "Information Technology",
    netFxExposure: 640,
    exposureType: "Net Exporter",
    baseReturn: 1.9,
    baseImpact: 1.7,
    uncertainty: 1.1,
  },
  {
    id: 4,
    name: "Sun Pharmaceutical",
    ticker: "SUNPHARMA",
    sector: "Pharmaceuticals",
    netFxExposure: 520,
    exposureType: "Net Exporter",
    baseReturn: 1.6,
    baseImpact: 1.4,
    uncertainty: 0.9,
  },
  {
    id: 5,
    name: "Dr. Reddy's Laboratories",
    ticker: "DRREDDY",
    sector: "Pharmaceuticals",
    netFxExposure: 410,
    exposureType: "Net Exporter",
    baseReturn: 1.4,
    baseImpact: 1.2,
    uncertainty: 1.0,
  },
  {
    id: 6,
    name: "Cipla",
    ticker: "CIPLA",
    sector: "Pharmaceuticals",
    netFxExposure: 280,
    exposureType: "Net Exporter",
    baseReturn: 1.1,
    baseImpact: 0.9,
    uncertainty: 0.8,
  },
  {
    id: 7,
    name: "Reliance Industries",
    ticker: "RELIANCE",
    sector: "Energy & Conglomerates",
    netFxExposure: -750,
    exposureType: "Net Importer",
    baseReturn: -1.2,
    baseImpact: -1.0,
    uncertainty: 1.3,
  },
  {
    id: 8,
    name: "ONGC",
    ticker: "ONGC",
    sector: "Oil & Gas",
    netFxExposure: -460,
    exposureType: "Net Importer",
    baseReturn: -1.8,
    baseImpact: -1.6,
    uncertainty: 1.1,
  },
  {
    id: 9,
    name: "Indian Oil Corporation",
    ticker: "IOC",
    sector: "Oil & Gas",
    netFxExposure: -580,
    exposureType: "Net Importer",
    baseReturn: -1.5,
    baseImpact: -1.3,
    uncertainty: 1.2,
  },
  {
    id: 10,
    name: "Tata Motors",
    ticker: "TATAMOTORS",
    sector: "Automobile",
    netFxExposure: -390,
    exposureType: "Net Importer",
    baseReturn: -1.4,
    baseImpact: -1.2,
    uncertainty: 1.4,
  },
  {
    id: 11,
    name: "Maruti Suzuki",
    ticker: "MARUTI",
    sector: "Automobile",
    netFxExposure: -520,
    exposureType: "Net Importer",
    baseReturn: -2.1,
    baseImpact: -1.9,
    uncertainty: 1.2,
  },
  {
    id: 12,
    name: "Mahindra & Mahindra",
    ticker: "M&M",
    sector: "Automobile",
    netFxExposure: -240,
    exposureType: "Net Importer",
    baseReturn: -0.9,
    baseImpact: -0.7,
    uncertainty: 1.0,
  },
  {
    id: 13,
    name: "Bajaj Auto",
    ticker: "BAJAJ-AUTO",
    sector: "Automobile",
    netFxExposure: -180,
    exposureType: "Net Importer",
    baseReturn: -1.1,
    baseImpact: -0.9,
    uncertainty: 0.9,
  },
  {
    id: 14,
    name: "Hero MotoCorp",
    ticker: "HEROMOTOCO",
    sector: "Automobile",
    netFxExposure: -130,
    exposureType: "Net Importer",
    baseReturn: -0.8,
    baseImpact: -0.6,
    uncertainty: 0.8,
  },
  {
    id: 15,
    name: "Hindustan Unilever",
    ticker: "HINDUNILVR",
    sector: "FMCG",
    netFxExposure: -90,
    exposureType: "Net Importer",
    baseReturn: -0.4,
    baseImpact: -0.3,
    uncertainty: 0.7,
  },
];

const sectors = [
  "All Sectors",
  ...new Set(companyData.map((company) => company.sector)),
];

const impactCategories = [
  "All Categories",
  "Beneficiary",
  "Neutral",
  "Impacted",
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getImpactCategory(value) {
  if (value > 0.25) return "Beneficiary";
  if (value < -0.25) return "Impacted";
  return "Neutral";
}

function formatExposure(value) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1000) {
    return `$${(absoluteValue / 1000).toFixed(2)}B`;
  }

  return `$${absoluteValue}M`;
}

function formatPercentage(value) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#101e35] p-5 transition hover:border-cyan-400/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {title}
          </p>

          <p className={`mt-3 text-2xl font-bold ${color}`}>
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.05] p-3">
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function CompanyRankings() {
  const { scenario, updateScenario } = useScenario();

  const depreciation = Number(scenario.depreciation ?? 10);

  // FILTER STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] =
    useState("All Sectors");

  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [minReturn, setMinReturn] = useState("");
  const [maxReturn, setMaxReturn] = useState("");

  const [sortBy, setSortBy] = useState("impact-high");

  // --------------------------------------------------
  // CALCULATE COMPANY VALUES
  // Temporary illustrative frontend calculation.
  // --------------------------------------------------

  const calculatedCompanies = useMemo(() => {
    const shockFactor = depreciation / 10;

    return companyData.map((company) => {
      const predictedReturn = company.baseReturn * shockFactor;

      const estimatedImpact = company.baseImpact * shockFactor;

      const uncertainty =
        company.uncertainty * Math.max(shockFactor, 0.25);

      return {
        ...company,
        predictedReturn,
        estimatedImpact,
        uncertainty,
        category: getImpactCategory(estimatedImpact),
      };
    });
  }, [depreciation]);

  // --------------------------------------------------
  // FILTER AND SORT
  // --------------------------------------------------

  const filteredCompanies = useMemo(() => {
    let result = calculatedCompanies.filter((company) => {
      const searchMatch =
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ticker.toLowerCase().includes(searchTerm.toLowerCase());

      const sectorMatch =
        selectedSector === "All Sectors" ||
        company.sector === selectedSector;

      const categoryMatch =
        selectedCategory === "All Categories" ||
        company.category === selectedCategory;

      const minMatch =
        minReturn === "" ||
        company.predictedReturn >= Number(minReturn);

      const maxMatch =
        maxReturn === "" ||
        company.predictedReturn <= Number(maxReturn);

      return (
        searchMatch &&
        sectorMatch &&
        categoryMatch &&
        minMatch &&
        maxMatch
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "impact-low":
          return a.estimatedImpact - b.estimatedImpact;

        case "uncertainty-high":
          return b.uncertainty - a.uncertainty;

        case "uncertainty-low":
          return a.uncertainty - b.uncertainty;

        case "impact-high":
        default:
          return b.estimatedImpact - a.estimatedImpact;
      }
    });

    return result;
  }, [
    calculatedCompanies,
    searchTerm,
    selectedSector,
    selectedCategory,
    minReturn,
    maxReturn,
    sortBy,
  ]);

  // --------------------------------------------------
  // SUMMARY VALUES
  // --------------------------------------------------

  const beneficiaries = filteredCompanies.filter(
    (company) => company.category === "Beneficiary"
  ).length;

  const impacted = filteredCompanies.filter(
    (company) => company.category === "Impacted"
  ).length;

  const neutral = filteredCompanies.filter(
    (company) => company.category === "Neutral"
  ).length;

  const topCompany = [...filteredCompanies].sort(
    (a, b) => b.estimatedImpact - a.estimatedImpact
  )[0];

  const averageReturn =
    filteredCompanies.length > 0
      ? filteredCompanies.reduce(
          (total, company) => total + company.predictedReturn,
          0
        ) / filteredCompanies.length
      : 0;

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSector("All Sectors");
    setSelectedCategory("All Categories");
    setMinReturn("");
    setMaxReturn("");
    setSortBy("impact-high");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071326] text-white">
      <Navbar />

      <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-10 sm:px-8 lg:px-12">

        {/* PAGE HEADER */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <BarChart3 size={16} />
            Market Intelligence
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Company Rankings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Discover which companies benefit or face pressure
                under different rupee depreciation scenarios.
                Compare estimated impact, predicted returns and
                foreign-exchange exposure.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Active scenario
              </p>

              <p className="mt-1 text-lg font-bold text-cyan-300">
                Rupee depreciation · {depreciation}%
              </p>
            </div>
          </div>
        </div>

        {/* PREVIEW NOTICE */}

        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-amber-300"
          />

          <p className="text-xs leading-5 text-amber-100/80">
            Frontend preview: company exposure, returns and
            uncertainty values are illustrative sample data.
            They are not actual market data or ML predictions.
          </p>
        </div>

        {/* DEPRECIATION SLIDER */}

        <section className="rounded-2xl border border-white/10 bg-[#101e35] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <TrendingDown size={19} className="text-cyan-400" />
                Rupee Depreciation
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Adjust the depreciation level to update company rankings.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-5 py-3 text-right">
              <p className="text-xs text-slate-400">
                Selected depreciation
              </p>

              <p className="mt-1 text-3xl font-bold text-cyan-300">
                {depreciation}%
              </p>
            </div>
          </div>

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
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
            />

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[0, 5, 8, 10, 15, 20].map((value) => (
              <button
                key={value}
                onClick={() =>
                  updateScenario({ depreciation: value })
                }
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
        </section>

        {/* SUMMARY CARDS */}

        <section className="mt-9">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Ranking Summary
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Based on the current depreciation scenario and filters.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Companies Analysed"
              value={filteredCompanies.length}
              subtitle={`Out of ${companyData.length} companies`}
              icon={Building2}
              color="text-cyan-300"
            />

            <StatCard
              title="Beneficiaries"
              value={beneficiaries}
              subtitle="Positive estimated impact"
              icon={TrendingUp}
              color="text-emerald-400"
            />

            <StatCard
              title="Impacted Companies"
              value={impacted}
              subtitle="Negative estimated impact"
              icon={TrendingDown}
              color="text-red-400"
            />

            <StatCard
              title="Average Predicted Return"
              value={formatPercentage(averageReturn)}
              subtitle={`${neutral} neutral companies`}
              icon={Target}
              color={
                averageReturn >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            />
          </div>
        </section>

        {/* TOP COMPANY HIGHLIGHT */}

        {topCompany && (
          <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-3">
                  <ArrowUpRight
                    size={23}
                    className="text-emerald-400"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Highest estimated impact in current results
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {topCompany.name}
                    <span className="ml-2 text-xs text-slate-400">
                      {topCompany.ticker}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold text-emerald-400">
                {formatPercentage(topCompany.estimatedImpact)}
              </p>
            </div>
          </section>
        )}

        {/* FILTERS */}

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#101e35] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Filter size={19} className="text-cyan-400" />

                <h2 className="text-lg font-bold">
                  Filter & Sort Companies
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Narrow down companies and customise the ranking order.
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
            >
              <RotateCcw size={15} />
              Reset Filters
            </button>
          </div>

          {/* SEARCH */}

          <div className="mb-5">
            <label className="mb-2 block text-xs font-medium text-slate-300">
              Search by company name or ticker
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search companies... e.g. Infosys, TCS"
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>
          </div>

          {/* FILTER GRID */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {/* SECTOR */}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">
                Filter by Sector
              </label>

              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* IMPACT CATEGORY */}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">
                Filter by Impact Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {impactCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* SORT */}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-300">
                Sort Rankings
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option value="impact-high">
                  Highest Estimated Impact
                </option>

                <option value="impact-low">
                  Lowest Estimated Impact
                </option>

                <option value="uncertainty-high">
                  Highest Prediction Uncertainty
                </option>

                <option value="uncertainty-low">
                  Lowest Prediction Uncertainty
                </option>
              </select>
            </div>
          </div>

          {/* PREDICTED RETURN RANGE */}

          <div className="mt-6 rounded-xl border border-white/10 bg-[#0b192d] p-5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal
                size={17}
                className="text-cyan-400"
              />

              <p className="text-sm font-semibold text-slate-200">
                Predicted Return Range
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Minimum return (%)
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={minReturn}
                  onChange={(e) => setMinReturn(e.target.value)}
                  placeholder="e.g. -2"
                  className="w-full rounded-lg border border-white/10 bg-[#101e35] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Maximum return (%)
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={maxReturn}
                  onChange={(e) => setMaxReturn(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-white/10 bg-[#101e35] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-cyan-300">
                {filteredCompanies.length}
              </span>{" "}
              of {companyData.length} companies
            </p>

            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-cyan-300"
            >
              Clear all filters
            </button>
          </div>
        </section>

        {/* RANKING TABLE */}

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Company Rankings
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Companies ranked according to estimated scenario impact.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#101e35] px-3 py-2 text-xs text-slate-400">
              <Activity size={15} className="text-cyan-400" />
              {depreciation}% depreciation scenario
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101e35]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-[#14243c]">
                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Rank
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Company
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Sector
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Net FX Exposure
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Predicted Return
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Estimated Impact
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Prediction Uncertainty
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-slate-400">
                      Impact Category
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company, index) => {
                      const positive =
                        company.estimatedImpact > 0.25;

                      const negative =
                        company.estimatedImpact < -0.25;

                      return (
                        <tr
                          key={company.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                        >
                          {/* RANK */}

                          <td className="px-5 py-4">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                index === 0
                                  ? "bg-cyan-400/15 text-cyan-300"
                                  : "bg-white/[0.05] text-slate-300"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>

                          {/* COMPANY */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-white">
                              {company.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {company.ticker}
                            </p>
                          </td>

                          {/* SECTOR */}

                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-300">
                              {company.sector}
                            </span>
                          </td>

                          {/* NET FX EXPOSURE */}

                          <td className="px-5 py-4">
                            <div
                              className={`text-sm font-semibold ${
                                company.exposureType === "Net Exporter"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatExposure(company.netFxExposure)}
                            </div>

                            <p className="mt-1 text-[10px] text-slate-500">
                              {company.exposureType}
                            </p>
                          </td>

                          {/* PREDICTED RETURN */}

                          <td className="px-5 py-4">
                            <span
                              className={`text-sm font-semibold ${
                                company.predictedReturn >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatPercentage(company.predictedReturn)}
                            </span>
                          </td>

                          {/* ESTIMATED IMPACT */}

                          <td className="px-5 py-4">
                            <div
                              className={`flex items-center gap-1.5 text-sm font-bold ${
                                positive
                                  ? "text-emerald-400"
                                  : negative
                                  ? "text-red-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {positive ? (
                                <ArrowUpRight size={16} />
                              ) : negative ? (
                                <ArrowDownRight size={16} />
                              ) : null}

                              {formatPercentage(company.estimatedImpact)}
                            </div>
                          </td>

                          {/* UNCERTAINTY */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-300">
                                ±{company.uncertainty.toFixed(2)}%
                              </span>
                            </div>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${
                                company.category === "Beneficiary"
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                                  : company.category === "Impacted"
                                  ? "border-red-400/20 bg-red-400/10 text-red-400"
                                  : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                              }`}
                            >
                              {company.category}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <Search
                          size={30}
                          className="mx-auto text-slate-500"
                        />

                        <p className="mt-4 font-semibold text-white">
                          No matching companies found
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Try changing your search or filters.
                        </p>

                        <button
                          onClick={resetFilters}
                          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-[#071326] hover:bg-cyan-300"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                Rankings are recalculated when the depreciation
                percentage, filters or sorting options change.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTNOTE */}

        <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <Info size={15} className="mt-0.5 shrink-0" />

          <p>
            Net FX exposure is shown as illustrative USD-denominated
            exposure in millions. Positive values represent net
            exporters and negative values represent net importers.
            Actual exposure calculations and model confidence
            intervals will be connected during backend integration.
          </p>
        </div>
      </div>
    </main>
  );
}