import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Gestion Pointage Bus",
  description: "Application de gestion du pointage mensuel des bus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
