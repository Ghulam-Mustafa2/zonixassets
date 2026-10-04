"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Rental = {
  id: string;
  order_item_id: string;
  business_name?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
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
  gm_embed_code?: string | null;
  gm_api_endpoint?: string | null;
  expires_at?: string | null;
};

export default function AIRentalSetup({
  orderItemId,
}: {
  orderItemId: string;
}) {
  const router = useRouter();
  const [rental, setRental] =
    useState<Rental | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const [businessName, setBusinessName] =
    useState("");
  const [websiteUrl, setWebsiteUrl] =
    useState("");
  const [logoUrl, setLogoUrl] =
    useState("");
  const [brandColor, setBrandColor] =
    useState("#1d4ed8");
  const [welcomeMessage, setWelcomeMessage] =
    useState(
      "Hi! How can I help your business today?"
    );
  const [systemPrompt, setSystemPrompt] =
    useState("");
  const [leadEnabled, setLeadEnabled] =
    useState(true);
  const [leadGoal, setLeadGoal] =
    useState("");

  async function loadRental() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/account/ai-rentals/${orderItemId}`,
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

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load AI rental."
        );
      }

      const value =
        data?.rental as Rental;

      setRental(value);
      setBusinessName(
        value.business_name || ""
      );
      setWebsiteUrl(
        value.website_url || ""
      );
      setLogoUrl(
        value.logo_url || ""
      );
      setBrandColor(
        value.brand_color ||
          "#1d4ed8"
      );
      setWelcomeMessage(
        value.welcome_message ||
          "Hi! How can I help your business today?"
      );
      setSystemPrompt(
        value.system_prompt || ""
      );
      setLeadEnabled(
        value.lead_capture_enabled !==
          false
      );
      setLeadGoal(
        value.lead_goal || ""
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load AI rental."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRental();
  }, [orderItemId]);

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/account/ai-rentals/${orderItemId}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              businessName,
              websiteUrl,
              logoUrl,
              brandColor,
              allowedOrigin:
                websiteUrl,
              welcomeMessage,
              systemPrompt,
              leadCaptureEnabled:
                leadEnabled,
              leadGoal,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save AI setup."
        );
      }

      setRental(
        data?.rental || rental
      );
      setSuccess(
        data?.message ||
          "AI setup submitted."
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save AI setup."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-slate-500">
        Loading your AI rental...
      </div>
    );
  }

  if (error && !rental) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const status =
    String(
      rental?.status ||
        "PENDING_SETUP"
    ).toUpperCase();

  const active =
    status === "ACTIVE";

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.08)]">
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff6500]">
                AI Rental
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#081226] sm:text-4xl">
                Configure Your AI
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Tell us about your business. We will configure your branded
                GM AI assistant, website integration and lead-generation
                behavior from these details.
              </p>
            </div>

            <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[.1em] text-cyan-700">
              {status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        {active && rental?.gm_embed_code ? (
          <div className="p-6 sm:p-8">
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-black text-emerald-800">
                Your AI is active
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-700">
                Copy the embed code below and paste it before the closing
                &lt;/body&gt; tag on your website.
              </p>
            </div>

            <div className="mt-6">
              <label className="text-xs font-black uppercase tracking-[.14em] text-slate-500">
                Website embed code
              </label>
              <textarea
                readOnly
                rows={6}
                value={
                  rental.gm_embed_code
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300"
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Info
                label="Monthly quota"
                value={String(
                  rental.monthly_quota ||
                    1000
                )}
              />
              <Info
                label="Expires"
                value={
                  rental.expires_at
                    ? new Date(
                        rental.expires_at
                      ).toLocaleDateString()
                    : "Managed by your rental plan"
                }
              />
              <Info
                label="Client slug"
                value={
                  rental.gm_client_slug ||
                  "—"
                }
              />
              <Info
                label="REST API"
                value={
                  rental.gm_api_endpoint ||
                  "—"
                }
              />
            </div>

            <Link
              href="/account"
              className="mt-7 inline-flex rounded-2xl bg-[#081226] px-5 py-3 text-sm font-black text-white"
            >
              Back to account
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Business name"
                value={businessName}
                onChange={setBusinessName}
                required
                placeholder="Acme Corp"
              />
              <Field
                label="Website URL"
                value={websiteUrl}
                onChange={setWebsiteUrl}
                placeholder="https://example.com"
              />
              <Field
                label="Logo URL"
                value={logoUrl}
                onChange={setLogoUrl}
                placeholder="https://..."
              />
              <div>
                <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
                  Brand color
                </label>
                <div className="mt-2 flex gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(event) =>
                      setBrandColor(
                        event.target.value
                      )
                    }
                    className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
                  />
                  <input
                    value={brandColor}
                    onChange={(event) =>
                      setBrandColor(
                        event.target.value
                      )
                    }
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#081226]"
                  />
                </div>
              </div>
            </div>

            <TextArea
              label="Welcome message"
              value={welcomeMessage}
              onChange={setWelcomeMessage}
              placeholder="Hi! How can I help your business today?"
            />

            <TextArea
              label="Business instructions for the AI"
              value={systemPrompt}
              onChange={setSystemPrompt}
              placeholder="Describe your business, products, tone, policies and what the assistant should or should not recommend."
            />

            <div className="mt-5 rounded-[22px] border border-cyan-200 bg-cyan-50/70 p-5">
              <label className="flex items-center gap-3 font-black text-[#081226]">
                <input
                  type="checkbox"
                  checked={leadEnabled}
                  onChange={(event) =>
                    setLeadEnabled(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />
                Enable lead generation
              </label>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The assistant should clearly tell visitors when contact
                details are being collected for business follow-up.
              </p>

              {leadEnabled && (
                <textarea
                  value={leadGoal}
                  onChange={(event) =>
                    setLeadGoal(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Example: Ask interested visitors for their name, WhatsApp number, city and the service they need, after clearly explaining that the details will be used for follow-up."
                  className="mt-4 w-full rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm leading-6 text-[#081226] outline-none"
                />
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {success}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 text-sm font-black text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Submit AI Setup"}
              </button>
              <Link
                href="/account"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-[#081226]"
              >
                Back to Account
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
        {label}
      </label>
      <input
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-[#081226] outline-none focus:border-orange-300 focus:bg-white"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-5">
      <label className="text-xs font-black uppercase tracking-[.12em] text-slate-500">
        {label}
      </label>
      <textarea
        rows={5}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-[#081226] outline-none focus:border-orange-300 focus:bg-white"
      />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-bold text-[#081226]">
        {value}
      </p>
    </div>
  );
}
