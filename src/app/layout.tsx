import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Netfive Customer Success",
  description: "Plataforma interna de gestão de Customer Success da Netfive.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('netfive-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
