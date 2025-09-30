"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Edit3,
  MessageCircle,
  Search,
  ServerCog,
  Share2,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  variant?: "card";
  heading?: string;
  tag?: string;
  chips?: string[];
};

const quickFilters = [
  {
    label: "Athena Health",
    className: "border-blue-500/30 bg-blue-500/15 text-blue-100",
  },
  {
    label: "Epic Systems",
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100",
  },
  {
    label: "Medi Tech",
    className: "border-purple-500/30 bg-purple-500/15 text-purple-100",
  },
];

const analysisCardContent = `lululemon demonstrated total sales revenue of $151.1 million between July 25, 2025, and August 24, 2025, with weekly sales peaking at $39.5 million in the week of July 27, 2025. The company maintained a largely stable pricing strategy for its core offerings, supporting consistent revenue generation in key product categories like Bottoms. However, recent weeks have shown a 13.5% decline in sales revenue from the week of August 10 to August 17.

Recent Sales Performance and Product Trends
lululemon's weekly sales revenue experienced fluctuations, with the highest performance in the week of July 27, 2025, reaching $39.5 million from 558.7k units sold. Following this, weekly sales saw a slight dip to $38.2 million by August 3, before recovering to $39.4 million in the week of August 10. However, the week of August 17 marked a significant decrease of 13.5% in sales revenue, dropping to $34.1 million, despite a 1.4% increase in total inventory to 30.2 million units. The Bottoms category consistently dominates revenue contribution, accounting for over 50% of weekly sales throughout the analyzed period, reaching 53.2% in the week of August 10, with $14.6 million in sales. Tops and Outerwear maintained their positions as the second and third highest revenue generators, respectively, with Outerwear showing robust performance.`;

const analysisSummary = `lululemon demonstrated total sales revenue of $151.1 million between July 25, 2025, and August 24, 2025, with weekly sales peaking at $39.5 million in the week of July 27, 2025. The company maintained a largely stable pricing strategy for its core offerings, supporting consistent revenue generation in key product categories like Bottoms. However, recent weeks have shown a 13.5% decline in sales revenue from the week of August 10 to August 17.

Recent Sales Performance and Product Trends
lululemon's weekly sales revenue experienced fluctuations, with the highest performance in the week of July 27, 2025, reaching $39.5 million from 558.7k units sold. Following this, weekly sales saw a slight dip to $38.2 million by August 3, before recovering to $39.4 million in the week of August 10. However, the week of August 17 marked a significant decrease of 13.5% in sales revenue, dropping to $34.1 million, despite a 1.4% increase in total inventory to 30.2 million units. The Bottoms category consistently dominates revenue contribution, accounting for over 50% of weekly sales throughout the analyzed period, reaching 53.2% in the week of August 10, with $14.6 million in sales. Tops and Outerwear maintained their positions as the second and third highest revenue generators, respectively, with Outerwear showing robust performance.`;

function createInitialMessages(prompt: string): Message[] {
  const uid = Date.now().toString();
  return [
    { id: `user-${uid}`, role: "user", content: prompt },
    {
      id: `assistant-card-${uid}`,
      role: "assistant",
      variant: "card",
      heading: "46s • Researching...",
      tag: "STEP 7/7",
      chips: ["Data sources", "Internet", "Search"],
      content: analysisCardContent,
    },
    {
      id: `assistant-${uid}`,
      role: "assistant",
      content: analysisSummary,
    },
  ];
}

function createFollowUpMessages(prompt: string): Message[] {
  const uid = Date.now().toString();
  return [
    { id: `user-follow-${uid}`, role: "user", content: prompt },
    {
      id: `assistant-follow-${uid}`,
      role: "assistant",
      content: `I'll look into "${prompt}" and refresh the analysis with the latest metrics. Check back shortly for new insights.`,
    },
  ];
}

