import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDF Mapper",
  description: "Define drop zones on PDFs and inject JSON data to generate filled documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }
          }}
        />
      </body>
    </html>
  );
}
