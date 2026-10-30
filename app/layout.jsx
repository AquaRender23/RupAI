
import "./globals.css";

export const metadata = {
  title: "RupAI | Financial Market Intelligence",
  description:
    "Understand currency movements and explore their impact on Indian financial markets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
