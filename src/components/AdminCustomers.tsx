"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type Customer = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
  stats: CustomerStats;
};

type ApiStats = {
  totalAccounts: number;
  customers: number;
  admins: number;
  activeAccounts: number;
  suspendedAccounts: number;
  totalOrders: number;
  totalRevenue: number;
};

type CustomersResponse = {
  success: boolean;
  stats: ApiStats;
  customers: Customer[];
};

type FilterType =
  | "ALL"
  | "CUSTOMER"
  | "ADMIN"
  | "ACTIVE"
  | "SUSPENDED";

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "ZA";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getRoleClasses(role: string) {
  return String(role || "").toUpperCase() === "ADMIN"
    ? "border-violet-200 bg-violet-50 text-violet-700"
    : "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function getStatusClasses(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
}

export default function AdminCustomers() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<ApiStats>({
    totalAccounts: 0,
    customers: 0,
    admins: 0,
    activeAccounts: 0,
    suspendedAccounts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/customers", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data =
        (await response.json()) as Partial<CustomersResponse> & {
          error?: string;
          code?: string;
        };

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        if (data?.error && data.code === "ACCOUNT_SUSPENDED") {
          router.replace("/login");
          router.refresh();
          return;
        }

        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load customers.");
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (loadError) {
      console.error("ADMIN_CUSTOMERS_UI_ERROR:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const role = String(customer.role || "").toUpperCase();
      const isActive = customer.isActive !== false;

      if (filter === "CUSTOMER" && role !== "CUSTOMER") return false;
      if (filter === "ADMIN" && role !== "ADMIN") return false;
      if (filter === "ACTIVE" && !isActive) return false;
      if (filter === "SUSPENDED" && isActive) return false;

      if (!query) return true;

      const searchable = [
        customer.name,
        customer.email || "",
        customer.id,
        customer.role,
        isActive ? "active" : "suspended",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [customers, filter, search]);

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111a31]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 md:px-10">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-[#081529] shadow-sm">
              ZA
            </div>
            <div className="min-w-0">
              <div className="truncate text-2xl font-black tracking-tight">
                Zonix<span className="text-cyan-400">Assets</span>
              </div>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                Admin Customers
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 xl:flex">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/products">Products</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers" active>
              Customers
            </AdminNav>
            <AdminNav href="/admin/analytics">Analytics</AdminNav>
            <AdminNav href="/admin/audit-logs">Audit Logs</AdminNav>
          </nav>

          <Link
            href="/products"
            className="shrink-0 rounded-2xl bg-[#ff6500] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,101,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff7420]"
          >
            View Store
          </Link>
        </div>
      </header>

      <section
        className="relative overflow-hidden border-b border-white/5 bg-[#071426] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 2% 95%, rgba(0,190,220,.18), transparent 30%), radial-gradient(circle at 92% 18%, rgba(255,101,0,.18), transparent 28%)",
          backgroundSize: "64px 64px, 64px 64px, auto, auto",
        }}
      >
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
              Customer Center
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.97] tracking-[-0.04em] sm:text-6xl xl:text-7xl">
              Manage every account{" "}
              <span className="text-white/45">from one clear view.</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
              Search customers, review account access, inspect purchase activity
              and open detailed account controls without losing context.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadCustomers}
                disabled={loading}
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 font-black text-white shadow-[0_12px_32px_rgba(255,101,0,.22)] transition hover:bg-[#ff7420] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh Customers"}
              </button>

              <Link
                href="/admin/analytics"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 font-black text-white transition hover:bg-white/10"
              >
                View Analytics
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric
              label="Total accounts"
              value={String(stats.totalAccounts)}
              helper={`${stats.activeAccounts} currently active`}
            />
            <HeroMetric
              label="Customer accounts"
              value={String(stats.customers)}
              helper={`${stats.admins} administrator accounts`}
            />
            <HeroMetric
              label="Orders"
              value={String(stats.totalOrders)}
              helper="Across all customer accounts"
            />
            <HeroMetric
              label="Paid revenue"
              value={formatMoney(stats.totalRevenue)}
              helper="Confirmed store revenue"
              accent
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-12">
        {error && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section>
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff6500]">
              Account health
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Customer overview
            </h2>
            <p className="mt-2 text-[#60718e]">
              A quick snapshot of access, roles and store activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard
              label="Accounts"
              value={String(stats.totalAccounts)}
              helper="All profiles"
              tone="navy"
            />
            <StatCard
              label="Customers"
              value={String(stats.customers)}
              helper="Customer accounts"
              tone="cyan"
            />
            <StatCard
              label="Admins"
              value={String(stats.admins)}
              helper="Admin accounts"
              tone="violet"
            />
            <StatCard
              label="Active"
              value={String(stats.activeAccounts)}
              helper="Access enabled"
              tone="emerald"
            />
            <StatCard
              label="Suspended"
              value={String(stats.suspendedAccounts)}
              helper="Access blocked"
              tone="red"
            />
            <StatCard
              label="Orders"
              value={String(stats.totalOrders)}
              helper="All orders"
              tone="amber"
            />
            <StatCard
              label="Revenue"
              value={formatMoney(stats.totalRevenue)}
              helper="Paid revenue"
              tone="orange"
            />
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.07)]">
          <div className="grid gap-6 border-b border-[#e7edf4] p-6 lg:grid-cols-[1fr_auto] lg:items-end md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff6500]">
                Filters
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Find an account
              </h2>
              <p className="mt-2 text-[#60718e]">
                Search by customer name, email, role, account status or ID.
              </p>
            </div>

            <div className="w-full lg:w-[460px]">
              <label className="mb-2 block text-sm font-bold text-[#53627a]">
                Search
              </label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, email, role, ID..."
                  className="w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-5 py-4 pr-12 text-[#081529] outline-none transition placeholder:text-[#a7b3c6] focus:border-[#ff6500]/50 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-lg text-[#7b899f] transition hover:bg-[#eef2f7] hover:text-[#081529]"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-[#e7edf4] px-6 py-5 md:px-8">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterButton
                active={filter === "ALL"}
                onClick={() => setFilter("ALL")}
              >
                All Accounts
              </FilterButton>
              <FilterButton
                active={filter === "CUSTOMER"}
                onClick={() => setFilter("CUSTOMER")}
              >
                Customers
              </FilterButton>
              <FilterButton
                active={filter === "ADMIN"}
                onClick={() => setFilter("ADMIN")}
              >
                Admins
              </FilterButton>
              <FilterButton
                active={filter === "ACTIVE"}
                onClick={() => setFilter("ACTIVE")}
              >
                Active
              </FilterButton>
              <FilterButton
                active={filter === "SUSPENDED"}
                onClick={() => setFilter("SUSPENDED")}
              >
                Suspended
              </FilterButton>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-b border-[#e7edf4] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9aa8bb]">
                Accounts
              </p>
              <h3 className="mt-1 text-xl font-black text-[#081529]">
                Customer directory
              </h3>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f1f5f9] px-4 py-2 text-sm font-bold text-[#60718e]">
              {filteredCustomers.length} result
              {filteredCustomers.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-[300px] place-items-center p-10">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e7edf4] border-t-[#ff6500]" />
                <p className="mt-4 font-semibold text-[#7b899f]">
                  Loading customer accounts...
                </p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="grid min-h-[320px] place-items-center p-10 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-2xl text-[#ff6500]">
                  ✦
                </div>
                <h3 className="mt-5 text-xl font-black">No matching accounts</h3>
                <p className="mt-2 text-[#7b899f]">
                  Try another search or switch to a different account filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e7edf4]">
              {filteredCustomers.map((customer) => {
                const isActive = customer.isActive !== false;

                return (
                  <article
                    key={customer.id}
                    className="group p-6 transition hover:bg-[#fbfcfe] md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_auto] xl:items-center">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#081529] text-sm font-black text-white shadow-sm">
                          {initials(customer.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-xl font-black tracking-tight text-[#081529]">
                              {customer.name}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getRoleClasses(
                                customer.role
                              )}`}
                            >
                              {String(customer.role || "CUSTOMER").toUpperCase()}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getStatusClasses(
                                isActive
                              )}`}
                            >
                              {isActive ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </div>

                          <p className="mt-2 break-all text-sm font-medium text-[#60718e]">
                            {customer.email || "No email address"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9aa8bb]">
                            <span>Joined {formatDate(customer.createdAt)}</span>
                            <span className="break-all">ID: {customer.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniStat
                          label="Orders"
                          value={String(customer.stats.totalOrders)}
                        />
                        <MiniStat
                          label="Paid"
                          value={String(customer.stats.paidOrders)}
                        />
                        <MiniStat
                          label="Pending"
                          value={String(customer.stats.pendingOrders)}
                        />
                        <MiniStat
                          label="Spent"
                          value={formatMoney(customer.stats.totalSpent)}
                          accent
                        />
                      </div>

                      <div className="flex xl:justify-end">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#081529] px-5 py-3.5 text-sm font-black text-white transition group-hover:bg-[#ff6500] xl:w-auto"
                        >
                          View Customer
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoStrip
                        label="Cancelled orders"
                        value={String(customer.stats.cancelledOrders)}
                      />
                      <InfoStrip
                        label="Last order"
                        value={formatDate(customer.stats.lastOrderAt)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 overflow-hidden rounded-[30px] bg-[#071426] text-white shadow-[0_20px_60px_rgba(20,35,60,.12)]">
          <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Admin center
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Need deeper account insight?
              </h2>
              <p className="mt-3 max-w-2xl text-white/55">
                Review role and access changes in Audit Logs, or open Analytics
                for store-wide customer performance.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/audit-logs"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-center font-black transition hover:bg-white/10"
              >
                Audit Logs
              </Link>
              <Link
                href="/admin/analytics"
                className="rounded-2xl bg-[#ff6500] px-5 py-3.5 text-center font-black text-white transition hover:bg-[#ff7420]"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminNav({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-2.5 text-sm font-black text-orange-300"
          : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
      }
    >
      {children}
    </Link>
  );
}

function HeroMetric({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-black tracking-tight ${
          accent ? "text-[#ff7a22]" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/45">{helper}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone:
    | "navy"
    | "cyan"
    | "violet"
    | "emerald"
    | "red"
    | "amber"
    | "orange";
}) {
  const toneClasses: Record<string, string> = {
    navy: "bg-slate-100 text-slate-900",
    cyan: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    orange: "bg-orange-50 text-[#ff6500]",
  };

  return (
    <div className="rounded-[26px] border border-[#dce4ef] bg-white p-5 shadow-[0_14px_34px_rgba(20,35,60,.05)]">
      <div
        className={`grid h-11 w-11 place-items-center rounded-2xl text-lg font-black ${toneClasses[tone]}`}
      >
        ✦
      </div>
      <p className="mt-5 text-sm font-bold text-[#60718e]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#081529]">
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-[#9aa8bb]">{helper}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e3eaf2] bg-[#f7f9fc] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9aa8bb]">
        {label}
      </p>
      <p
        className={`mt-2 text-lg font-black ${
          accent ? "text-[#ff6500]" : "text-[#081529]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3eaf2] bg-white px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9aa8bb]">
        {label}
      </span>
      <span className="text-right text-sm font-black text-[#53627a]">
        {value}
      </span>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-2xl bg-[#081529] px-5 py-3 text-sm font-black text-white shadow-sm"
          : "shrink-0 rounded-2xl border border-[#dce4ef] bg-[#f8fafc] px-5 py-3 text-sm font-bold text-[#60718e] transition hover:border-[#cdd7e4] hover:bg-white hover:text-[#081529]"
      }
    >
      {children}
    </button>
  );
}
