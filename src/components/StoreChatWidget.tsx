"use client";

import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi 👋 Welcome to ZonixAssets! I can help you with our products, prices, purchases and support. What would you like to know?",
};

export default function StoreChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    starterMessage,
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadWhatsapp, setLeadWhatsapp] = useState("");
  const [leadInterest, setLeadInterest] = useState("");
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadSuccess, setLeadSuccess] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hidden = useMemo(
    () => pathname?.startsWith("/admin") ?? false,
    [pathname]
  );

  if (hidden) {
    return null;
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || sending) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: message,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    try {
      const response = await fetch("/api/store-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "The AI assistant is unavailable right now."
        );
      }

      const reply =
        typeof data?.reply === "string"
          ? data.reply.trim()
          : "";

      if (!reply) {
        throw new Error(
          "The AI assistant returned an empty response."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      window.setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 50);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send your message right now."
      );
    } finally {
      setSending(false);
    }
  }

  async function saveLead(event: FormEvent) {
    event.preventDefault();

    try {
      setLeadSaving(true);
      setLeadError("");
      setLeadSuccess("");

      const lastUserMessage =
        [...messages]
          .reverse()
          .find((message) => message.role === "user")
          ?.content || "";

      const response = await fetch("/api/store-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          whatsapp: leadWhatsapp,
          interest: leadInterest,
          consent: leadConsent,
          lastMessage: lastUserMessage,
          messages,
          website: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save your details."
        );
      }

      setLeadSuccess(
        data?.message ||
          "Thanks! Your details have been saved."
      );
      setLeadName("");
      setLeadEmail("");
      setLeadWhatsapp("");
      setLeadInterest("");
      setLeadConsent(false);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Thanks! Your contact details have been saved for ZonixAssets follow-up.",
        },
      ]);
    } catch (saveError) {
      setLeadError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your details."
      );
    } finally {
      setLeadSaving(false);
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[100] sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="ZonixAssets AI assistant"
          className="mb-3 flex h-[min(680px,calc(100vh-110px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        >
          <header className="flex items-center justify-between gap-4 bg-[#ff6500] px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-[#081226]">
                ZA
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black">
                  ZonixAssets
                </p>
                <p className="text-[11px] font-semibold text-white/80">
                  AI Sales & Support
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl leading-none transition hover:bg-white/15"
            >
              ×
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[86%] whitespace-pre-wrap rounded-[18px] rounded-br-md bg-[#ff6500] px-4 py-3 text-sm leading-6 text-white"
                      : "max-w-[90%] whitespace-pre-wrap rounded-[18px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#172033] shadow-sm"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[18px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}

            {leadOpen && (
              <form
                onSubmit={saveLead}
                className="rounded-[22px] border border-orange-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#081226]">
                      Get ZonixAssets follow-up
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Share your details only if you want our team to contact you about your enquiry.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLeadOpen(false)}
                    aria-label="Close lead form"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-lg text-slate-500"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    value={leadName}
                    onChange={(event) =>
                      setLeadName(event.target.value)
                    }
                    maxLength={120}
                    placeholder="Your name"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
                  />

                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(event) =>
                      setLeadEmail(event.target.value)
                    }
                    maxLength={180}
                    placeholder="Email (or use WhatsApp below)"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
                  />

                  <input
                    value={leadWhatsapp}
                    onChange={(event) =>
                      setLeadWhatsapp(event.target.value)
                    }
                    maxLength={40}
                    placeholder="WhatsApp number (optional)"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
                  />

                  <input
                    value={leadInterest}
                    onChange={(event) =>
                      setLeadInterest(event.target.value)
                    }
                    maxLength={300}
                    placeholder="Which product are you interested in?"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
                  />
                </div>

                <label className="mt-3 flex items-start gap-2.5 text-[11px] leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={leadConsent}
                    onChange={(event) =>
                      setLeadConsent(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <span>
                    I agree that ZonixAssets may use these details to follow up about my enquiry. I can decline or stop follow-up at any time.
                  </span>
                </label>

                {leadError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold leading-5 text-red-700">
                    {leadError}
                  </div>
                )}

                {leadSuccess && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold leading-5 text-emerald-700">
                    {leadSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    leadSaving ||
                    !leadConsent ||
                    (!leadEmail.trim() &&
                      !leadWhatsapp.trim())
                  }
                  className="mt-4 min-h-11 w-full rounded-xl bg-[#081226] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {leadSaving
                    ? "Saving..."
                    : "Send my details"}
                </button>
              </form>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold leading-5 text-red-700">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            {!leadOpen && !leadSuccess && (
              <button
                type="button"
                onClick={() => setLeadOpen(true)}
                className="mb-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-700 transition hover:bg-orange-100"
              >
                Want a human follow-up? Share contact details
              </button>
            )}

            <form onSubmit={sendMessage}>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder="Type your message..."
                  aria-label="Chat message"
                  className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-[#081226] outline-none transition focus:border-orange-300 focus:bg-white sm:text-sm"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="min-h-12 rounded-2xl bg-[#ff6500] px-5 text-sm font-black text-white transition hover:bg-[#ed5d00] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>

            <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
              Live product data • Powered by GM AI
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          open
            ? "Close ZonixAssets AI assistant"
            : "Open ZonixAssets AI assistant"
        }
        className="ml-auto grid h-16 w-16 place-items-center rounded-full bg-[#ff6500] text-white shadow-[0_16px_36px_rgba(255,101,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ed5d00]"
      >
        {open ? (
          <span className="text-3xl leading-none">×</span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 fill-none stroke-current"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 18.5 3 21v-5.5A8.5 8.5 0 0 1 4 4.8 10.4 10.4 0 0 1 12 2c5 0 9 3.4 9 7.6s-4 7.6-9 7.6c-1.3 0-2.5-.2-3.6-.6L5 18.5Z" />
            <path d="M8 9.5h.01M12 9.5h.01M16 9.5h.01" />
          </svg>
        )}
      </button>
    </div>
  );
}
