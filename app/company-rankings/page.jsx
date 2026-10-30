"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import { useScenario } from "../ScenarioContext";

import {
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  Info,
  Plus,
  X,
  ChevronDown,
  Globe2,
  Wallet,
  Landmark,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

// --------------------------------------------------
// ILLUSTRATIVE FRONTEND COMPANY DATA
// Replace with database data during backend integration.
// --------------------------------------------------

const companies = [
  {
    id: "TCS",
    name: "Tata Consultancy Services",
    ticker: "TCS",
    sector: "Information Technology",
    referencePrice: 3850,
    sensitivity: "High Export Sensitivity",
    baseImpact: 2.5,
    uncertainty: 0.8,
    exposure: {
      exports: 90,
      imports: 18,
      debt: 12,
      hedging: 35,
    },
    explanation:
      "International IT service revenue may increase in rupee terms when foreign-currency earnings are converted.",
    positive:
      "Foreign-currency revenue may translate into higher INR earnings.",
    negative:
      "Overseas operating expenses and hedging can offset some benefits.",
  },
  {
    id: "INFY",
    name: "Infosys",
    ticker: "INFY",
    sector: "Information Technology",
    referencePrice: 1580,
    sensitivity: "High Export Sensitivity",
    baseImpact: 2.2,
    uncertainty: 0.9,
    exposure: {
      exports: 85,
      imports: 20,
      debt: 10,
      hedging: 40,
    },
    explanation:
      "International IT services revenue can create a positive currency translation effect.",
    positive:
      "Foreign-currency service revenue may increase in INR terms.",
    negative:
      "Overseas expenses and currency hedging may reduce the benefit.",
  },
  {
    id: "WIPRO",
    name: "Wipro",
    ticker: "WIPRO",
    sector: "Information Technology",
    referencePrice: 285,
    sensitivity: "High Export Sensitivity",
    baseImpact: 1.7,
    uncertainty: 1.1,
    exposure: {
      exports: 78,
      imports: 22,
      debt: 15,
      hedging: 32,
    },
    explanation:
      "International service delivery creates potential exposure to foreign-currency earnings.",
    positive:
      "Foreign-currency service revenue may translate into higher INR revenue.",
    negative:
      "Foreign-currency operating costs may offset some translation benefits.",
  },
  {
    id: "SUNPHARMA",
    name: "Sun Pharmaceutical",
    ticker: "SUNPHARMA",
    sector: "Pharmaceuticals",
    referencePrice: 1720,
    sensitivity: "Moderate Export Sensitivity",
    baseImpact: 1.4,
    uncertainty: 0.9,
    exposure: {
      exports: 72,
      imports: 45,
      debt: 18,
      hedging: 30,
    },
    explanation:
      "International pharmaceutical sales may benefit from currency translation, while imported inputs create cost pressure.",
    positive:
      "Foreign sales may translate into higher rupee earnings.",
    negative:
      "Imported ingredients and materials may become more expensive.",
  },
  {
    id: "RELIANCE",
    name: "Reliance Industries",
    ticker: "RELIANCE",
    sector: "Energy & Conglomerates",
    referencePrice: 1450,
    sensitivity: "Mixed Currency Sensitivity",
    baseImpact: -1.0,
    uncertainty: 1.3,
    exposure: {
      exports: 65,
      imports: 82,
      debt: 60,
      hedging: 45,
    },
    explanation:
      "Its diversified operations have both foreign-currency receipts and dollar-linked costs.",
    positive:
      "Export receipts may provide a partial currency-related benefit.",
    negative:
      "Dollar-linked purchases and foreign-currency debt may become more expensive.",
  },
  {
    id: "MARUTI",
    name: "Maruti Suzuki",
    ticker: "MARUTI",
    sector: "Automobile",
    referencePrice: 12500,
    sensitivity: "High Import Sensitivity",
    baseImpact: -1.9,
    uncertainty: 1.2,
    exposure: {
      exports: 25,
      imports: 75,
      debt: 12,
      hedging: 25,
    },
    explanation:
      "Imported components and international supply-chain costs can create pressure when the rupee weakens.",
    positive:
      "Vehicle exports may provide some foreign-currency earnings.",
    negative:
      "Imported components and materials may increase production costs.",
  },
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getImpact(company, depreciation) {
  return company.baseImpact * (depreciation / 10);
}

function formatPrice(value) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatImpact(value) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getImpactColor(value) {
  if (value > 0.05) return "text-emerald-400";
  if (value < -0.05) return "text-red-400";
  return "text-slate-300";
}

// --------------------------------------------------
// COMPANY SELECTOR
// --------------------------------------------------

function CompanySelector({ selectedCompanies, onToggle }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const availableCompanies = companies.filter((company) => {
    const query = search.toLowerCase();

    return (
      company.name.toLowerCase().includes(query) ||
      company.ticker.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative">
      <label className="mb-2 block text-xs font-semibold text-slate-300">
        Search company name or ticker
      </label>

      <div className="relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          placeholder="Search companies..."
          className="w-full rounded-xl border border-white/10 bg-[#0b192d] py-3 pl-11 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <ChevronDown size={17} />
        </button>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close company selector"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#14243c] p-2 shadow-2xl">
            {availableCompanies.length > 0 ? (
              availableCompanies.map((company) => {
                const isSelected = selectedCompanies.some(
                  (item) => item.id === company.id
                );

                const limitReached =
                  selectedCompanies.length >= 3 && !isSelected;

                return (
                  <button
                    type="button"
                    key={company.id}
                    disabled={limitReached}
                    onClick={() => {
                      onToggle(company);
                      setSearch("");
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition ${
                      isSelected
                        ? "bg-cyan-400/10"
                        : "hover:bg-white/[0.05]"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {company.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {company.ticker} · {company.sector}
                      </p>
                    </div>

                    {isSelected ? (
                      <span className="text-xs font-semibold text-cyan-300">
                        Added
                      </span>
                    ) : (
                      <Plus size={17} className="text-cyan-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <p className="p-4 text-center text-xs text-slate-400">
                No companies found.
              </p>
            )}
          </div>
        </>
      )}

      <p className="mt-2 text-[11px] text-slate-500">
        Compare up to 3 companies.
      </p>
    </div>
  );
}

// --------------------------------------------------
// COMPACT EXPOSURE BAR
// --------------------------------------------------

function ExposureBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3">
        <span className="text-xs text-slate-300">{label}</span>
        <span className="text-xs font-semibold text-slate-400">
          {value}/100
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------
// COMPANY DETAIL CARD
// --------------------------------------------------

function CompanyDetailCard({
  company,
  depreciation,
  onRemove,
}) {
  const impact = getImpact(company, depreciation);

  const uncertainty =
    company.uncertainty * Math.max(depreciation / 10, 0.25);

  const lowerEstimate = impact - uncertainty;
  const upperEstimate = impact + uncertainty;

  const exposureItems = [
    {
      label: "Export Revenue",
      value: company.exposure.exports,
      color: "bg-emerald-400",
    },
    {
      label: "Import Expenses",
      value: company.exposure.imports,
      color: "bg-red-400",
    },
    {
      label: "Foreign Currency Debt",
      value: company.exposure.debt,
      color: "bg-amber-400",
    },
    {
      label: "Currency Hedging",
      value: company.exposure.hedging,
      color: "bg-violet-400",
    },
  ];

  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-[#101e35] p-5">

      {/* COMPANY HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl bg-cyan-400/10 p-3">
            <Building2 size={21} className="text-cyan-300" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">
              {company.name}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {company.ticker} · {company.sector}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(company.id)}
          aria-label={`Remove ${company.name}`}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-400"
        >
          <X size={17} />
        </button>
      </div>

      {/* SENSITIVITY */}

      <div className="mt-4">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-300">
          {company.sensitivity}
        </span>
      </div>

      {/* KEY METRICS */}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#0b192d] p-3">
          <p className="text-[11px] text-slate-500">
            Reference Stock Price
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {formatPrice(company.referencePrice)}
          </p>

          <p className="mt-1 text-[10px] text-amber-300">
            Illustrative
          </p>
        </div>

        <div className="rounded-xl bg-[#0b192d] p-3">
          <p className="text-[11px] text-slate-500">
            Estimated Impact
          </p>

          <p className={`mt-2 text-lg font-bold ${getImpactColor(impact)}`}>
            {formatImpact(impact)}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            {depreciation}% depreciation
          </p>
        </div>

        <div className="rounded-xl bg-[#0b192d] p-3">
          <p className="text-[11px] text-slate-500">
            Lower Estimate
          </p>

          <p className="mt-2 font-semibold text-red-300">
            {formatImpact(lowerEstimate)}
          </p>
        </div>

        <div className="rounded-xl bg-[#0b192d] p-3">
          <p className="text-[11px] text-slate-500">
            Upper Estimate
          </p>

          <p className="mt-2 font-semibold text-emerald-300">
            {formatImpact(upperEstimate)}
          </p>
        </div>
      </div>

      {/* EXPOSURE BREAKDOWN */}

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-center gap-2">
          <Globe2 size={17} className="text-cyan-400" />

          <h4 className="text-sm font-bold text-white">
            Currency Exposure
          </h4>
        </div>

        <p className="mt-1 text-[11px] text-slate-500">
          Illustrative relative exposure index
        </p>

        <div className="mt-4 space-y-4">
          {exposureItems.map((item) => (
            <ExposureBar
              key={item.label}
              label={item.label}
              value={item.value}
              color={item.color}
            />
          ))}
        </div>
      </div>

      {/* SHORT EXPLANATION */}

      <div className="mt-6 border-t border-white/10 pt-5">
        <h4 className="text-sm font-bold text-white">
          Why is this company affected?
        </h4>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          {company.explanation}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" />

              <span className="text-xs font-semibold text-emerald-300">
                Potential Benefit
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {company.positive}
            </p>
          </div>

          <div className="rounded-xl border border-red-400/15 bg-red-400/[0.04] p-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={15} className="text-red-400" />

              <span className="text-xs font-semibold text-red-300">
                Potential Risk
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {company.negative}
            </p>
          </div>
        </div>
      </div>

      {/* DATA NOTE */}

      <div className="mt-5 rounded-lg bg-[#0b192d] px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Info
            size={14}
            className="mt-0.5 shrink-0 text-amber-300"
          />

          <p className="text-[10px] leading-4 text-slate-500">
            Prices, exposure indices and prediction estimates are
            illustrative frontend values, not verified disclosures
            or actual ML outputs.
          </p>
        </div>
      </div>
    </article>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function CompanyDetailsPage() {
  const { scenario } = useScenario();

  const depreciation = Number(scenario.depreciation ?? 10);

  // TCS IS THE INITIAL SELECTION
  const [selectedCompanies, setSelectedCompanies] = useState([
    companies[0],
  ]);

  const toggleCompany = (company) => {
    setSelectedCompanies((current) => {
      const alreadySelected = current.some(
        (item) => item.id === company.id
      );

      if (alreadySelected) {
        if (current.length === 1) return current;

        return current.filter((item) => item.id !== company.id);
      }

      if (current.length >= 3) return current;

      return [...current, company];
    });
  };

  const removeCompany = (id) => {
    setSelectedCompanies((current) => {
      if (current.length === 1) return current;

      return current.filter((company) => company.id !== id);
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071326] text-white">
      <Navbar />

      <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-10 sm:px-8 lg:px-12">

        {/* PAGE HEADER */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Activity size={16} />
            Company Intelligence
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Company Details
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Understand how currency movements affect individual
                companies through their foreign-exchange exposure,
                estimated impact and business factors.
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
            Frontend preview: stock prices, exposure indices and
            prediction estimates are illustrative sample values.
            They are not verified company disclosures or actual
            ML predictions.
          </p>
        </div>

        {/* COMPANY SELECTOR */}

        <section className="rounded-2xl border border-white/10 bg-[#101e35] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                Select Companies
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Search and compare company-level currency exposure.
              </p>
            </div>

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-2 text-xs font-semibold text-cyan-300">
              {selectedCompanies.length} / 3 selected
            </div>
          </div>

          <CompanySelector
            selectedCompanies={selectedCompanies}
            onToggle={toggleCompany}
          />

          {/* SELECTED COMPANY CHIPS */}

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedCompanies.map((company) => (
              <div
                key={company.id}
                className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-2"
              >
                <span className="text-xs font-semibold text-cyan-200">
                  {company.ticker}
                </span>

                {selectedCompanies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCompany(company.id)}
                    aria-label={`Remove ${company.ticker}`}
                    className="text-slate-400 transition hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COMPANY ANALYSIS */}

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Company Analysis
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Compare currency exposure and estimated impact.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe2 size={15} className="text-cyan-400" />
              {depreciation}% depreciation
            </div>
          </div>

          <div
            className={`grid grid-cols-1 items-start gap-6 ${
              selectedCompanies.length === 1
                ? "max-w-4xl"
                : selectedCompanies.length === 2
                ? "xl:grid-cols-2"
                : "xl:grid-cols-3"
            }`}
          >
            {selectedCompanies.map((company) => (
              <CompanyDetailCard
                key={company.id}
                company={company}
                depreciation={depreciation}
                onRemove={removeCompany}
              />
            ))}
          </div>
        </section>

        {/* DATA TRANSPARENCY */}

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#101e35] p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={19} className="text-cyan-400" />

            <h2 className="text-lg font-bold">
              Understanding the Data
            </h2>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            RupAI distinguishes between company-reported information,
            values derived from available inputs and assumptions used
            for scenario analysis.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <p className="text-sm font-bold text-emerald-300">
                Reported Values
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Information sourced from company filings and
                identified disclosures, with source and date.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <p className="text-sm font-bold text-cyan-300">
                Derived Values
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Calculations produced from reported data and
                scenario inputs.
              </p>
            </div>

            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
              <p className="text-sm font-bold text-amber-300">
                Illustrative Assumptions
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Demonstration inputs used while the database and
                ML models are being integrated.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTNOTE */}

        <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <Info size={15} className="mt-0.5 shrink-0" />

          <p>
            Actual company exposure, stock prices, hedging positions
            and prediction intervals will be populated from verified
            sources and the integrated ML model.
          </p>
        </div>
      </div>
    </main>
  );
}