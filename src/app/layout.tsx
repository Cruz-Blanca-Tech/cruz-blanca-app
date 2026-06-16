import type { Metadata } from "next";
import { Alegreya_Sans_SC, Alegreya_Sans, Arimo } from "next/font/google";
import "./globals.css";

const alegreyaSansSC = Alegreya_Sans_SC({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const alegreyaSans = Alegreya_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const arimo = Arimo({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Cruz Blanca",
  description: "Cruz Blanca App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${alegreyaSansSC.variable} ${alegreyaSans.variable} ${arimo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
