import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// One clean, elegant font for the whole site. To try another, change it here.
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

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
      <body className={`${jost.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
