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
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRoleClasses(role: string) {
  if (
    String(role || "").toUpperCase() ===
    "ADMIN"
  ) {
    return "border-purple-400/20 bg-purple-400/10 text-purple-300";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
}

function getStatusClasses(
  isActive: boolean
) {
  return isActive
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
    : "border-red-400/20 bg-red-400/10 text-red-300";
}

export default function AdminCustomers() {
  const router = useRouter();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [stats, setStats] =
    useState<ApiStats>({
      totalAccounts: 0,
      customers: 0,
      admins: 0,
      activeAccounts: 0,
      suspendedAccounts: 0,
      totalOrders: 0,
      totalRevenue: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("ALL");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/customers",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

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
        if (
          data?.error &&
          "code" in data &&
          data.code ===
            "ACCOUNT_SUSPENDED"
        ) {
          router.replace("/login");
          router.refresh();
          return;
        }

        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load customers."
        );
      }

      setCustomers(
        Array.isArray(data.customers)
          ? data.customers
          : []
      );

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (loadError) {
      console.error(
        "ADMIN_CUSTOMERS_UI_ERROR:",
        loadError
      );

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

  const filteredCustomers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return customers.filter(
        (customer) => {
          const role =
            String(
              customer.role || ""
            ).toUpperCase();

          const isActive =
            customer.isActive !== false;

          if (
            filter === "CUSTOMER" &&
            role !== "CUSTOMER"
          ) {
            return false;
          }

          if (
            filter === "ADMIN" &&
            role !== "ADMIN"
          ) {
            return false;
          }

          if (
            filter === "ACTIVE" &&
            !isActive
          ) {
            return false;
          }

          if (
            filter === "SUSPENDED" &&
            isActive
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              customer.name,
              customer.email || "",
              customer.id,
              customer.role,
              isActive
                ? "active"
                : "suspended",
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      customers,
      filter,
      search,
    ]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

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
              Customer Management
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
              href="/admin/products"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Products
            </Link>

            <Link
              href="/products"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              View Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* PAGE TITLE */}

        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-emerald-400">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Manage Customers
            </h1>

            <p className="mt-3 text-white/45">
              Review customer accounts,
              access status, purchases, roles and spending.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Customers"}
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        {/* STATS */}

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <StatCard
            label="Total Accounts"
            value={String(
              stats.totalAccounts
            )}
            helper="All profiles"
          />

          <StatCard
            label="Customers"
            value={String(
              stats.customers
            )}
            helper="Customer accounts"
          />

          <StatCard
            label="Admins"
            value={String(
              stats.admins
            )}
            helper="Admin accounts"
          />

          <StatCard
            label="Active"
            value={String(
              stats.activeAccounts
            )}
            helper="Accounts with access"
            accent
          />

          <StatCard
            label="Suspended"
            value={String(
              stats.suspendedAccounts
            )}
            helper="Access blocked"
          />

          <StatCard
            label="Total Orders"
            value={String(
              stats.totalOrders
            )}
            helper="Across all accounts"
          />

          <StatCard
            label="Revenue"
            value={formatMoney(
              stats.totalRevenue
            )}
            helper="Paid order revenue"
            accent
          />
        </section>

        {/* FILTERS */}

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <FilterButton
                active={
                  filter === "ALL"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All Accounts
              </FilterButton>

              <FilterButton
                active={
                  filter === "CUSTOMER"
                }
                onClick={() =>
                  setFilter("CUSTOMER")
                }
              >
                Customers
              </FilterButton>

              <FilterButton
                active={
                  filter === "ADMIN"
                }
                onClick={() =>
                  setFilter("ADMIN")
                }
              >
                Admins
              </FilterButton>

              <FilterButton
                active={
                  filter === "ACTIVE"
                }
                onClick={() =>
                  setFilter("ACTIVE")
                }
              >
                Active
              </FilterButton>

              <FilterButton
                active={
                  filter === "SUSPENDED"
                }
                onClick={() =>
                  setFilter("SUSPENDED")
                }
              >
                Suspended
              </FilterButton>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, email, role, status, ID..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40 lg:max-w-md"
            />
          </div>
        </section>

        {/* CUSTOMER LIST */}

        <section className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <p className="text-sm text-emerald-400">
              Accounts
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Customer List
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Showing{" "}
              {
                filteredCustomers.length
              }{" "}
              account
              {filteredCustomers.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-white/40">
              Loading customers...
            </div>
          ) : filteredCustomers.length ===
            0 ? (
            <div className="p-10 text-center text-white/40">
              No matching customers found.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredCustomers.map(
                (customer) => (
                  <article
                    key={customer.id}
                    className="p-6 md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr_auto] xl:items-center">
                      {/* PROFILE */}

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold">
                            {customer.name}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRoleClasses(
                              customer.role
                            )}`}
                          >
                            {customer.role}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              customer.isActive !== false
                            )}`}
                          >
                            {customer.isActive !== false
                              ? "ACTIVE"
                              : "SUSPENDED"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/45">
                          {customer.email ||
                            "No email"}
                        </p>

                        <p className="mt-2 break-all text-xs text-white/25">
                          ID: {customer.id}
                        </p>

                        <p className="mt-2 text-xs text-white/30">
                          Joined:{" "}
                          {formatDate(
                            customer.createdAt
                          )}
                        </p>
                      </div>

                      {/* ACCOUNT STATS */}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniStat
                          label="Orders"
                          value={String(
                            customer.stats
                              .totalOrders
                          )}
                        />

                        <MiniStat
                          label="Paid"
                          value={String(
                            customer.stats
                              .paidOrders
                          )}
                        />

                        <MiniStat
                          label="Pending"
                          value={String(
                            customer.stats
                              .pendingOrders
                          )}
                        />

                        <MiniStat
                          label="Spent"
                          value={formatMoney(
                            customer.stats
                              .totalSpent
                          )}
                        />
                      </div>

                      {/* ACTION */}

                      <div className="flex xl:justify-end">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center font-semibold transition hover:bg-white/10 xl:w-auto"
                        >
                          View Customer
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black p-4">
                        <p className="text-xs text-white/35">
                          Cancelled Orders
                        </p>

                        <p className="mt-2 font-semibold">
                          {
                            customer.stats
                              .cancelledOrders
                          }
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black p-4">
                        <p className="text-xs text-white/35">
                          Last Order
                        </p>

                        <p className="mt-2 font-semibold">
                          {formatDate(
                            customer.stats
                              .lastOrderAt
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
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
  helper,
  accent = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/40">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          accent
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-3 text-xs text-white/25">
        {helper}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>
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
          ? "rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
          : "rounded-xl border border-white/10 bg-black px-5 py-3 font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
      }
    >
      {children}
    </button>
  );
}