function QuickFiltersRow({
  compact = false,
  align = "center",
}: {
  compact?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-sm text-white/60 ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      {quickFilters.map((filter) => (
        <Badge
          key={filter.label}
          className={`${filter.className} ${compact ? "!px-3 !py-1 text-xs" : ""}`}
        >
          {filter.label}
        </Badge>
      ))}
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full border-white/20 bg-transparent text-white/80 hover:border-white/30 hover:text-white ${
          compact ? "!h-9 !px-4 text-xs" : ""
        }`}
      >
        <ServerCog className="mr-2 h-4 w-4" strokeWidth={1.6} />
        Add more MCP servers
      </Button>
    </div>
  );
}

export default function MCPChatPage() {
  const [view, setView] = useState<"intro" | "chat">("intro");
  const [query, setQuery] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleIntroSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setMessages(createInitialMessages(trimmed));
    setView("chat");
    setQuery("");
  };

  const handleFollowUpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = followUp.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, ...createFollowUpMessages(trimmed)]);
    setFollowUp("");
  };

  const firstUserMessage = messages.find((message) => message.role === "user");
  const conversationTitle = firstUserMessage?.content ?? "Unnamed chat";

  return (
    <div className="flex h-[90vh] w-full flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="font-medium text-white">AI Analyst</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#0A0B14]">
            Beta
          </span>
          <span className="text-white/40">/</span>
          <span className="max-w-xs truncate text-sm text-white/70">
            {conversationTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 transition hover:border-white/30 hover:text-white"
            aria-label="Rename chat"
          >
            <Edit3 className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 transition hover:border-white/30 hover:text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 transition hover:border-white/30 hover:text-white"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {view === "chat" ? (
        <main className="flex-1 overflow-hidden px-6">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 py-8">
            <div className="flex-1 overflow-hidden rounded-3xl">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8">
              {messages.map((message) => {
                if (message.role === "assistant" && message.variant === "card") {
                  return (
                    <Card
                      key={message.id}
                      className="border-white/15 !bg-white/[0.05] text-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-white/60">
                        <span>{message.heading}</span>
                        {message.tag && (
                          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/50">
                            {message.tag}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
                        {message.content.split("\n\n").map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      {message.chips && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                          {message.chips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-white/15 px-3 py-1"
                            >
                              {chip}
                            </span>
                            ))}
                        </div>
                      )}
                    </Card>
                  );
                }
                if (message.role === "assistant") {
                  return (
                    <div key={message.id} className="space-y-3 text-sm leading-relaxed text-white/75">
                      {message.content.split("\n\n").map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={message.id} className="flex justify-end">
                    <span className="max-w-[70%] rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#0A0B14] shadow-sm">
                      {message.content}
                    </span>
                  </div>
                );
              })}
            </div>
                <form onSubmit={handleFollowUpSubmit} className="px-6 py-4 fixed bottom-0 w-full max-w-5xl bg-[#0A0B14]/80 backdrop-blur-md">
                  <div className="flex gap-3">
                    <Input
                      value={followUp}
                      onChange={(event) => setFollowUp(event.target.value)}
                      placeholder="Ask a follow-up question..."
                      className="h-11 border-white/15 bg-transparent text-sm text-white"
                    />
                    <Button type="submit" className="h-11 px-6">
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center px-6">
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                What conversation do you want to explore?
              </h1>
              <p className="text-sm text-white/60">
                Search across live, queued, and archived MCP sessions.
              </p>
            </div>

            <form
              onSubmit={handleIntroSubmit}
              className="flex w-full flex-col gap-3 md:flex-row md:items-center"
            >
              <div className="flex flex-1 items-center gap-3 rounded-full border border-white/12 px-4 py-1">
                <MessageCircle className="h-4 w-4 text-white/60" strokeWidth={1.6} />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask about eligibility checks, prior auth escalations, workflows..."
                  className="h-12 border-none px-0 text-base text-white focus-visible:ring-0"
                />
              </div>
              <Button type="submit" className="h-12 rounded-full px-6">
                Send
              </Button>
            </form>

            <QuickFiltersRow />
          </section>
        </main>
      )}
    </div>
  );
}
