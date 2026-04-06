import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StickyCTA } from "@/components/sticky-cta";
import { PWARegister } from "@/components/pwa-register";
import { PushPrompt } from "@/components/push-prompt";
import { HeatmapTracker } from "@/components/heatmap-tracker";
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
  metadataBase: new URL("https://zoltai.org"),
  title: {
    default: "Zoltai - Discover the Best AI Tools (No Coding Required)",
    template: "%s | Zoltai",
  },
  description:
    "Discover the best AI tools to boost productivity, streamline your workflow, and learn new skills. No coding required.",
  keywords: [
    "AI tools",
    "best AI tools",
    "AI workflow",
    "AI productivity",
    "AI productivity tools",
    "AI for beginners",
    "AI automation",
    "AI for work",
    "AI learning",
    "AI tools review",
    "AI freelancing",
  ],
  other: {
    "google-site-verification": "FSKh_zkNE5wDnpiVBiML628oT11QR2FF_2w5ejfJYF4",
    "impact-site-verification": "9436c631-e4a2-43bb-ad89-e175d3b38758",
  },
  openGraph: {
    title: "Zoltai - Discover the Best AI Tools",
    description:
      "Discover the best AI tools to boost productivity and streamline your workflow. No coding required.",
    siteName: "Zoltai",
    locale: "en_US",
    type: "website",
    url: "https://zoltai.org",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zoltai - Discover the Best AI Tools",
    description:
      "Discover the best AI tools to boost productivity and streamline your workflow. No coding required.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://zoltai.org",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Zoltai",
  url: "https://zoltai.org",
  description:
    "Discover the best AI tools to boost productivity, streamline your workflow, and learn new skills. No coding required.",
  publisher: {
    "@type": "Organization",
    name: "Zoltai",
    url: "https://zoltai.org",
    sameAs: [
      "https://www.instagram.com/zoltai.ai/",
      "https://www.facebook.com/zoltai.community",
    ],
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <StickyCTA />
          <PWARegister />
          <PushPrompt />
          <HeatmapTracker />
        </Providers>
      </body>
    </html>
  );
}
