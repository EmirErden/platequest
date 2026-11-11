import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// latin-ext: ğ, ş, ı, İ gibi Türkçe harfler bu alt kümede; önceden yüklensin
// ki ilk çizimde yedek fonta düşüp sonradan değişmesinler.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Plaka Peşinde",
  description: "Türkiye'nin 81 ilini plaka kodlarıyla ve haritadaki yerleriyle öğren.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
