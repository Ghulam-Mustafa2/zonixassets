"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive?: boolean;
};

type AdminStats = {
  totalProducts: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalAccounts: number;
  activeAccounts: number;
  suspendedAccounts: number;
  adminAccounts: number;
  customerAccounts: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
  firstProductTitle: string;
};

type DashboardData = {
  success: boolean;
  admin: AdminUser;
  stats: AdminStats;
  recentOrders: RecentOrder[];
};

type DashboardErrorResponse = {
  error?: string;
  code?: string;
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
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

function getStatusClasses(status: string) {
  const normalized =
    status?.toUpperCase() || "";

  if (normalized === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "PENDING") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (normalized === "CANCELLED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (normalized === "REFUNDED") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default function AdminDashboard() {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/dashboard",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as
          | DashboardData
          | DashboardErrorResponse;

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (response.status === 403) {
        if (
          "code" in result &&
          result.code ===
            "ACCOUNT_SUSPENDED"
        ) {
          router.replace("/login");
          router.refresh();
          return;
        }

        setError(
          ("error" in result &&
            result.error) ||
            "You do not have permission to access this page."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          ("error" in result &&
            result.error) ||
            "Unable to load admin dashboard."
        );
      }

      setData(result as DashboardData);
    } catch (dashboardError) {
      console.error(
        "ADMIN_DASHBOARD_UI_ERROR:",
        dashboardError
      );

      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (logoutError) {
      console.error(
        "ADMIN_LOGOUT_ERROR:",
        logoutError
      );
    } finally {
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />

            <p className="mt-4 text-sm text-white/40">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <p className="text-sm font-medium text-red-300">
            Admin Access Error
          </p>

          <h1 className="mt-3 text-2xl font-bold">
            Unable to load dashboard
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            {error ||
              "Admin dashboard could not be loaded."}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={loadDashboard}
              className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Try Again
            </button>

            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const adminName =
    `${data.admin.firstName || ""} ${
      data.admin.lastName || ""
    }`.trim() ||
    "Admin";

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
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

            <p className="mt-1 text-xs text-white/30">
              Admin Control Panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 sm:inline-flex"
            >
              View Store
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              {loggingOut
                ? "Signing Out..."
                : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-medium text-emerald-400">
            Admin Dashboard
          </p>

          <div className="mt-2 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Welcome, {adminName}
              </h1>

              <p className="mt-3 max-w-2xl text-white/45">
                Manage products, orders, customers, analytics,
                security and website content from one place.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-300">
                  ADMIN
                </span>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  ACTIVE
                </span>

                <span className="text-sm text-white/35">
                  {data.admin.email}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Browse Products
              </Link>

              <button
                onClick={loadDashboard}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* STATS */}

        <section>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total Products"
              value={String(
                data.stats.totalProducts
              )}
              description="Marketplace products"
            />

            <StatCard
              label="Total Orders"
              value={String(
                data.stats.totalOrders
              )}
              description="All customer orders"
            />

            <StatCard
              label="Paid Orders"
              value={String(
                data.stats.paidOrders
              )}
              description="Payment confirmed"
              emerald
            />

            <StatCard
              label="Pending Orders"
              value={String(
                data.stats.pendingOrders
              )}
              description="Waiting for payment"
            />

            <StatCard
              label="Revenue"
              value={formatMoney(
                data.stats.totalRevenue
              )}
              description="Paid order revenue"
              emerald
            />
          </div>
        </section>

        {/* ACCOUNT HEALTH */}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-emerald-400">
                Accounts
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Account Health
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Review customer access, administrators
                and suspended accounts.
              </p>
            </div>

            <Link
              href="/admin/customers"
              className="w-fit text-sm text-white/50 transition hover:text-emerald-300"
            >
              Manage Customers →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Total Accounts"
              value={String(
                data.stats.totalAccounts
              )}
              description="All registered profiles"
            />

            <StatCard
              label="Active Accounts"
              value={String(
                data.stats.activeAccounts
              )}
              description="Accounts with access"
              emerald
            />

            <StatCard
              label="Suspended"
              value={String(
                data.stats.suspendedAccounts
              )}
              description="Accounts with access blocked"
              danger
            />

            <StatCard
              label="Admins"
              value={String(
                data.stats.adminAccounts
              )}
              description="Administrator accounts"
            />

            <StatCard
              label="Customers"
              value={String(
                data.stats.customerAccounts
              )}
              description="Customer accounts"
            />
          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm text-emerald-400">
              Management
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/admin/site-settings"
              className="group rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.07]"
            >
              <p className="text-sm text-emerald-400">
                CMS
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Site Settings
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Manage your website name, logo, homepage content,
                social links, offers and promotion banners.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Site Settings →
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm text-emerald-400">
                Products
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Manage Products
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Add, edit and manage digital
                products and downloadable
                files.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Products →
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm text-emerald-400">
                Orders
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Manage Orders
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Review customer purchases,
                payment states and order
                details.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Orders →
              </p>
            </Link>

            <Link
              href="/admin/customers"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm text-emerald-400">
                Customers
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Customer Accounts
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Review account status, roles,
                purchases and suspend or restore
                customer access.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Customers →
              </p>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm text-emerald-400">
                Security
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Audit Logs
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Review administrator actions,
                account suspensions, activations
                and role changes.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Audit Logs →
              </p>
            </Link>

            <Link
              href="/admin/analytics"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm text-emerald-400">
                Reports
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Analytics
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Track revenue, orders, top
                products, account health and
                recent customer activity.
              </p>

              <p className="mt-5 text-sm font-medium text-white/70 transition group-hover:text-emerald-300">
                Open Analytics →
              </p>
            </Link>
          </div>
        </section>

        {/* RECENT ORDERS */}

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-6 py-6 md:flex-row md:items-center md:px-8">
            <div>
              <p className="text-sm text-emerald-400">
                Orders
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Recent Orders
              </h2>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm text-white/50 transition hover:text-emerald-300"
            >
              View All Orders →
            </Link>
          </div>

          {data.recentOrders.length ===
          0 ? (
            <div className="px-6 py-14 text-center md:px-8">
              <h3 className="text-lg font-semibold">
                No orders yet
              </h3>

              <p className="mt-2 text-sm text-white/40">
                Customer orders will appear
                here once purchases are
                created.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.recentOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between gap-5 px-6 py-6 transition hover:bg-white/[0.02] md:flex-row md:items-center md:px-8"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">
                          {order.orderNumber}
                        </p>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {order.status?.toUpperCase()}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm text-white/65">
                        {order.firstProductTitle}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                        <span>
                          {order.itemCount} item
                          {order.itemCount === 1
                            ? ""
                            : "s"}
                        </span>

                        <span>
                          {formatDate(
                            order.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-lg font-bold">
                          {formatMoney(
                            order.total
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Order Total
                        </p>
                      </div>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
  emerald = false,
  danger = false,
}: {
  label: string;
  value: string;
  description: string;
  emerald?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
        {description}
      </p>
    </div>
  );
}