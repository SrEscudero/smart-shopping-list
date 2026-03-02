// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

// Configuración especial para móviles
export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita que la pantalla haga zoom en iOS al tocar los inputs
};

export const metadata: Metadata = {
  title: "Compras Inteligentes",
  description: "Sistema avanzado de gestión de compras",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Compras",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#111111]">{children}</body>
    </html>
  );
}