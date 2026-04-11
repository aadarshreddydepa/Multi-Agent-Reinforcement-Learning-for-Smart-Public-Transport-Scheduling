import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "../contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Bus MARL - Intelligent Transport System",
  description:
    "Real-time Multi-Agent Reinforcement Learning Bus Scheduling System",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background-primary text-foreground-primary min-h-screen relative`}
      >
        <ThemeProvider>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,rgba(12,14,18,1),rgba(12,14,18,0))] opacity-40 dark:opacity-20 -z-10 pointer-events-none"></div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
