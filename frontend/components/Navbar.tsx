"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "API", href: "/api" },
  { label: "Workflows", href: "/workflows" },
  { label: "Assistant", href: "/assistant" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/contact" },
];

const linkBaseClass =
  "transition-colors duration-300 px-4 py-2 rounded-full font-sans";

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";

const inactiveLinkClass = `text-white/60 hover:text-white hover:bg-white/5 ${focusRingClass}`;

const activeLinkClass = `bg-white/5 text-white ${focusRingClass}`;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <div
        className="max-w-4xl mx-auto border border-white/10 rounded-full px-6 py-3"
        style={{
          background: "rgba(10, 11, 20, 0.9)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-colors duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </Link>
            <span className="ml-2 text-lg font-semibold tracking-tight text-white font-sans">
              Fuse
            </span>
          </div>

          <ul className="hidden md:flex items-center gap-1 text-sm font-medium text-white/60">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${linkBaseClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              className="hover:bg-white/5 p-2 rounded-full transition-all duration-300 border border-white/5"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
              aria-label="Account"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 stroke-[1.5] text-white/60"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            <button
              className="relative hover:bg-white/5 p-2 rounded-full transition-all duration-300 border border-white/5"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
              aria-label="Dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 stroke-[1.5] text-white/60"
              >
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
