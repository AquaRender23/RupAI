
import "./globals.css";
import { ScenarioProvider } from "./ScenarioContext";

export const metadata = {
  title: "RupAI | Financial Market Scenario Simulator",
  description:
    "Explore how economic shocks affect Indian financial markets and companies.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ScenarioProvider>
          {children}
        </ScenarioProvider>
      </body>
    </html>
  );
}
