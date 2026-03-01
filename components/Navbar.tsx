"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/articles", label: "Articles" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "rgba(64, 145, 108, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(64, 145, 108, 0.4)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl font-bold tracking-widest uppercase"
          style={{ color: "#ffffff", letterSpacing: "0.12em" }}
        >
          Seth Johnson
        </Link>

        <ul className="flex gap-8 list-none m-0 p-0">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    color: active ? "#fbbf24" : "#fff7ed",
                    borderBottom: active
                      ? "2px solid #40916c"
                      : "2px solid transparent",
                    paddingBottom: "2px",
                    fontWeight: active ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
