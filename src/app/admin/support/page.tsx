"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ConversationSummary = {
  id: string;
  userId: string;
  status: "open" | "closed";
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  latestMessage: {
    message: string;
    senderType: "customer" | "admin";
    createdAt: string;
  } | null;
  unreadCustomerMessages: number;
};

type ChatMessage = {
  id: string;
  senderType: "customer" | "admin";
  message: string;
  createdAt: string;
  readAt: string | null;
};

type ConversationDetail = {
  id: string;
  status: "open" | "closed";
  subject: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  messages: ChatMessage[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function customerName(customer: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  return (
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.email ||
    "Customer"
  );
}

export default function AdminSupportPage() {
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");
  const [reply, setReply] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const filteredConversations = useMemo(() => {
    if (filter === "all") return conversations;
    return conversations.filter((item) => item.status === filter);
  }, [conversations, filter]);

  async function handleAuthError(response: Response, payload: any) {
    if (response.status === 401) {
      router.replace("/login");
      router.refresh();
      return true;
    }

    if (response.status === 403) {
      setError(payload?.error || "You do not have permission to access support.");
      return true;
    }

    return false;
  }

  async function loadConversations(silent = false) {
    try {
      if (!silent) setLoadingList(true);

      const response = await fetch("/api/admin/support/conversations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (await handleAuthError(response, payload)) return;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load support conversations.");
      }

      const rows = Array.isArray(payload?.conversations)
        ? (payload.conversations as ConversationSummary[])
        : [];

      setConversations(rows);
      setError("");

      if (!selectedId && rows.length > 0) {
        const firstOpen = rows.find((item) => item.status === "open") || rows[0];
        setSelectedId(firstOpen.id);
      }

      if (selectedId && !rows.some((item) => item.id === selectedId)) {
        setSelectedId(rows[0]?.id || "");
        setDetail(null);
      }
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load support conversations."
        );
      }
    } finally {
      if (!silent) setLoadingList(false);
    }
  }

  async function loadConversation(id: string, silent = false) {
    if (!id) {
      setDetail(null);
      return;
    }

    try {
      if (!silent) setLoadingDetail(true);

      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const payload = await response.json().catch(() => null);

      if (await handleAuthError(response, payload)) return;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load conversation.");
      }

      setDetail(payload?.conversation || null);
      setError("");

      // Refresh list so unread badge is updated after opening a chat.
      loadConversations(true);
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load conversation."
        );
      }
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadConversations();

    const interval = window.setInterval(() => {
      loadConversations(true);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    loadConversation(selectedId);

    const interval = window.setInterval(() => {
      loadConversation(selectedId, true);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [detail?.messages.length]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanReply = reply.trim();
    if (!selectedId || !cleanReply || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(selectedId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: cleanReply,
          }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (await handleAuthError(response, payload)) return;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send reply.");
      }

      setReply("");
      setDetail(payload?.conversation || null);
      loadConversations(true);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send reply."
      );
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: "open" | "closed") {
    if (!selectedId || changingStatus) return;

    setChangingStatus(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(selectedId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (await handleAuthError(response, payload)) return;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update conversation.");
      }

      setDetail(payload?.conversation || null);
      loadConversations(true);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update conversation."
      );
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081426]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10182d] text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-[#0b1527]"
            >
              ZA
            </Link>
            <div>
              <h1 className="text-lg font-black">Support Chats</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Admin Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold !text-white transition hover:bg-white/10"
            >
              Dashboard
            </Link>
            <Link
              href="/support"
              className="hidden rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold !text-white transition hover:bg-white/10 sm:inline-flex"
            >
              View Support Page
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-5 py-7 md:px-8 md:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-500">
              Customer Support
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Live support inbox
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Read customer messages, reply directly and close resolved conversations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["open", "closed", "all"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  filter === item
                    ? "bg-[#0b1527] text-white"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-orange-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid min-h-[680px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)] lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-slate-200 bg-[#fbfcff] lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black">Conversations</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {filteredConversations.length} shown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadConversations()}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto">
              {loadingList ? (
                <div className="p-6 text-sm text-slate-400">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                    ✦
                  </div>
                  <h3 className="mt-4 font-black">No conversations</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Customer messages will appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                      selectedId === item.id
                        ? "bg-orange-50/70"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0b1527]">
                          {customerName(item.customer)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {item.customer.email}
                        </p>
                      </div>

                      {item.unreadCustomerMessages > 0 ? (
                        <span className="flex min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black text-white">
                          {item.unreadCustomerMessages}
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                            item.status === "open"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.latestMessage?.message || "No messages yet"}
                    </p>

                    <p className="mt-2 text-[10px] font-semibold text-slate-300">
                      {formatDate(item.lastMessageAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[680px] min-w-0 flex-col">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-xl text-orange-500">
                    ✦
                  </div>
                  <h3 className="mt-4 text-xl font-black">Select a conversation</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Choose a customer message from the inbox.
                  </p>
                </div>
              </div>
            ) : loadingDetail && !detail ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Loading conversation...
              </div>
            ) : detail ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black">
                        {customerName(detail.customer)}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                          detail.status === "open"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {detail.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {detail.customer.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={changingStatus}
                    onClick={() =>
                      updateStatus(detail.status === "open" ? "closed" : "open")
                    }
                    className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:border-orange-200 hover:text-orange-600 disabled:opacity-50"
                  >
                    {changingStatus
                      ? "Updating..."
                      : detail.status === "open"
                      ? "Close Conversation"
                      : "Reopen Conversation"}
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f8fc] p-5 sm:p-6">
                  {detail.messages.length === 0 ? (
                    <div className="text-sm text-slate-400">No messages yet.</div>
                  ) : (
                    detail.messages.map((item) => {
                      const fromAdmin = item.senderType === "admin";

                      return (
                        <div
                          key={item.id}
                          className={
                            fromAdmin
                              ? "ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-[#0b1527] px-4 py-3 text-white"
                              : "max-w-[82%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
                          }
                        >
                          <p
                            className={`whitespace-pre-wrap break-words text-sm leading-6 ${
                              fromAdmin ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {item.message}
                          </p>
                          <p
                            className={`mt-1 text-[10px] ${
                              fromAdmin ? "text-right text-white/40" : "text-slate-300"
                            }`}
                          >
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={sendReply}
                  className="border-t border-slate-200 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-end gap-3">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={2}
                      maxLength={4000}
                      disabled={detail.status === "closed" || sending}
                      placeholder={
                        detail.status === "closed"
                          ? "Reopen this conversation to reply"
                          : "Type your reply..."
                      }
                      className="max-h-36 min-h-[52px] min-w-0 flex-1 resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-200 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="submit"
                      disabled={
                        detail.status === "closed" ||
                        sending ||
                        reply.trim().length === 0
                      }
                      className="min-h-[52px] shrink-0 rounded-2xl bg-[#ff6500] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e95d00] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {sending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-400">
                    Customer will see your reply on their Support page.
                  </p>
                </form>
              </>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
