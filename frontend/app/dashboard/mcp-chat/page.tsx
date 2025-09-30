"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Edit3,
  Loader2,
  MessageCircle,
  Search,
  ServerCog,
  Share2,
} from "lucide-react";
import { useChatMutation, useExecutePlanMutation } from "@/lib/api";
import type { ChatMessage, ChatRequestPayload } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  variant?: "plan";
  planState?: "ready" | "executing" | "completed" | "cancelled";
  error?: string;
};

type PendingPlan = {
  request: ChatRequestPayload;
  messageId: string;
};

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);

  const chatMutation = useChatMutation();
  const executePlanMutation = useExecutePlanMutation();

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addAssistantMessage = (content: string) => {
  const id = `assistant-${makeId()}`;
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        content,
      },
    ]);
    setHistory((prev) => {
      const updated = [...prev, { role: "assistant", content }];
      historyRef.current = updated;
      return updated;
    });
  };

  const isBusy = chatMutation.isPending || executePlanMutation.isPending;

  const submitPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isBusy) return;

    if (pendingPlan) {
      const { messageId } = pendingPlan;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, planState: "cancelled" } : msg,
        ),
      );
      setPendingPlan(null);
    }

    const historySnapshot = historyRef.current;
    const userMessage: Message = {
  id: `user-${makeId()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);

    const updatedHistory = [...historySnapshot, { role: "user", content: trimmed }];
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);

    setView("chat");
  setPendingPlan(null);

    const request: ChatRequestPayload = {
      message: trimmed,
      history: historySnapshot,
    };

    try {
      const response = await chatMutation.mutateAsync(request);
      if (response.is_plan) {
  const planId = `plan-${makeId()}`;
        setPendingPlan({ request, messageId: planId });
        setMessages((prev) => [
          ...prev,
          {
            id: planId,
            role: "assistant",
            content: response.response,
            variant: "plan",
            planState: "ready",
          },
        ]);
      } else {
        addAssistantMessage(response.response);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong while contacting the agent.";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${makeId()}`,
          role: "assistant",
          content: message,
        },
      ]);
    }
  };

  const handleExecutePlan = async () => {
    if (!pendingPlan) return;

    const { messageId, request } = pendingPlan;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, planState: "executing", error: undefined }
          : msg,
      ),
    );

    try {
      const result = await executePlanMutation.mutateAsync(request);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, planState: "completed" }
            : msg,
        ),
      );
      addAssistantMessage(result.response);
      setPendingPlan(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to execute the approved plan.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, planState: "ready", error: message }
            : msg,
        ),
      );
    }
  };

  const handleCancelPlan = () => {
    if (!pendingPlan) return;

    const { messageId } = pendingPlan;
    setPendingPlan(null);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, planState: "cancelled" }
          : msg,
      ),
    );
  };

  const handleIntroSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    setQuery("");
    submitPrompt(trimmed).catch(() => {
      // errors handled within submitPrompt
    });
  };

  const handleFollowUpSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isBusy) return;
    const trimmed = followUp.trim();
    if (!trimmed) return;
    setFollowUp("");
    submitPrompt(trimmed).catch(() => {
      // errors handled within submitPrompt
    });
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
                <div
                  ref={messagesContainerRef}
                  className="flex-1 space-y-6 overflow-y-auto px-6 py-8"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                      Ask a question to start the conversation.
                    </div>
                  ) : (
                    messages.map((message) => {
                      if (message.role === "assistant" && message.variant === "plan") {
                        const isActivePlan = pendingPlan?.messageId === message.id;
                        const isExecuting = message.planState === "executing";
                        const isCompleted = message.planState === "completed";
                        const isCancelled = message.planState === "cancelled";

                        return (
                          <Card
                            key={message.id}
                            className="border-white/15 bg-white/[0.04] text-white"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
                              <span>Plan Proposed</span>
                              <span>
                                {isExecuting
                                  ? "Executing"
                                  : isCompleted
                                    ? "Completed"
                                    : isCancelled
                                      ? "Cancelled"
                                      : "Waiting approval"}
                              </span>
                            </div>
                            <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
                              {message.content.split("\n\n").map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                            {message.error ? (
                              <p className="mt-4 text-sm text-rose-300/80">
                                {message.error}
                              </p>
                            ) : null}
                            <div className="mt-5 flex flex-wrap gap-3">
                              {isActivePlan && !isCompleted && !isCancelled ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleExecutePlan}
                                    disabled={isExecuting || isBusy}
                                  >
                                    {isExecuting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : null}
                                    Execute plan
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 text-white/80 hover:border-white/40"
                                    onClick={handleCancelPlan}
                                    disabled={isExecuting || isBusy}
                                  >
                                    Dismiss
                                  </Button>
                                </>
                              ) : isCompleted ? (
                                <span className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                                  Plan executed successfully
                                </span>
                              ) : null}
                            </div>
                          </Card>
                        );
                      }

                      if (message.role === "assistant") {
                        return (
                          <div
                            key={message.id}
                            className="space-y-3 text-sm leading-relaxed text-white/75"
                          >
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
                    })
                  )}
                </div>
                <form
                  onSubmit={handleFollowUpSubmit}
                  className="border-t border-white/10 px-6 py-4 backdrop-blur-md"
                >
                  <div className="flex gap-3">
                    <Input
                      value={followUp}
                      onChange={(event) => setFollowUp(event.target.value)}
                      placeholder="Ask a follow-up question..."
                      className="h-11 border-white/15 bg-transparent text-sm text-white"
                      disabled={isBusy}
                    />
                    <Button
                      type="submit"
                      className="h-11 px-6"
                      disabled={isBusy}
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
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
                  disabled={isBusy}
                />
              </div>
              <Button type="submit" className="h-12 rounded-full px-6" disabled={isBusy}>
                {isBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
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
