import type { Metadata } from "next";
import { Cinzel, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Starfield from "@/components/visual/Starfield";
import { SessionProvider } from "@/lib/session-context";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WH40K - Campaign Tracker",
  description: "Journal de bord narratif pour campagne Warhammer 40 000.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cinzel.variable} ${shareTechMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative">
        <Starfield />
        <SessionProvider>
          <main className="relative z-10 flex-1 flex flex-col">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
