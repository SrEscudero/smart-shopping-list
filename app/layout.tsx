// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#08080F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Compras Inteligentes | Lista de Compras con IA",
  description: "Organiza tus compras mensuales con categorización inteligente por IA, presupuesto visual, escaneo de productos con cámara y compartir por WhatsApp. Funciona offline.",
  manifest: "/manifest.json",
  keywords: ["lista de compras", "presupuesto", "supermercado", "shopping list", "AI", "categorización"],
  authors: [{ name: "Smart Shopping" }],
  robots: "index, follow",
  openGraph: {
    title: "Compras Inteligentes — Tu lista con IA",
    description: "Lista de compras mensual con categorización IA, presupuesto, escaneo y modo compras.",
    type: "website",
    locale: "es_ES",
    siteName: "Compras Inteligentes",
  },
  twitter: {
    card: "summary",
    title: "Compras Inteligentes",
    description: "Lista de compras inteligente con IA, presupuesto y modo compras offline.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Compras",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" data-accent="blue">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}