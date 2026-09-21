import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

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
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
