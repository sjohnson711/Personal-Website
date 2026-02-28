import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "[Book Title] — by [Author Name]",
  description:
    "The official website for [Book Title], a book by [Author Name]. Read weekly articles, learn about the author, and stay up to date.",
  openGraph: {
    title: "[Book Title]",
    description: "Official website for [Book Title] by [Author Name].",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
        <footer
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#a89070",
            fontSize: "0.85rem",
            borderTop: "1px solid rgba(64, 145, 108, 0.2)",
            marginTop: "4rem",
          }}
        >
          © {new Date().getFullYear()} [Author Name]. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
