"use client";

import { type ComponentType, type SVGProps, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Cpu,
  GitBranch,
  KeyRound,
  Link as LinkIcon,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface NavSection {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  items: NavItem[];
  defaultOpen?: boolean;
}

const mcpItems: NavItem[] = [
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
];

const workflowItems: NavItem[] = [
  {
    title: "Workflows",
    description: "Design automation sequences and triggers.",
    href: "/dashboard/workflows/list",
    icon: GitBranch,
  },
  {
    title: "Workflow analytics",
    description: "Track execution trends and performance.",
    href: "/dashboard/workflow-analytics",
    icon: TrendingUp,
  },
];

const generalItems: NavItem[] = [
  {
    title: "Integrations",
    description: "Connect external services and manage credentials.",
    href: "/dashboard/integrations",
    icon: LinkIcon,
  },
  {
    title: "API key creation",
    description: "Provision, rotate, and revoke credentials.",
    href: "/dashboard/api-key-creation",
    icon: KeyRound,
  },
  {
    title: "Settings",
    description: "Update team members, billing, and alerts.",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const navSections: NavSection[] = [
  {
    title: "MCP",
    icon: Cpu,
    items: mcpItems,
    defaultOpen: true,
  },
  {
    title: "Workflows",
    icon: Workflow,
    items: workflowItems,
    defaultOpen: true,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      navSections.map((
        section,
      ) => [section.title, section.defaultOpen ?? true]),
    ),
  );

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  return (
    <aside className="flex h-full flex-col justify-between gap-10 py-10">
      <div className="space-y-6">
        <div className="px-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">
            Fuse dashboard
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">
            Mission control
          </h2>
        </div>

        <nav className="space-y-4 px-2">
          {/* Nested Sections */}
          {navSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.title];
            const hasActiveItem = section.items.some((item) =>
              pathname === item.href
            );

            return (
              <div key={section.title} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                    hasActiveItem
                      ? "bg-white/5 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <SectionIcon className="h-4 w-4" strokeWidth={1.8} />
                  <span className="flex-1 text-left">{section.title}</span>
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                    : <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
                </button>

                {isExpanded && (
                  <div className="ml-3 space-y-0.5 border-l border-white/10 pl-3">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                          <span>
                            {item.title.replace(/^(MCP|Workflow)\s*/i, "")}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* General Items (Not Nested) */}
          <div className="space-y-1 pt-2">
            {generalItems.map((item) => {
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
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="px-4 text-xs text-white/40">
        <p>Need help? Reach out to the Fuse team any time.</p>
      </div>
    </aside>
  );
}
