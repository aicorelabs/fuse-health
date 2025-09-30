"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GitBranch,
  KeyRound,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  {
    title: "MCP chat",
    description: "Converse with your agents and review transcripts.",
    href: "/dashboard/mcp-chat",
    icon: MessageSquareText,
  },
  {
    title: "MCP analytics",
    description: "Monitor usage, quality, and performance.",
    href: "/dashboard/mcp-analytics",
    icon: BarChart3,
  },
  {
    title: "MCP configuration",
    description: "Manage connectors, routing, and compliance.",
    href: "/dashboard/mcp-configuration",
    icon: SlidersHorizontal,
  },
  {
    title: "API key creation",
    description: "Provision, rotate, and revoke credentials.",
    href: "/dashboard/api-key-creation",
    icon: KeyRound,
  },
  {
    title: "Workflows",
    description: "Design automation sequences and triggers.",
    href: "/dashboard/workflows",
    icon: GitBranch,
  },
  {
    title: "Settings",
    description: "Update team members, billing, and alerts.",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between gap-10 py-10">
      <div className="space-y-8">
        <div className="px-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">
            Fuse dashboard
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">
            Mission control
          </h2>
        </div>

        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 text-xs text-white/40">
        <p>Need help? Reach out to the Fuse team any time.</p>
      </div>
    </aside>
  );
}
