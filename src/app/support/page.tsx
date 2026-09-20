"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type ChatMessage = {
  id: string;
  senderType: "customer" | "admin";
  message: string;
  createdAt: string;
};

type ChatResponse = {
  success?: boolean;
  conversation?: {
    id: string;
    status: "open" | "closed";
  } | null;
  messages?: ChatMessage[];
  error?: string;
};

const supportRoutes = [
  {
    number: "01",
    title: "Orders & access",
    text: "Purchased something already? Check your orders and eligible files.",
    href: "/account/orders",
    cta: "View orders",
    badge: "bg-orange-50 text-orange-600",
  },
  {
    number: "02",
    title: "Product questions",
    text: "Review products, pricing and details before making a purchase.",
    href: "/products",
    cta: "Browse products",
    badge: "bg-cyan-50 text-cyan-700",
  },
  {
    number: "03",
    title: "Refund & policy",
    text: "Read refund conditions and digital purchase terms before contacting support.",
    href: "/refund-policy",
    cta: "Read policy",
    badge: "bg-slate-100 text-slate-700",
  },
];

const faqs = [
  {
    q: "How long does support take?",
    a: "Most messages are reviewed during live support hours. Order details help us resolve issues faster.",
  },
  {
    q: "Where can I find my downloads?",
    a: "Eligible purchased files are available from your account and order area after payment is confirmed.",
  },
  {
    q: "What if I have a refund question?",
    a: "Review the refund policy first, then contact support with your order reference and a clear description of the issue.",
  },
];

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"open" | "closed" | null>(null);
  const [message, setMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const chatSectionRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadChat(silent = false) {
    try {
      if (!silent) {
        setLoadingChat(true);
      }

      const response = await fetch("/api/support/chat", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as ChatResponse | null;

      if (response.status === 401) {
        setNeedsLogin(true);
        setMessages([]);
        setChatStatus(null);
        setChatError("");
        return;
      }

      if (!response.ok) {
        if (!silent) {
          setChatError(data?.error || "Unable to load support chat.");
        }
        return;
      }

      setNeedsLogin(false);
      setChatError("");
      setChatStatus(data?.conversation?.status || null);
      setMessages(Array.isArray(data?.messages) ? data!.messages! : []);
    } catch {
      if (!silent) {
        setChatError("Unable to load support chat.");
      }
    } finally {
      if (!silent) {
        setLoadingChat(false);
      }
    }
  }

  useEffect(() => {
    loadChat();

    const interval = window.setInterval(() => {
      loadChat(true);
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages.length]);

  function focusChat() {
    chatSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || sending || needsLogin) {
      return;
    }

    setSending(true);
    setChatError("");

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
        }),
      });

      const data = (await response.json().catch(() => null)) as ChatResponse | null;

      if (response.status === 401) {
        setNeedsLogin(true);
        setChatError("Please sign in to start a support conversation.");
        return;
      }

      if (!response.ok) {
        setChatError(data?.error || "Unable to send your message.");
        return;
      }

      setMessage("");
      setNeedsLogin(false);
      setChatStatus(data?.conversation?.status || "open");
      setMessages(Array.isArray(data?.messages) ? data!.messages! : []);
    } catch {
      setChatError("Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6fb] text-[#0b1220]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1220]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-[-90px] top-[-50px] h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live support
            </div>

            <h1 className="mt-5 max-w-xl text-[34px] font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[64px]">
              Support that feels like a conversation.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base sm:leading-7 lg:text-lg">
              Questions about an order, product or download? Send us a message
              and we’ll guide you to the right place.
            </p>

            <div className="mt-6 grid max-w-[520px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">
                  Online hours
                </p>
                <p className="mt-1 text-[13px] font-black text-white sm:text-sm">
                  7:00 AM – 10:00 PM
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">
                  Support type
                </p>
                <p className="mt-1 text-[13px] font-black text-white sm:text-sm">
                  Orders · Products · Access
                </p>
              </div>
            </div>

            <div className="mt-6 grid max-w-[390px] grid-cols-2 gap-3">
              <button
                type="button"
                onClick={focusChat}
                className="flex min-h-12 items-center justify-center rounded-xl bg-[#ff6b13] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#f45f06]"
              >
                Start Live Chat
              </button>

              <Link
                href="/account/orders"
                className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-center text-sm font-black !text-white transition hover:bg-white/[0.1]"
              >
                View Orders
              </Link>
            </div>
          </div>

          {/* LIVE CHAT */}
          <div
            ref={chatSectionRef}
            className="relative mx-auto w-full min-w-0 max-w-[620px]"
          >
            <div className="absolute -inset-4 rounded-[34px] bg-gradient-to-br from-orange-500/20 via-transparent to-cyan-400/15 blur-2xl" />

            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_28px_70px_rgba(0,0,0,0.32)] sm:rounded-[30px]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcff] px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] font-black text-white">
                    Z
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">Zonix Support</p>
                    <p className="flex items-center gap-1.5 text-[10px] text-slate-500 sm:text-xs">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                      Online daily, 7 AM – 10 PM
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-orange-600 sm:text-[10px]">
                  {chatStatus === "closed" ? "Closed" : "Live help"}
                </span>
              </div>

              <div className="max-h-[410px] min-h-[300px] space-y-3 overflow-y-auto bg-[#f7f8fc] p-4 sm:space-y-4 sm:p-6">
                <div className="max-w-[86%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">
                    Hi 👋 How can we help today?
                  </p>
                </div>

                {loadingChat ? (
                  <div className="max-w-[86%] rounded-2xl bg-white px-4 py-3 text-xs text-slate-400 shadow-sm">
                    Loading your conversation...
                  </div>
                ) : null}

                {!loadingChat && needsLogin ? (
                  <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs leading-5 text-slate-700 sm:text-sm">
                      Sign in to start a private support conversation and keep your
                      message history linked to your account.
                    </p>
                    <Link
                      href="/login"
                      className="mt-3 inline-flex rounded-lg bg-[#0b1220] px-4 py-2 text-xs font-black !text-white"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : null}

                {!needsLogin &&
                  messages.map((item) => {
                    const isCustomer = item.senderType === "customer";

                    return (
                      <div
                        key={item.id}
                        className={
                          isCustomer
                            ? "ml-auto max-w-[84%] rounded-2xl rounded-tr-md bg-[#0b1220] px-4 py-3 text-white"
                            : "max-w-[86%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm"
                        }
                      >
                        <p
                          className={
                            isCustomer
                              ? "whitespace-pre-wrap break-words text-xs leading-5 sm:text-sm sm:leading-6"
                              : "whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6"
                          }
                        >
                          {item.message}
                        </p>
                        <p
                          className={
                            isCustomer
                              ? "mt-1 text-right text-[9px] text-white/45"
                              : "mt-1 text-[9px] text-slate-400"
                          }
                        >
                          {formatMessageTime(item.createdAt)}
                        </p>
                      </div>
                    );
                  })}

                {!needsLogin && messages.length === 0 && !loadingChat ? (
                  <div className="max-w-[86%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">
                      Send your first message below. Include an order number when
                      your question is about a purchase.
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-2 pt-1 sm:grid-cols-3">
                  <Link
                    href="/account/orders"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-[11px] font-black !text-slate-800 transition hover:border-orange-200 hover:!text-orange-600"
                  >
                    My Orders
                  </Link>

                  <Link
                    href="/products"
                    className="rounded-xl border border-orange-200 bg-white px-3 py-3 text-center text-[11px] font-black !text-slate-800 transition hover:!text-orange-600"
                  >
                    Products
                  </Link>

                  <Link
                    href="/refund-policy"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-[11px] font-black !text-slate-800 transition hover:border-orange-200 hover:!text-orange-600"
                  >
                    Refund Policy
                  </Link>
                </div>

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-slate-200 bg-white p-3 sm:p-4"
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      needsLogin
                        ? "Sign in to send a message"
                        : chatStatus === "closed"
                        ? "This conversation is closed"
                        : "Type your message..."
                    }
                    maxLength={4000}
                    rows={1}
                    disabled={needsLogin || chatStatus === "closed" || sending}
                    className="min-h-11 max-h-32 min-w-0 flex-1 resize-y rounded-xl border border-transparent bg-slate-100 px-4 py-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-200 focus:bg-white sm:text-sm"
                  />

                  <button
                    type="submit"
                    aria-label="Send support message"
                    disabled={
                      needsLogin ||
                      chatStatus === "closed" ||
                      sending ||
                      message.trim().length === 0
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff6b13] text-lg font-black text-white transition hover:bg-[#f45f06] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {sending ? "…" : "→"}
                  </button>
                </div>

                {chatError ? (
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    {chatError}
                  </p>
                ) : (
                  <p className="mt-2 text-[10px] text-slate-400">
                    Messages are saved securely to your account.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT ROUTES */}
      <section className="mx-auto max-w-6xl px-5 py-11 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-7 grid gap-3 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
              Get help faster
            </p>
            <h2 className="mt-2 max-w-2xl text-[30px] font-black leading-tight tracking-[-0.035em] sm:text-4xl">
              Choose your support route.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-500 lg:justify-self-end lg:text-right">
            Start with the area closest to your question so you can get to the
            right information quickly.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {supportRoutes.map((item) => (
            <Link
              key={item.number}
              href={item.href}
              className="group flex min-h-[210px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black ${item.badge}`}
              >
                {item.number}
              </div>

              <h3 className="mt-5 text-xl font-black">{item.title}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.text}
              </p>

              <span className="mt-auto pt-5 text-sm font-black text-orange-600">
                {item.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-5 pb-11 sm:px-6 lg:px-8 lg:pb-16">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white lg:grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="bg-[#0b1220] p-7 text-white sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Quick answers
            </p>

            <h2 className="mt-3 max-w-xs text-[28px] font-black leading-tight tracking-[-0.035em] sm:text-3xl">
              Before you message us.
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
              These are the most common support questions for a digital product store.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {faqs.map((item, index) => (
              <div key={item.q} className="p-5 sm:p-7">
                <div className="grid grid-cols-[28px_1fr] gap-3 sm:gap-4">
                  <span className="pt-1 text-[10px] font-black text-orange-600">
                    0{index + 1}
                  </span>

                  <div>
                    <h3 className="text-[15px] font-black leading-6 sm:text-lg">
                      {item.q}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] bg-gradient-to-r from-[#0b1220] via-[#111827] to-[#2b1a17] p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Live support
            </p>

            <h2 className="mt-2 max-w-2xl text-[27px] font-black leading-tight tracking-[-0.03em] sm:text-3xl">
              Online daily from 7 AM to 10 PM.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
              Send your question with the relevant order or product details.
            </p>
          </div>

          <button
            type="button"
            onClick={focusChat}
            className="flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#ff6b13] px-6 py-3 text-center text-sm font-black text-white transition hover:bg-[#f45f06]"
          >
            Start Support Request
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
