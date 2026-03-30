import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zoltai - AI Tools & Productivity",
    template: "%s | Zoltai",
  },
  description:
    "Discover the best AI tools, tips, and productivity hacks. Your guide to mastering artificial intelligence — for beginners and pros.",
  keywords: [
    "AI tools",
    "AI productivity",
    "artificial intelligence",
    "ChatGPT",
    "Claude AI",
    "AI for beginners",
    "AI automation",
  ],
  
  // ✅ إضافة Google Search Console Verification
  other: {
    "google-site-verification": "FSKh_zkNE5wDnpiVBiML628oT11QR2FF_2w5ejfJYF4",
  },
  
  openGraph: {
    title: "Zoltai - AI Tools & Productivity",
    description:
      "Discover the best AI tools, tips, and productivity hacks.",
    siteName: "Zoltai",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zoltai - AI Tools & Productivity",
    description:
      "Discover the best AI tools, tips, and productivity hacks.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
