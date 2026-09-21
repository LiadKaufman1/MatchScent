import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Cormorant Garamond for headings and the logo, Inter for everything else.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "MatchScent | Discover Fragrances Inspired by Iconic Perfumes",
    template: "%s | MatchScent",
  },
  description: "Explore iconic perfumes and the fragrances inspired by them, with links to stores where you can buy.",
  openGraph: { siteName: "MatchScent", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#FBF9F7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
