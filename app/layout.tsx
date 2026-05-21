import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://abc_artes.ias-nexus-automacao.com.br"),
  title: "Artes que Ensinam | Materiais pedagógicos em PDF",
  description:
    "Materiais pedagógicos prontos para imprimir, criados pela professora e pedagoga Simone Pereira Lima.",
  openGraph: {
    title: "Artes que Ensinam",
    description:
      "Arquivos em PDF para professores que querem aulas mais criativas, leves e significativas.",
    url: "https://abc_artes.ias-nexus-automacao.com.br",
    siteName: "Artes que Ensinam",
    images: [
      {
        url: "/images/hero-artes-que-ensinam.png",
        width: 1536,
        height: 1024,
        alt: "Artes que Ensinam - materiais pedagógicos em PDF",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
