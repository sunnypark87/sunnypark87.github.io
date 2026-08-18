"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/articles/", label: "Articles" },
  { href: "/projects/", label: "Projects" },
  { href: "/about/", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="주요 내비게이션">
        <Link className="site-wordmark" href="/" aria-label="Littlebread Lab Home" aria-current={isHome ? "page" : undefined}>
          Littlebread Lab
        </Link>
        <div className="site-links">
          {links.map((link) => {
            const isCurrent = pathname === link.href || pathname.startsWith(`${link.href}`);
            return (
              <Link key={link.href} href={link.href} aria-current={isCurrent ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
