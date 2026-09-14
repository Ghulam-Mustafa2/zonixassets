"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
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

function formatMoney(
  value: number
) {
  return `$${Number(
    value || 0
  ).toFixed(2)}`;
}

function formatDate(
  value: string | null
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function formatShortDate(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function dateInputValue(
  date: Date
) {
  const local =
    new Date(
      date.getTime() -
        date.getTimezoneOffset() *
          60_000
    );

  return local
    .toISOString()
    .slice(0, 10);
}

function statusClasses(
  status: string
) {
  switch (
    String(status).toUpperCase()
  ) {
    case "PAID":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "PENDING":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    case "CANCELLED":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    case "REFUNDED":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

export default function AdminAnalytics() {
  const router = useRouter();

  const [data, setData] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  async function loadAnalytics(
    from = fromDate,
    to = toDate
  ) {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (from) {
        params.set(
          "from",
          from
        );
      }

      if (to) {
        params.set(
          "to",
          to
        );
      }

      const query =
        params.toString();

      const response =
        await fetch(
          `/api/admin/analytics${
            query
              ? `?${query}`
              : ""
          }`,
          {
            method: "GET",
            credentials:
              "include",
            cache:
              "no-store",
          }
        );

      const result =
        (await response.json()) as
          Partial<AnalyticsResponse>;

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        router.refresh();

        return;
      }

      if (
        response.status ===
        403
      ) {
        if (
          result.code ===
          "ACCOUNT_SUSPENDED"
        ) {
          router.replace(
            "/login"
          );

          router.refresh();

          return;
        }

        router.replace(
          "/account"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load analytics."
        );
      }

      setData(
        result as AnalyticsResponse
      );
    } catch (loadError) {
      console.error(
        "ADMIN_ANALYTICS_UI_ERROR:",
        loadError
      );

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
    loadAnalytics(
      "",
      ""
    );
  }, []);

  function applyPreset(
    days: number
  ) {
    const end =
      new Date();

    const start =
      new Date();

    start.setDate(
      end.getDate() -
        (days - 1)
    );

    const from =
      dateInputValue(
        start
      );

    const to =
      dateInputValue(
        end
      );

    setFromDate(from);
    setToDate(to);

    loadAnalytics(
      from,
      to
    );
  }

  function clearRange() {
    setFromDate("");
    setToDate("");

    loadAnalytics(
      "",
      ""
    );
  }

  const maxRevenue =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            data
              ?.revenueByDay ||
            []
          ).map(
            (item) =>
              item.revenue
          )
        ),
      [data]
    );

  const maxProductQuantity =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            data
              ?.topProducts ||
            []
          ).map(
            (item) =>
              item.quantity
          )
        ),
      [data]
    );

  const summary =
    data?.summary ||
    emptySummary;

  const rangeLabel =
    data?.range?.from ||
    data?.range?.to
      ? `${data?.range?.from || "Beginning"} → ${
          data?.range?.to ||
          "Today"
        }`
      : "All Time";

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold"
            >
              Pak
              <span className="text-emerald-400">
                Store
              </span>
            </Link>

            <p className="mt-1 text-xs text-white/35">
              Admin Analytics
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Orders
            </Link>

            <Link
              href="/admin/customers"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Customers
            </Link>

            <Link
              href="/admin/audit-logs"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Audit Logs
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-emerald-400">
              Reports
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Analytics
            </h1>

            <p className="mt-3 max-w-3xl text-white/45">
              Track revenue, orders, customers,
              product performance and recent
              account activity.
            </p>

            <p className="mt-3 text-sm text-white/30">
              Range:{" "}
              <span className="font-medium text-white/60">
                {rangeLabel}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadAnalytics()
            }
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Analytics"}
          </button>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
              <label>
                <span className="mb-2 block text-xs font-medium text-white/40">
                  From Date
                </span>

                <input
                  type="date"
                  value={
                    fromDate
                  }
                  max={
                    toDate ||
                    undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setFromDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-medium text-white/40">
                  To Date
                </span>

                <input
                  type="date"
                  value={
                    toDate
                  }
                  min={
                    fromDate ||
                    undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setToDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  loadAnalytics()
                }
                className="self-end rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300"
              >
                Apply Range
              </button>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() =>
                  applyPreset(1)
                }
                className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(7)
                }
                className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(30)
                }
                className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Last 30 Days
              </button>

              <button
                type="button"
                onClick={
                  clearRange
                }
                className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300 transition hover:bg-red-400/10"
              >
                All Time
              </button>
            </div>
          </div>
        </section>

        {loading && !data ? (
          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-14 text-center text-white/40">
            Loading analytics...
          </div>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-5">
                <p className="text-sm text-emerald-400">
                  Performance
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Revenue & Orders
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Revenue"
                  value={formatMoney(
                    summary.totalRevenue
                  )}
                  helper="Paid order revenue"
                  emerald
                />

                <StatCard
                  label="Avg Order"
                  value={formatMoney(
                    summary.averageOrderValue
                  )}
                  helper="Average paid order value"
                />

                <StatCard
                  label="Total Orders"
                  value={String(
                    summary.totalOrders
                  )}
                  helper="Orders in selected range"
                />

                <StatCard
                  label="Paid"
                  value={String(
                    summary.paidOrders
                  )}
                  helper="Payment confirmed"
                  emerald
                />

                <StatCard
                  label="Pending"
                  value={String(
                    summary.pendingOrders
                  )}
                  helper="Waiting for payment"
                />

                <StatCard
                  label="Cancelled"
                  value={String(
                    summary.cancelledOrders
                  )}
                  helper="Cancelled orders"
                  danger
                />
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="text-sm text-emerald-400">
                  Accounts
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Platform Health
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Products"
                  value={String(
                    summary.totalProducts
                  )}
                  helper="Marketplace products"
                />

                <StatCard
                  label="Accounts"
                  value={String(
                    summary.totalAccounts
                  )}
                  helper="All profiles"
                />

                <StatCard
                  label="Active"
                  value={String(
                    summary.activeAccounts
                  )}
                  helper="Accounts with access"
                  emerald
                />

                <StatCard
                  label="Suspended"
                  value={String(
                    summary.suspendedAccounts
                  )}
                  helper="Access blocked"
                  danger
                />

                <StatCard
                  label="Admins"
                  value={String(
                    summary.adminAccounts
                  )}
                  helper="Administrator accounts"
                />

                <StatCard
                  label="Customers"
                  value={String(
                    summary.customerAccounts
                  )}
                  helper="Customer accounts"
                />
              </div>
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <div>
                  <p className="text-sm text-emerald-400">
                    Revenue
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Revenue by Day
                  </h2>
                </div>

                {data?.revenueByDay
                  ?.length ? (
                  <div className="mt-7 space-y-5">
                    {data.revenueByDay.map(
                      (point) => (
                        <div
                          key={
                            point.date
                          }
                        >
                          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                            <span className="text-white/55">
                              {formatShortDate(
                                point.date
                              )}
                            </span>

                            <div className="text-right">
                              <span className="font-semibold">
                                {formatMoney(
                                  point.revenue
                                )}
                              </span>

                              <span className="ml-2 text-xs text-white/30">
                                {
                                  point.orders
                                }{" "}
                                order
                                {point.orders ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            </div>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.max(
                                  4,
                                  (point.revenue /
                                    maxRevenue) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState
                    text="No paid revenue found for this range."
                  />
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <div>
                  <p className="text-sm text-emerald-400">
                    Orders
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Status Breakdown
                  </h2>
                </div>

                <div className="mt-7 space-y-4">
                  {(data
                    ?.orderStatusBreakdown ||
                    []
                  ).map(
                    (item) => (
                      <div
                        key={
                          item.status
                        }
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4"
                      >
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                            item.status
                          )}`}
                        >
                          {
                            item.status
                          }
                        </span>

                        <span className="text-2xl font-bold">
                          {
                            item.count
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Products
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Top Selling Products
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Ranked by paid quantity sold.
                </p>
              </div>

              {data?.topProducts
                ?.length ? (
                <div className="divide-y divide-white/10">
                  {data.topProducts.map(
                    (
                      product,
                      index
                    ) => (
                      <div
                        key={`${product.title}-${index}`}
                        className="p-6 md:px-8"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-white/25">
                              #{index + 1}
                            </p>

                            <h3 className="mt-1 truncate font-semibold">
                              {
                                product.title
                              }
                            </h3>
                          </div>

                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-white/30">
                                Sold
                              </p>

                              <p className="mt-1 font-bold">
                                {
                                  product.quantity
                                }
                              </p>
                            </div>

                            <div>
                              <p className="text-white/30">
                                Revenue
                              </p>

                              <p className="mt-1 font-bold text-emerald-300">
                                {formatMoney(
                                  product.revenue
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${Math.max(
                                4,
                                (product.quantity /
                                  maxProductQuantity) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  text="No paid product sales found for this range."
                />
              )}
            </section>

            <section className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <p className="text-sm text-emerald-400">
                    Accounts
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Recent Signups
                  </h2>
                </div>

                <Link
                  href="/admin/customers"
                  className="text-sm text-white/50 transition hover:text-emerald-300"
                >
                  Manage Customers →
                </Link>
              </div>

              {data?.recentSignups
                ?.length ? (
                <div className="divide-y divide-white/10">
                  {data.recentSignups.map(
                    (user) => (
                      <div
                        key={
                          user.id
                        }
                        className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:px-8"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {
                                user.name
                              }
                            </p>

                            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
                              {
                                user.role
                              }
                            </span>

                            <span
                              className={
                                user.isActive
                                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300"
                                  : "rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-semibold text-red-300"
                              }
                            >
                              {user.isActive
                                ? "ACTIVE"
                                : "SUSPENDED"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-white/40">
                            {
                              user.email
                            }
                          </p>

                          <p className="mt-2 text-xs text-white/25">
                            Joined{" "}
                            {formatDate(
                              user.createdAt
                            )}
                          </p>
                        </div>

                        <Link
                          href={`/admin/customers/${user.id}`}
                          className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                        >
                          View Customer
                        </Link>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  text="No account signups found."
                />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  helper,
  emerald = false,
  danger = false,
}: {
  label: string;
  value: string;
  helper: string;
  emerald?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-white/40">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          danger
            ? "text-red-300"
            : emerald
              ? "text-emerald-400"
              : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-white/30">
        {helper}
      </p>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-10 text-center text-sm text-white/35">
      {text}
    </div>
  );
}
