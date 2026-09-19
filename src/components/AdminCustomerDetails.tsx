
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CustomerOrderItem = {
  id: string;
  productId: string | null;
  title: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: string | null;
  itemCount: number;
  items: CustomerOrderItem[];
};

type CustomerStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type CustomerDetails = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
  stats: CustomerStats;
  orders: CustomerOrder[];
};

type ApiResponse = {
  success: boolean;
  customer: CustomerDetails;
  error?: string;
};

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

function getStatusClasses(status: string) {
  const value =
    String(status || "").toUpperCase();

  if (value === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (value === "PENDING") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (
    value === "CANCELLED" ||
    value === "CANCELED"
  ) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
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

export default function AdminCustomerDetails() {
  const router = useRouter();
  const params = useParams();

  const customerId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [customer, setCustomer] =
    useState<CustomerDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  async function loadCustomer() {
    if (!customerId) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(
          customerId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load customer."
        );
      }

      setCustomer(data.customer);
    } catch (loadError) {
      console.error(
        "ADMIN_CUSTOMER_DETAILS_UI_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load customer."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateActiveStatus(
    isActive: boolean
  ) {
    if (!customer) {
      return;
    }

    if (customer.isActive === isActive) {
      setSuccessMessage(
        isActive
          ? "Account is already active."
          : "Account is already suspended."
      );
      return;
    }

    const confirmed = window.confirm(
      isActive
        ? `Activate ${customer.name}'s account?`
        : `Suspend ${customer.name}'s account? They will lose access until the account is activated again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(
          customer.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            isActive,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "You do not have permission to change this account status."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update account status."
        );
      }

      setSuccessMessage(
        data?.message ||
          (isActive
            ? "Account activated successfully."
            : "Account suspended successfully.")
      );

      await loadCustomer();
    } catch (updateError) {
      console.error(
        "ADMIN_CUSTOMER_STATUS_UI_ERROR:",
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update account status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [customerId]);


  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef3f8] text-[#07152b]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-5 py-16">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07152b] text-xl font-black text-white">ZA</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#ff5f12]">Customer center</p>
            <h1 className="mt-2 text-2xl font-black">Loading account details</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Pulling the latest profile, order and access information.</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !customer) {
    return (
      <main className="min-h-screen bg-[#eef3f8] text-[#07152b]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6">
          <div className="rounded-[28px] border border-red-200 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-500">Customer unavailable</p>
            <h1 className="mt-2 text-3xl font-black">We couldn&apos;t load this account.</h1>
            <p className="mt-3 text-slate-600">{error}</p>
            <Link
              href="/admin/customers"
              className="mt-7 inline-flex rounded-2xl bg-[#07152b] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#10213d]"
            >
              ← Back to Customers
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const role = String(customer.role || "").toUpperCase();
  const isActive = customer.isActive !== false;
  const initials = `${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.trim() || customer.name?.slice(0, 2) || "ZA";

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#07152b]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10182e]/95 text-white shadow-[0_10px_35px_rgba(7,21,43,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin" className="flex shrink-0 items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#07152b] shadow-sm">ZA</span>
              <span className="min-w-0">
                <span className="block truncate text-xl font-black tracking-tight">Zonix<span className="text-cyan-400">Assets</span></span>
                <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Customer details</span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white">Dashboard</Link>
            <Link href="/admin/customers" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#07152b]">Customers</Link>
            <Link href="/admin/orders" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white">Orders</Link>
            <Link href="/admin/analytics" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white">Analytics</Link>
          </nav>

          <Link href="/products" className="shrink-0 rounded-2xl bg-[#ff6412] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(255,100,18,0.25)] transition hover:-translate-y-0.5 hover:bg-[#f25506] sm:px-5">View Store</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#07152b] text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[#ff6412]/20 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1600px] gap-8 px-5 py-10 sm:px-7 sm:py-14 lg:grid-cols-[1.25fr_.75fr] lg:px-10 lg:py-16">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              <Link href="/admin/customers" className="transition hover:text-white">Customers</Link>
              <span className="text-white/25">/</span>
              <span>Account profile</span>
            </div>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white text-2xl font-black uppercase text-[#07152b] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">{initials}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="break-words text-4xl font-black tracking-tight sm:text-5xl">{customer.name}</h1>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getRoleClasses(customer.role)}`}>{customer.role}</span>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${isActive ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-300" : "border-red-300/30 bg-red-400/10 text-red-300"}`}>{isActive ? "ACTIVE" : "SUSPENDED"}</span>
                </div>
                <p className="mt-3 break-all text-base text-white/60 sm:text-lg">{customer.email || "No email address"}</p>
                <p className="mt-2 text-sm text-white/35">Joined {formatDate(customer.createdAt)}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={loadCustomer} disabled={loading} className="rounded-2xl bg-[#ff6412] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(255,100,18,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f25506] disabled:cursor-not-allowed disabled:opacity-50">Refresh Customer</button>
              <Link href="/admin/customers" className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">← Back to Customers</Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:self-end">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:col-span-2">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">Account ID</p>
              <p className="mt-2 break-all text-sm font-semibold text-white/70">{customer.id}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">Last order</p>
              <p className="mt-2 text-lg font-black">{formatDate(customer.stats.lastOrderAt)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">Customer value</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(customer.stats.totalSpent)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {successMessage && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">✓ {successMessage}</div>}
        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 shadow-sm">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total orders" value={String(customer.stats.totalOrders)} note="All customer orders" tone="orange" />
          <StatCard label="Paid orders" value={String(customer.stats.paidOrders)} note="Payment confirmed" tone="emerald" />
          <StatCard label="Pending" value={String(customer.stats.pendingOrders)} note="Awaiting payment" tone="amber" />
          <StatCard label="Cancelled" value={String(customer.stats.cancelledOrders)} note="Closed orders" tone="red" />
          <StatCard label="Total spent" value={formatMoney(customer.stats.totalSpent)} note="Paid order revenue" tone="navy" />
        </section>

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-7">
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff5f12]">Account profile</p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">Customer information</h2>
                </div>
                <span className="text-sm font-semibold text-slate-400">Verified store customer record</span>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
                <InfoCard label="First name" value={customer.firstName || "—"} />
                <InfoCard label="Last name" value={customer.lastName || "—"} />
                <InfoCard label="Email address" value={customer.email || "—"} />
                <InfoCard label="Account role" value={customer.role} />
                <InfoCard label="Account status" value={isActive ? "ACTIVE" : "SUSPENDED"} />
                <InfoCard label="Joined" value={formatDate(customer.createdAt)} />
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff5f12]">Purchases</p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">Order history</h2>
                  <p className="mt-2 text-sm text-slate-500">{customer.orders.length} order{customer.orders.length === 1 ? "" : "s"} connected to this account.</p>
                </div>
                <Link href="/admin/orders" className="text-sm font-black text-[#ff5f12] hover:text-[#d94800]">View all orders →</Link>
              </div>

              {customer.orders.length === 0 ? (
                <div className="p-8 sm:p-10">
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl text-[#ff5f12]">✦</div>
                    <h3 className="mt-4 text-xl font-black">No orders yet</h3>
                    <p className="mt-2 text-sm text-slate-500">This customer has not placed any store orders.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customer.orders.map((order) => (
                    <article key={order.id} className="p-6 sm:p-8">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="break-all text-xl font-black">{order.orderNumber}</h3>
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusLightClasses(order.status)}`}>{order.status}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>Created {formatDate(order.createdAt)}</span>
                            <span>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</span>
                            <span>{order.paymentProvider || "No provider"}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4 lg:text-right">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order total</p>
                            <p className="mt-1 text-2xl font-black">{formatMoney(order.total)}</p>
                          </div>
                          <Link href={`/admin/orders/${order.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black transition hover:border-[#ffb27e] hover:bg-orange-50 hover:text-[#ff5f12]">View Order</Link>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <MiniInfo label="Subtotal" value={formatMoney(order.subtotal)} />
                        <MiniInfo label="Service fee" value={formatMoney(order.serviceFee)} />
                        <MiniInfo label="Provider" value={order.paymentProvider || "—"} />
                        <MiniInfo label="Payment ref" value={order.paymentReference || "—"} />
                      </div>

                      {order.items.length > 0 && (
                        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/70">
                          <div className="border-b border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Purchased products</div>
                          <div className="divide-y divide-slate-200">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-black text-[#07152b]">{item.title}</p>
                                  <p className="mt-1 text-xs text-slate-500">Qty {item.quantity} · Unit {formatMoney(item.price)}</p>
                                </div>
                                <p className="font-black text-[#07152b]">{formatMoney(item.lineTotal)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-7 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[30px] bg-[#07152b] p-6 text-white shadow-[0_18px_55px_rgba(7,21,43,0.18)] sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Permissions</p>
              <h2 className="mt-2 text-2xl font-black">Single-owner store</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                ZonixAssets is operated by one owner administrator. Customer accounts cannot be promoted to administrator access.
              </p>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">Account role</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xl font-black">{role}</p>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    Locked
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                <p className="text-sm font-black text-emerald-200">Owner-only administration</p>
                <p className="mt-2 text-xs leading-5 text-emerald-100/70">
                  Admin access is controlled by the configured owner account. This customer profile only retains customer-level access.
                </p>
              </div>
            </section>

            <section className={`rounded-[30px] border p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7 ${isActive ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <p className={`text-xs font-black uppercase tracking-[0.22em] ${isActive ? "text-emerald-600" : "text-red-600"}`}>Account access</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">{isActive ? "Active account" : "Suspended account"}</h2>
                <span className={`h-3 w-3 shrink-0 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{isActive ? "This account can currently sign in and access eligible purchases." : "Access is blocked until the store owner restores this account."}</p>

              <div className="mt-6 grid gap-3">
                {isActive ? (
                  <button type="button" onClick={() => updateActiveStatus(false)} disabled={updatingStatus} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">{updatingStatus ? "Suspending..." : "Suspend Account"}</button>
                ) : (
                  <button type="button" onClick={() => updateActiveStatus(true)} disabled={updatingStatus} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{updatingStatus ? "Activating..." : "Activate Account"}</button>
                )}
                <button type="button" onClick={loadCustomer} disabled={loading || updatingStatus} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07152b] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Refresh Status</button>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff5f12]">Admin shortcuts</p>
              <h2 className="mt-2 text-2xl font-black">Quick actions</h2>
              <div className="mt-5 grid gap-3">
                <Link href="/admin/customers" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-[#ffb27e] hover:bg-orange-50 hover:text-[#ff5f12]"><span>All Customers</span><span>→</span></Link>
                <Link href="/admin/orders" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-[#ffb27e] hover:bg-orange-50 hover:text-[#ff5f12]"><span>All Orders</span><span>→</span></Link>
                <Link href="/admin/audit-logs" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-[#ffb27e] hover:bg-orange-50 hover:text-[#ff5f12]"><span>Audit Logs</span><span>→</span></Link>
                <Link href="/admin" className="flex items-center justify-between rounded-2xl bg-[#07152b] px-4 py-3 text-sm font-black text-white transition hover:bg-[#10213d]"><span>Admin Dashboard</span><span>→</span></Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function getStatusLightClasses(status: string) {
  const value = String(status || "").toUpperCase();
  if (value === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "CANCELLED" || value === "CANCELED") return "border-red-200 bg-red-50 text-red-700";
  if (value === "REFUNDED") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatCard({
  label,
  value,
  note,
  tone = "navy",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "orange" | "emerald" | "amber" | "red" | "navy";
}) {
  const toneStyles = {
    orange: "bg-orange-50 text-[#ff5f12]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    navy: "bg-slate-100 text-[#07152b]",
  }[tone];

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${toneStyles}`}>✦</div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#07152b]">{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">{note}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-all text-sm font-black text-[#07152b] sm:text-base">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 break-all text-sm font-bold text-[#07152b]">{value}</p>
    </div>
  );
}
