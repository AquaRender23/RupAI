"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ScenarioContext = createContext(null);

export const defaultScenario = {
  depreciation: 10,
  startingRate: 83.5,
  horizon: "3 Months",
  historicalReference: "2013 Rupee Pressure",
  confidenceLevel: "80%",
  historicalAssumptions: true,
  sectorAnalysis: true,
  sensitivity: "Default",
  macroVariables: "Standard Set",
  simulationResult: null,
};

export function ScenarioProvider({ children }) {
  const [scenario, setScenario] = useState(defaultScenario);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rupai-scenario");

      if (saved) {
        setScenario({
          ...defaultScenario,
          ...JSON.parse(saved),
        });
      }
    } catch (error) {
      console.error("Could not load saved scenario:", error);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "rupai-scenario",
        JSON.stringify(scenario)
      );
    }
  }, [scenario, loaded]);

  const updateScenario = (updates) => {
    setScenario((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const resetScenario = () => {
    setScenario(defaultScenario);
  };

  return (
    <ScenarioContext.Provider
      value={{
        scenario,
        updateScenario,
        resetScenario,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);

  if (!context) {
    throw new Error(
      "useScenario must be used inside ScenarioProvider"
    );
  }

  return context;
}