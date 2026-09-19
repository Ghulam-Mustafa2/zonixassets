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
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: string) {
  const normalized = status?.toUpperCase() || "";

  if (normalized === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (normalized === "REFUNDED") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = (await response.json()) as
        | DashboardData
        | DashboardErrorResponse;

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (response.status === 403) {
        if ("code" in result && result.code === "ACCOUNT_SUSPENDED") {
          router.replace("/login");
          router.refresh();
          return;
        }

        setError(
          ("error" in result && result.error) ||
            "You do not have permission to access this page."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          ("error" in result && result.error) ||
            "Unable to load admin dashboard."
        );
      }

      setData(result as DashboardData);
    } catch (dashboardError) {
      console.error("ADMIN_DASHBOARD_UI_ERROR:", dashboardError);
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
      console.error("ADMIN_LOGOUT_ERROR:", logoutError);
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
      <main className="min-h-screen bg-[#eef3f8] text-[#081426]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200 border-t-orange-500" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#eef3f8] px-6 py-20 text-[#081426]">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-red-500">
            Admin access error
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Unable to load dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || "Admin dashboard could not be loaded."}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={loadDashboard}
              className="rounded-2xl bg-[#ff6500] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#e95d00]"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const adminName =
    `${data.admin.firstName || ""} ${data.admin.lastName || ""}`.trim() ||
    "Admin";

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081426]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10182d] text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#0b1527] shadow-sm"
            >
              ZA
            </Link>
            <div>
              <Link href="/admin" className="text-xl font-black tracking-tight">
                Zonix<span className="text-cyan-400">Assets</span>
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                Admin Control Center
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/products">Products</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers">Customers</AdminNav>
            <AdminNav href="/admin/analytics">Analytics</AdminNav>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              View Store
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              {loggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#071426] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:66px_66px]" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1600px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Admin Dashboard
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.045em] sm:text-5xl lg:text-6xl xl:text-7xl">
              Welcome, {adminName}.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/55 md:text-lg">
              Manage products, orders, customers, analytics, security and website content from one focused workspace.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-violet-300/15 bg-violet-400/10 px-3 py-1.5 text-xs font-extrabold text-violet-200">
                ADMIN
              </span>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-extrabold text-emerald-300">
                ACTIVE
              </span>
              <span className="text-sm text-white/45">{data.admin.email}</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={loadDashboard}
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(255,101,0,.22)] transition hover:-translate-y-0.5 hover:bg-[#ec5e00]"
              >
                Refresh Data
              </button>
              <Link
                href="/products"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Browse Products
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-300">
                Store snapshot
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-black">{formatMoney(data.stats.totalRevenue)}</p>
                  <p className="mt-1 text-sm text-white/45">Paid order revenue</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                  <p className="text-2xl font-black">{data.stats.paidOrders}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Paid orders</p>
                </div>
              </div>
            </div>
            <MiniHeroStat label="Products" value={data.stats.totalProducts} />
            <MiniHeroStat label="Customers" value={data.stats.customerAccounts} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-8 md:py-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Products" value={String(data.stats.totalProducts)} description="Store products" accent="orange" />
          <StatCard label="Total Orders" value={String(data.stats.totalOrders)} description="All customer orders" accent="navy" />
          <StatCard label="Paid Orders" value={String(data.stats.paidOrders)} description="Payment confirmed" accent="emerald" />
          <StatCard label="Pending Orders" value={String(data.stats.pendingOrders)} description="Waiting for payment" accent="amber" />
          <StatCard label="Revenue" value={formatMoney(data.stats.totalRevenue)} description="Paid order revenue" accent="orange" />
        </section>

        <section className="mt-10">
          <SectionHeading
            eyebrow="Accounts"
            title="Account health"
            description="Review customer access, administrators and suspended accounts."
            actionHref="/admin/customers"
            actionLabel="Manage Customers"
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total Accounts" value={String(data.stats.totalAccounts)} description="All registered profiles" accent="navy" compact />
            <StatCard label="Active Accounts" value={String(data.stats.activeAccounts)} description="Accounts with access" accent="emerald" compact />
            <StatCard label="Suspended" value={String(data.stats.suspendedAccounts)} description="Access blocked" accent="red" compact />
            <StatCard label="Admins" value={String(data.stats.adminAccounts)} description="Administrator accounts" accent="violet" compact />
            <StatCard label="Customers" value={String(data.stats.customerAccounts)} description="Customer accounts" accent="cyan" compact />
          </div>
        </section>

        <section className="mt-10">
          <SectionHeading
            eyebrow="Management"
            title="Quick actions"
            description="Jump directly into the tools you use most."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ActionCard href="/admin/site-settings" eyebrow="CMS" title="Site Settings" description="Manage branding, homepage content, social links and promotions." icon="01" />
            <ActionCard href="/admin/content-pages" eyebrow="Content" title="Content Pages" description="Edit About, Contact, Privacy, Terms, Support and Refund Policy content." icon="02" />
            <ActionCard href="/admin/products" eyebrow="Products" title="Manage Products" description="Add, edit and manage digital products, images and downloadable files." icon="03" highlighted />
            <ActionCard href="/admin/orders" eyebrow="Orders" title="Manage Orders" description="Review purchases, payment states and order details." icon="04" />
            <ActionCard href="/admin/customers" eyebrow="Customers" title="Customer Accounts" description="Review account status, roles, purchases and access." icon="05" />
            <ActionCard href="/admin/audit-logs" eyebrow="Security" title="Audit Logs" description="Review account suspensions, activations and role changes." icon="06" />
            <ActionCard href="/admin/analytics" eyebrow="Reports" title="Analytics" description="Track revenue, top products, account health and activity." icon="07" />
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-500">Orders</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Recent orders</h2>
              <p className="mt-2 text-sm text-slate-500">Latest store activity at a glance.</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-extrabold text-[#0b1527] transition hover:text-orange-600">
              View All Orders →
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="px-6 py-16 text-center md:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-xl text-orange-500">✦</div>
              <h3 className="mt-4 text-lg font-black">No orders yet</h3>
              <p className="mt-2 text-sm text-slate-500">Customer orders will appear here once purchases are created.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-5 px-6 py-5 transition hover:bg-slate-50/70 md:grid-cols-[1fr_auto] md:items-center md:px-8"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-black text-[#0b1527]">{order.orderNumber}</p>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${statusClasses(order.status)}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-medium text-slate-600">{order.firstProductTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <div className="text-left md:text-right">
                      <p className="text-xl font-black text-[#0b1527]">{formatMoney(order.total)}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Order total</p>
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-[#0b1527] transition hover:border-orange-200 hover:text-orange-600"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminNav({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

function MiniHeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-500">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="w-fit text-sm font-extrabold text-[#0b1527] transition hover:text-orange-600">
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  accent,
  compact = false,
}: {
  label: string;
  value: string;
  description: string;
  accent: "orange" | "navy" | "emerald" | "amber" | "red" | "violet" | "cyan";
  compact?: boolean;
}) {
  const accentMap = {
    orange: "bg-orange-50 text-orange-500",
    navy: "bg-slate-100 text-[#0b1527]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
  } as const;

  return (
    <div className={`rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,.045)] ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className={`${compact ? "mt-3 text-3xl" : "mt-4 text-4xl"} font-black tracking-tight text-[#081426]`}>{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">{description}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${accentMap[accent]}`}>✦</span>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  eyebrow,
  title,
  description,
  icon,
  highlighted = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,.09)] ${
        highlighted ? "border-orange-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">{eyebrow}</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-[#081426]">{title}</h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ${highlighted ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-extrabold text-[#081426] transition group-hover:text-orange-600">Open</span>
        <span className="transition group-hover:translate-x-1 group-hover:text-orange-600">→</span>
      </div>
    </Link>
  );
}
