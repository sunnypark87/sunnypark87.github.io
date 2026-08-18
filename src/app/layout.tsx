import type { Metadata } from "next";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { siteConfig } from "@/lib/site";

import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
