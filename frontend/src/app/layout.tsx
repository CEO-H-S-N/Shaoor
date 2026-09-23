import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shaoor — Academic Paper Review Platform",
    template: "%s | Shaoor",
  },
  description:
    "Submit, review, and publish academic papers with Shaoor. A modern platform for scholarly peer review and open access publication.",
  keywords: [
    "academic papers",
    "peer review",
    "scholarly publishing",
    "open access",
    "research",
    "Shaoor",
  ],
  authors: [{ name: "Shaoor.org" }],
  openGraph: {
    title: "Shaoor — Academic Paper Review Platform",
    description:
      "Submit, review, and publish academic papers with Shaoor.",
    url: "https://shaoor.org",
    siteName: "Shaoor",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaoor — Academic Paper Review Platform",
    description:
      "Submit, review, and publish academic papers with Shaoor.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
