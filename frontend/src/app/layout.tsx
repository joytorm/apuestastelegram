import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://apuestas.entrelanzados.es";
const title = "ApuestasTelegram | Tips verificados y curados";
const description =
  "Plataforma para capturar, validar y distribuir tips deportivos en Telegram con trazabilidad y métricas.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "ApuestasTelegram",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "tipsters telegram",
    "apuestas deportivas",
    "picks verificados",
    "yield",
    "clv",
    "telegram premium",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title,
    description,
    siteName: "ApuestasTelegram",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
