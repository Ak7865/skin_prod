import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    template: "%s | L'ÉLIXIR Maison de Beauté",
    default: "L'ÉLIXIR | Premium Organic Skincare & Skin Science"
  },
  description: "Experience clean, organic, dermatologist-tested skin formulas that restore luminosity, protect the skin barrier, and target age spots, dullness, or pores.",
  keywords: ["clean beauty", "vegan skincare", "dermatologist tested", "organic serums", "skin barrier repair"],
  openGraph: {
    title: "L'ÉLIXIR Maison de Beauté | Clean Skincare Formulas",
    description: "Bioavailable, clean ingredients targeting anti-aging, acne, dryness, and skin luminosity.",
    siteName: "L'ÉLIXIR",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "L'ÉLIXIR Maison de Beauté | Clean Skincare",
    description: "Dermatologist-tested skincare rituals designed for timeless radiance."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
