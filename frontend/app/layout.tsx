import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Use Plus Jakarta Sans to match original premium feel
import "./globals.css";
import "leaflet/dist/leaflet.css";

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
    <html lang="en">
      <body
        className={`${jakarta.variable} font-sans antialiased text-gray-900 bg-gray-50 min-h-screen relative`}
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 -z-10 pointer-events-none"></div>
        {children}
      </body>
    </html>
  );
}
