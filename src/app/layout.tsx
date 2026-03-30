import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";

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
    default: "Zoltai - Make Money Using AI Tools",
    template: "%s | Zoltai",
  },
  description:
    "Discover the best AI tools to earn money online, boost productivity, and build your side hustle. No coding required.",
  keywords: [
    "AI tools",
    "make money with AI",
    "AI side hustle",
    "AI productivity",
    "earn money online",
    "AI for beginners",
    "AI automation",
    "best AI tools",
  ],
  other: {
    "google-site-verification": "FSKh_zkNE5wDnpiVBiML628oT11QR2FF_2w5ejfJYF4",
  },
  openGraph: {
    title: "Zoltai - Make Money Using AI Tools",
    description:
      "Discover the best AI tools to earn money online. No coding required.",
    siteName: "Zoltai",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zoltai - Make Money Using AI Tools",
    description:
      "Discover the best AI tools to earn money online. No coding required.",
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
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
