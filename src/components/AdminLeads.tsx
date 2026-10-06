"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  interest: string | null;
  source: string;
  status: string;
  consent_text: string | null;
  last_message: string | null;
  conversation_excerpt: Array<{
    role?: string;
    content?: string;
  }> | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: string) {
  switch (status) {
    case "new":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "contacted":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "qualified":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "won":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "closed":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function AdminLeads() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/leads", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load leads.");
      }

      setLeads(Array.isArray(data?.leads) ? data.leads : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? leads
        : leads.filter((lead) => lead.status === statusFilter),
    [leads, statusFilter]
  );

  async function saveLead(lead: Lead) {
    try {
      setSavingId(lead.id);
      setError("");

      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lead.id,
          status: lead.status,
          adminNotes: lead.admin_notes || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update lead.");
      }

      await loadLeads();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update lead."
      );
    } finally {
      setSavingId(null);
    }
  }

  function updateLocal(
    id: string,
    field: "status" | "admin_notes",
    value: string
  ) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id ? { ...lead, [field]: value } : lead
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081426]">
      <header className="border-b border-white/10 bg-[#10182d] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">
              ZonixAssets Admin
            </p>
            <h1 className="mt-1 text-2xl font-black">
              AI Sales Leads
            </h1>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm font-black">
            <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2">
              Dashboard
            </Link>
            <Link href="/admin/customers" className="rounded-xl border border-white/10 px-4 py-2">
              Customers
            </Link>
            <Link href="/admin/orders" className="rounded-xl border border-white/10 px-4 py-2">
              Orders
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 py-8 md:px-8">
        <div className="rounded-[28px] bg-[#071426] p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">
            Chatbot lead capture
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Follow up with interested visitors
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
            Leads shown here were submitted with visitor consent through the ZonixAssets AI assistant.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["all", "new", "contacted", "qualified", "won", "closed"].map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? "rounded-full bg-[#ff6500] px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500"
                  }
                >
                  {status}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={loadLeads}
            className="rounded-2xl bg-[#081226] px-5 py-3 text-sm font-black text-white"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-slate-500">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No leads in this view yet.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filtered.map((lead) => (
              <article
                key={lead.id}
                className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,.05)]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black">
                        {lead.name || "Interested visitor"}
                      </h3>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${statusClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="font-bold text-[#081226] hover:text-[#ff6500]">
                          {lead.email}
                        </a>
                      )}
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#081226] hover:text-[#ff6500]"
                        >
                          WhatsApp: {lead.whatsapp}
                        </a>
                      )}
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </div>

                  <select
                    value={lead.status}
                    onChange={(event) =>
                      updateLocal(lead.id, "status", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="won">Won</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">
                      Interested in
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#081226]">
                      {lead.interest || "General store enquiry"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">
                      Source
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#081226]">
                      {lead.source === "store_chat" ? "Store AI chatbot" : lead.source}
                    </p>
                  </div>
                </div>

                {lead.last_message && (
                  <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-orange-500">
                      Last customer message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {lead.last_message}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
                    Internal notes
                  </label>
                  <textarea
                    rows={3}
                    value={lead.admin_notes || ""}
                    onChange={(event) =>
                      updateLocal(lead.id, "admin_notes", event.target.value)
                    }
                    placeholder="Add follow-up notes..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-orange-300 focus:bg-white"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => saveLead(lead)}
                    disabled={savingId === lead.id}
                    className="rounded-2xl bg-[#081226] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {savingId === lead.id ? "Saving..." : "Save Lead"}
                  </button>

                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}?subject=ZonixAssets follow-up`}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#081226]"
                    >
                      Email Lead
                    </a>
                  )}

                  {lead.whatsapp && (
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700"
                    >
                      Open WhatsApp
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
