"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AnalyticsSummary = {
  totalProducts: number;
  totalAccounts: number;
  activeAccounts: number;
  suspendedAccounts: number;
  adminAccounts: number;
  customerAccounts: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

type StatusPoint = {
  status: string;
  count: number;
};

type TopProduct = {
  title: string;
  quantity: number;
  revenue: number;
};

type RecentSignup = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
};

type AnalyticsResponse = {
  success: boolean;
  range: {
    from: string | null;
    to: string | null;
  };
  summary: AnalyticsSummary;
  revenueByDay: RevenuePoint[];
  orderStatusBreakdown: StatusPoint[];
  topProducts: TopProduct[];
  recentSignups: RecentSignup[];
  error?: string;
  code?: string;
};

const emptySummary: AnalyticsSummary = {
  totalProducts: 0,
  totalAccounts: 0,
  activeAccounts: 0,
  suspendedAccounts: 0,
  adminAccounts: 0,
  customerAccounts: 0,
  totalOrders: 0,
  paidOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  refundedOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function dateInputValue(date: Date) {
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 10);
}

function statusClasses(status: string) {
  switch (String(status).toUpperCase()) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "REFUNDED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function AdminAnalytics() {
  const router = useRouter();

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadAnalytics(
    from = fromDate,
    to = toDate
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const query = params.toString();

      const response = await fetch(
        `/api/admin/analytics${query ? `?${query}` : ""}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as Partial<AnalyticsResponse>;

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (response.status === 403) {
        if (result.code === "ACCOUNT_SUSPENDED") {
          router.replace("/login");
          router.refresh();
          return;
        }

        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Unable to load analytics.");
      }

      setData(result as AnalyticsResponse);
    } catch (loadError) {
      console.error("ADMIN_ANALYTICS_UI_ERROR:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();

    start.setDate(end.getDate() - (days - 1));

    const from = dateInputValue(start);
    const to = dateInputValue(end);

    setFromDate(from);
    setToDate(to);
    loadAnalytics(from, to);
  }

  function clearRange() {
    setFromDate("");
    setToDate("");
    loadAnalytics("", "");
  }

  const maxRevenue = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.revenueByDay || []).map((item) => item.revenue)
      ),
    [data]
  );

  const maxProductQuantity = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.topProducts || []).map((item) => item.quantity)
      ),
    [data]
  );

  const summary = data?.summary || emptySummary;

  const rangeLabel =
    data?.range?.from || data?.range?.to
      ? `${data?.range?.from || "Beginning"} → ${data?.range?.to || "Today"}`
      : "All time";

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#091426]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1226]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white text-base font-black text-[#091426] shadow-sm"
            >
              <span className="block leading-none text-[#091426]">Z</span>
            </Link>

            <div className="min-w-0">
              <Link
                href="/admin"
                className="block truncate text-base font-black tracking-tight sm:text-lg"
              >
                Zonix<span className="text-cyan-400">Assets</span>
              </Link>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                Admin analytics
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers">Customers</AdminNav>
            <AdminNav href="/admin/audit-logs">Audit Logs</AdminNav>
          </nav>

          <Link
            href="/"
            className="rounded-xl bg-[#ff650f] px-4 py-2 text-sm font-black text-white shadow-[0_10px_30px_rgba(255,101,15,0.22)] transition hover:-translate-y-0.5"
          >
            View Store
          </Link>
        </div>

        <div className="overflow-x-auto border-t border-white/5 px-4 py-1.5 md:hidden">
          <div className="flex min-w-max gap-2">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers">Customers</AdminNav>
            <AdminNav href="/admin/audit-logs">Audit Logs</AdminNav>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#091426] text-white">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#ff650f]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1500px] gap-7 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-[#ff650f]" />
              Performance center
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Store analytics,
              <span className="block text-white/45">made easy to read.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
              Track revenue, orders, customers and product performance from one
              clean admin view.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadAnalytics()}
                disabled={loading}
                className="rounded-2xl bg-[#ff650f] px-5 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(255,101,15,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Analytics"}
              </button>

              <Link
                href="/admin"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:self-end">
            <HeroMetric
              label="Selected range"
              value={rangeLabel}
              wide
            />
            <HeroMetric
              label="Paid revenue"
              value={formatMoney(summary.totalRevenue)}
            />
            <HeroMetric
              label="Paid orders"
              value={String(summary.paidOrders)}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {error && (
          <div className="mb-7 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
                Date filter
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Choose reporting range
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use a custom range or select one of the quick presets.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-[1fr_1fr_auto]">
              <label>
                <span className="mb-2 block text-xs font-bold text-slate-500">
                  From date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-bold text-slate-500">
                  To date
                </span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <button
                type="button"
                onClick={() => loadAnalytics()}
                className="self-end rounded-2xl bg-[#091426] px-5 py-3 font-black text-white transition hover:bg-[#121d35]"
              >
                Apply Range
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <PresetButton onClick={() => applyPreset(1)}>Today</PresetButton>
            <PresetButton onClick={() => applyPreset(7)}>Last 7 Days</PresetButton>
            <PresetButton onClick={() => applyPreset(30)}>Last 30 Days</PresetButton>
            <PresetButton onClick={clearRange} danger>
              All Time
            </PresetButton>
          </div>
        </section>

        {loading && !data ? (
          <div className="mt-7 rounded-[28px] border border-slate-200 bg-white p-14 text-center text-sm font-semibold text-slate-400 shadow-sm">
            Loading analytics...
          </div>
        ) : (
          <>
            <section className="mt-7">
              <SectionHeading
                eyebrow="Performance"
                title="Revenue & orders"
                description="Core store performance for the selected reporting period."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                <StatCard
                  label="Revenue"
                  value={formatMoney(summary.totalRevenue)}
                  helper="Paid order revenue"
                  accent="orange"
                />
                <StatCard
                  label="Avg order"
                  value={formatMoney(summary.averageOrderValue)}
                  helper="Average paid order value"
                  accent="cyan"
                />
                <StatCard
                  label="Total orders"
                  value={String(summary.totalOrders)}
                  helper="Orders in selected range"
                />
                <StatCard
                  label="Paid"
                  value={String(summary.paidOrders)}
                  helper="Payment confirmed"
                  accent="green"
                />
                <StatCard
                  label="Pending"
                  value={String(summary.pendingOrders)}
                  helper="Waiting for payment"
                  accent="yellow"
                />
                <StatCard
                  label="Cancelled"
                  value={String(summary.cancelledOrders)}
                  helper="Cancelled orders"
                  accent="red"
                />
              </div>
            </section>

            <section className="mt-8">
              <SectionHeading
                eyebrow="Accounts"
                title="Platform health"
                description="A quick overview of products, customers and account status."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                <StatCard
                  label="Products"
                  value={String(summary.totalProducts)}
                  helper="Store products"
                  accent="orange"
                />
                <StatCard
                  label="Accounts"
                  value={String(summary.totalAccounts)}
                  helper="All profiles"
                />
                <StatCard
                  label="Active"
                  value={String(summary.activeAccounts)}
                  helper="Accounts with access"
                  accent="green"
                />
                <StatCard
                  label="Suspended"
                  value={String(summary.suspendedAccounts)}
                  helper="Access blocked"
                  accent="red"
                />
                <StatCard
                  label="Admins"
                  value={String(summary.adminAccounts)}
                  helper="Administrator accounts"
                  accent="purple"
                />
                <StatCard
                  label="Customers"
                  value={String(summary.customerAccounts)}
                  helper="Customer accounts"
                  accent="cyan"
                />
              </div>
            </section>

            <section className="mt-8 grid gap-5 xl:grid-cols-2">
              <Panel
                eyebrow="Revenue"
                title="Revenue by day"
                description="Daily paid revenue and order volume."
              >
                {data?.revenueByDay?.length ? (
                  <div className="space-y-5">
                    {data.revenueByDay.map((point) => (
                      <div key={point.date}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                          <span className="font-semibold text-slate-500">
                            {formatShortDate(point.date)}
                          </span>

                          <div className="text-right">
                            <span className="font-black text-[#091426]">
                              {formatMoney(point.revenue)}
                            </span>
                            <span className="ml-2 text-xs text-slate-400">
                              {point.orders} order{point.orders === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#ff650f]"
                            style={{
                              width: `${Math.max(
                                4,
                                (point.revenue / maxRevenue) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No paid revenue found for this range." />
                )}
              </Panel>

              <Panel
                eyebrow="Orders"
                title="Status breakdown"
                description="How orders are distributed by payment state."
              >
                {(data?.orderStatusBreakdown || []).length ? (
                  <div className="space-y-3">
                    {(data?.orderStatusBreakdown || []).map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8fafc] p-4"
                      >
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-black ${statusClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        <span className="text-2xl font-black">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No order status data found." />
                )}
              </Panel>
            </section>

            <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-100 p-6 sm:p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
                  Products
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Top selling products
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Ranked by paid quantity sold.
                </p>
              </div>

              {data?.topProducts?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.topProducts.map((product, index) => (
                    <div key={`${product.title}-${index}`} className="p-6 sm:px-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#ff650f]">
                            #{String(index + 1).padStart(2, "0")}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-black">
                            {product.title}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-8">
                          <MiniValue label="Sold" value={String(product.quantity)} />
                          <MiniValue
                            label="Revenue"
                            value={formatMoney(product.revenue)}
                            orange
                          />
                        </div>
                      </div>

                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#091426]"
                          style={{
                            width: `${Math.max(
                              4,
                              (product.quantity / maxProductQuantity) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No paid product sales found for this range." />
              )}
            </section>

            <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
                    Accounts
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Recent signups
                  </h2>
                </div>

                <Link
                  href="/admin/customers"
                  className="w-fit text-sm font-black text-[#ff650f] transition hover:text-orange-700"
                >
                  Manage Customers →
                </Link>
              </div>

              {data?.recentSignups?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.recentSignups.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">{user.name}</p>

                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                            {user.role}
                          </span>

                          <span
                            className={
                              user.isActive
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"
                                : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700"
                            }
                          >
                            {user.isActive ? "ACTIVE" : "SUSPENDED"}
                          </span>
                        </div>

                        <p className="mt-2 break-all text-sm text-slate-500">
                          {user.email}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>

                      <Link
                        href={`/admin/customers/${user.id}`}
                        className="w-fit rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-black transition hover:border-[#ff650f] hover:text-[#ff650f]"
                      >
                        View Customer
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No account signups found." />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AdminNav({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

function HeroMetric({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-black">{value}</p>
    </div>
  );
}

function PresetButton({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-black transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-slate-200 bg-[#f8fafc] text-slate-600 hover:border-[#ff650f] hover:text-[#ff650f]"
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.05)] sm:p-7">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "navy",
}: {
  label: string;
  value: string;
  helper: string;
  accent?: "navy" | "orange" | "cyan" | "green" | "yellow" | "red" | "purple";
}) {
  const accentStyles = {
    navy: "bg-slate-100 text-[#091426]",
    orange: "bg-orange-50 text-[#ff650f]",
    cyan: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-base font-black ${accentStyles[accent]}`}
      >
        ✦
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}

function MiniValue({
  label,
  value,
  orange = false,
}: {
  label: string;
  value: string;
  orange?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-1 font-black ${orange ? "text-[#ff650f]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#f8fafc] px-5 py-10 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}
