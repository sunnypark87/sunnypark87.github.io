import type { Metadata } from "next";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { types: { "application/rss+xml": `${siteConfig.url}/rss.xml` } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <SiteHeader />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
