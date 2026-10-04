"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Rental = {
  id: string;
  customer_email?: string;
  product_title?: string;
  business_name?: string | null;
  website_url?: string | null;
  brand_color?: string | null;
  allowed_origin?: string | null;
  welcome_message?: string | null;
  system_prompt?: string | null;
  lead_capture_enabled?: boolean;
  lead_goal?: string | null;
  monthly_quota?: number;
  status?: string;
  gm_client_name?: string | null;
  gm_client_slug?: string | null;
  gm_api_key?: string | null;
  gm_embed_code?: string | null;
  gm_api_endpoint?: string | null;
  expires_at?: string | null;
  admin_notes?: string | null;
  created_at?: string;
};

export default function AdminAIRentals() {
  const router = useRouter();
  const [rentals, setRentals] =
    useState<Rental[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [savingId, setSavingId] =
    useState<string | null>(null);

  async function loadRentals() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/ai-rentals",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        setError(
          data?.error ||
            "You do not have permission to access AI rentals."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load AI rentals."
        );
      }

      setRentals(
        Array.isArray(
          data?.rentals
        )
          ? data.rentals
          : []
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load AI rentals."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRentals();
  }, []);

  function updateLocal(
    id: string,
    field: keyof Rental,
    value: string | number
  ) {
    setRentals((current) =>
      current.map((rental) =>
        rental.id === id
          ? {
              ...rental,
              [field]: value,
            }
          : rental
      )
    );
  }

  async function saveRental(
    event: FormEvent,
    rental: Rental
  ) {
    event.preventDefault();

    try {
      setSavingId(rental.id);
      setError("");

      const response =
        await fetch(
          "/api/admin/ai-rentals",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: rental.id,
              status:
                rental.status,
              monthlyQuota:
                rental.monthly_quota,
              expiresAt:
                rental.expires_at ||
                null,
              gmClientName:
                rental.gm_client_name,
              gmClientSlug:
                rental.gm_client_slug,
              gmApiKey:
                rental.gm_api_key,
              gmEmbedCode:
                rental.gm_embed_code,
              gmApiEndpoint:
                rental.gm_api_endpoint,
              adminNotes:
                rental.admin_notes,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save AI rental."
        );
      }

      await loadRentals();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save AI rental."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
      <header className="border-b border-white/10 bg-[#111d34] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">
              ZonixAssets Admin
            </p>
            <h1 className="mt-1 text-2xl font-black">
              AI Rentals
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-black">
            <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2">
              Dashboard
            </Link>
            <Link href="/admin/products" className="rounded-xl border border-white/10 px-4 py-2">
              Products
            </Link>
            <Link href="/admin/orders" className="rounded-xl border border-white/10 px-4 py-2">
              Orders
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
        <div className="rounded-[28px] bg-[#071426] p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">
            Managed AI delivery
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Provision paid GM AI rentals
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
            Customers submit their setup after payment. Create the matching
            client inside GM AI, then paste the generated embed code and
            integration details here. Activating a rental publishes those
            details to the customer account.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-slate-500">
            Loading AI rentals...
          </div>
        ) : rentals.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No AI rental purchases yet.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {rentals.map((rental) => (
              <form
                key={rental.id}
                onSubmit={(event) =>
                  saveRental(
                    event,
                    rental
                  )
                }
                className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,.05)]"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.14em] text-[#ff6500]">
                      {rental.product_title || "AI Rental"}
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      {rental.business_name || "Waiting for customer setup"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {rental.customer_email || "Customer"} · {rental.website_url || "No website submitted"}
                    </p>
                  </div>

                  <select
                    value={rental.status || "PENDING_SETUP"}
                    onChange={(event) =>
                      updateLocal(
                        rental.id,
                        "status",
                        event.target.value
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black"
                  >
                    <option value="PENDING_SETUP">Pending setup</option>
                    <option value="READY_FOR_PROVISIONING">Ready for provisioning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <ReadOnly label="Allowed origin" value={rental.allowed_origin || "Any origin"} />
                  <ReadOnly label="Brand color" value={rental.brand_color || "#1d4ed8"} />
                  <ReadOnly label="Welcome message" value={rental.welcome_message || "—"} />
                  <ReadOnly label="Lead capture" value={rental.lead_capture_enabled === false ? "Off" : "On"} />
                </div>

                <ReadOnlyBlock label="Customer AI instructions" value={rental.system_prompt || "No custom instructions submitted."} />
                <ReadOnlyBlock label="Lead goal" value={rental.lead_goal || "No lead goal submitted."} />

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Input
                    label="GM client name"
                    value={rental.gm_client_name || ""}
                    onChange={(value) => updateLocal(rental.id, "gm_client_name", value)}
                    placeholder="Client name in GM AI"
                  />
                  <Input
                    label="GM client slug"
                    value={rental.gm_client_slug || ""}
                    onChange={(value) => updateLocal(rental.id, "gm_client_slug", value)}
                    placeholder="client-slug"
                  />
                  <Input
                    label="Monthly quota"
                    type="number"
                    value={String(rental.monthly_quota || 1000)}
                    onChange={(value) => updateLocal(rental.id, "monthly_quota", Number(value || 0))}
                    placeholder="1000"
                  />
                  <Input
                    label="Expires on"
                    type="datetime-local"
                    value={rental.expires_at ? rental.expires_at.slice(0,16) : ""}
                    onChange={(value) => updateLocal(rental.id, "expires_at", value)}
                    placeholder=""
                  />
                  <Input
                    label="GM API key"
                    value={rental.gm_api_key || ""}
                    onChange={(value) => updateLocal(rental.id, "gm_api_key", value)}
                    placeholder="gmai_..."
                  />
                  <Input
                    label="REST API endpoint"
                    value={rental.gm_api_endpoint || "https://gm-ai-boss.lovable.app/api/public/client-chat"}
                    onChange={(value) => updateLocal(rental.id, "gm_api_endpoint", value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="mt-5">
                  <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
                    GM AI embed code
                  </label>
                  <textarea
                    rows={5}
                    value={rental.gm_embed_code || ""}
                    onChange={(event) =>
                      updateLocal(
                        rental.id,
                        "gm_embed_code",
                        event.target.value
                      )
                    }
                    placeholder="<script src=...></script>"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-orange-300 focus:bg-white"
                  />
                </div>

                <div className="mt-5">
                  <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
                    Internal notes
                  </label>
                  <textarea
                    rows={3}
                    value={rental.admin_notes || ""}
                    onChange={(event) =>
                      updateLocal(
                        rental.id,
                        "admin_notes",
                        event.target.value
                      )
                    }
                    placeholder="Provisioning notes, payment plan, contact person..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-orange-300 focus:bg-white"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingId === rental.id}
                    className="rounded-2xl bg-[#081226] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {savingId === rental.id
                      ? "Saving..."
                      : rental.status === "ACTIVE"
                        ? "Save & Publish Access"
                        : "Save Rental"}
                  </button>
                  <a
                    href="https://gm-ai-boss.lovable.app/app/admin"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-[#081226]"
                  >
                    Open GM AI Admin ↗
                  </a>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-[#081226]">{value}</p>
    </div>
  );
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300 focus:bg-white"
      />
    </div>
  );
}
