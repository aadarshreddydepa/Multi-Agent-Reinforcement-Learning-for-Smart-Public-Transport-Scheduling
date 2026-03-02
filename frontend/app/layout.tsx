import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Use Plus Jakarta Sans to match original premium feel
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "../contexts/ThemeContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
        className={`${jakarta.variable} font-sans antialiased text-gray-900 bg-gray-50 dark:text-gray-100 dark:bg-dark-950 min-h-screen relative transition-colors duration-300`}
      >
        <ThemeProvider>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,rgba(15,23,42,1),rgba(15,23,42,0))] opacity-40 dark:opacity-20 -z-10 pointer-events-none"></div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
