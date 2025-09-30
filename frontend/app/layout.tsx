import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppProviders } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Fuse – Healthcare Platform for Developers",
  description:
    "The unified platform that connects hundreds of disparate healthcare APIs, enabling you to build compliant, automated workflows with an intelligent, developer-first toolkit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-white overflow-x-hidden">
        <AppProviders>
          <div
            className="fixed top-0 w-full h-screen bg-cover bg-center -z-10"
            style={{
              backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
            }}
          ></div>
          <div
            className="fixed inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>
          <div className="relative z-10 min-h-screen">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
