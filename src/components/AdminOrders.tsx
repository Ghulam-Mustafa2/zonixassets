"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  productId: string | null;
  title: string;
  price: number;
  quantity: number;
};

type Customer = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
};

type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: string;
  customer: Customer;
  itemCount: number;
  firstProductTitle: string;
  items: OrderItem[];
};

type Stats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
};

type FilterType = "ALL" | "PAID" | "PENDING";

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "-";

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

function getStatusClasses(status: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getStatusDot(status: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PAID") return "bg-emerald-500";
  if (normalized === "PENDING") return "bg-amber-500";
  if (normalized === "CANCELLED" || normalized === "CANCELED")
    return "bg-red-500";

  return "bg-slate-400";
}

function getInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "CU";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminOrders() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState("");

  async function updateOrderStatus(
    order: Order,
    status: "PAID" | "PENDING" | "CANCELLED"
  ) {
    const label =
      status === "PAID"
        ? "approve this order and mark it as PAID"
        : status === "CANCELLED"
          ? "cancel this order"
          : "move this order back to PENDING";

    const confirmed = window.confirm(
      `Are you sure you want to ${label}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingOrderId(order.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

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
          data?.error || "Unable to update order status."
        );
      }

      setSuccessMessage(
        data?.message ||
          `Order ${order.orderNumber} updated successfully.`
      );

      await loadOrders();
    } catch (updateError) {
      console.error("ADMIN_ORDER_STATUS_UPDATE_ERROR:", updateError);

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const url =
        filter === "ALL"
          ? "/api/admin/orders"
          : `/api/admin/orders?status=${filter}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

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
          data?.error || "Unable to load admin orders."
        );
      }

      setOrders(Array.isArray(data?.orders) ? data.orders : []);

      setStats({
        totalOrders: Number(data?.stats?.totalOrders) || 0,
        paidOrders: Number(data?.stats?.paidOrders) || 0,
        pendingOrders: Number(data?.stats?.pendingOrders) || 0,
        totalRevenue: Number(data?.stats?.totalRevenue) || 0,
      });
    } catch (loadError) {
      console.error("ADMIN_ORDERS_UI_ERROR:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      return (
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.email?.toLowerCase().includes(query) ||
        order.firstProductTitle?.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  const cancelledOrders = useMemo(
    () =>
      orders.filter((order) => {
        const status = String(order.status || "").toUpperCase();
        return status === "CANCELLED" || status === "CANCELED";
      }).length,
    [orders]
  );

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
      <AdminHeader />

      <section
        className="relative overflow-hidden bg-[#071426] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 8% 100%, rgba(0,190,220,.15), transparent 30%), radial-gradient(circle at 92% 14%, rgba(255,101,0,.18), transparent 28%)",
          backgroundSize: "64px 64px, 64px 64px, auto, auto",
        }}
      >
        <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-10 md:py-16">
          <div className="grid gap-9 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
                Order Center
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Orders, payments and
                <span className="block text-white/45">
                  customer activity.
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-white/55 md:text-lg">
                Review store orders, payment state, customer
                information and purchased products from one clean admin view.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadOrders}
                  disabled={loading}
                  className="rounded-2xl bg-[#ff6500] px-6 py-3.5 font-black text-white shadow-[0_14px_34px_rgba(255,101,0,.22)] transition hover:bg-[#ff7420] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Refreshing..." : "Refresh Orders"}
                </button>

                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 font-black text-white transition hover:bg-white/10"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HeroMetric
                label="Total orders"
                value={String(stats.totalOrders)}
                helper="All customer orders"
              />
              <HeroMetric
                label="Paid revenue"
                value={formatMoney(stats.totalRevenue)}
                helper="Confirmed payment revenue"
                accent
              />
              <HeroMetric
                label="Paid"
                value={String(stats.paidOrders)}
                helper="Payment confirmed"
              />
              <HeroMetric
                label="Pending"
                value={String(stats.pendingOrders)}
                helper="Waiting for payment"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10 md:py-12">
        {(successMessage || error) && (
          <div className="mb-8 space-y-3">
            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total orders"
            value={String(stats.totalOrders)}
            description="Orders in current view"
            icon="✦"
            tone="orange"
          />
          <StatCard
            label="Paid orders"
            value={String(stats.paidOrders)}
            description="Payment confirmed"
            icon="✓"
            tone="green"
          />
          <StatCard
            label="Pending"
            value={String(stats.pendingOrders)}
            description="Waiting for payment"
            icon="…"
            tone="amber"
          />
          <StatCard
            label="Cancelled"
            value={String(cancelledOrders)}
            description="Cancelled orders"
            icon="×"
            tone="red"
          />
          <StatCard
            label="Revenue"
            value={formatMoney(stats.totalRevenue)}
            description="Paid order revenue"
            icon="$"
            tone="navy"
          />
        </section>

        <section className="mt-8 rounded-[30px] border border-[#dce4ef] bg-white p-6 shadow-[0_20px_60px_rgba(20,35,60,.06)] md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                Filters
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Find an order
              </h2>
              <p className="mt-2 text-[#718099]">
                Search by order number, customer, email, product or status.
              </p>
            </div>

            <div className="w-full xl:w-[480px]">
              <label
                htmlFor="order-search"
                className="mb-2 block text-sm font-black text-[#60718e]"
              >
                Search
              </label>
              <div className="relative">
                <input
                  id="order-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order, customer, email..."
                  className="w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-5 py-4 pr-12 text-[#081529] outline-none transition placeholder:text-[#b0bccb] focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa8bb]">
                  ⌕
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterButton
              active={filter === "ALL"}
              onClick={() => setFilter("ALL")}
            >
              All Orders
            </FilterButton>

            <FilterButton
              active={filter === "PAID"}
              onClick={() => setFilter("PAID")}
            >
              Paid
            </FilterButton>

            <FilterButton
              active={filter === "PENDING"}
              onClick={() => setFilter("PENDING")}
            >
              Pending
            </FilterButton>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <div className="flex flex-col gap-4 border-b border-[#e7edf4] p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                Orders
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Order list
              </h2>
              <p className="mt-2 text-[#718099]">
                Showing {filteredOrders.length} order
                {filteredOrders.length === 1 ? "" : "s"}.
              </p>
            </div>

            <div className="rounded-full bg-[#f1f5f9] px-4 py-2 text-sm font-black text-[#60718e]">
              {filteredOrders.length} result
              {filteredOrders.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-[340px] place-items-center">
              <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e7edf4] border-t-[#ff6500]" />
                <p className="mt-5 font-semibold text-[#718099]">
                  Loading orders...
                </p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="grid min-h-[340px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-2xl text-[#ff6500]">
                  ✦
                </div>
                <h3 className="mt-5 text-2xl font-black">
                  No orders found
                </h3>
                <p className="mt-2 text-[#718099]">
                  There are no orders matching the current filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e7edf4]">
              {filteredOrders.map((order, index) => {
                const normalizedStatus = String(
                  order.status || ""
                ).toUpperCase();

                return (
                  <article
                    key={order.id}
                    className="p-6 transition hover:bg-[#fbfcfe] md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_.8fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#081529] text-xs font-black text-white">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className="break-words text-xl font-black tracking-tight">
                              {order.orderNumber}
                            </h3>
                          </div>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${getStatusDot(
                                order.status
                              )}`}
                            />
                            {normalizedStatus || "UNKNOWN"}
                          </span>
                        </div>

                        <p className="mt-4 text-lg font-black text-[#24344f]">
                          {order.firstProductTitle || "Order items"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#8290a5]">
                          <span>
                            {order.itemCount} item
                            {order.itemCount === 1 ? "" : "s"}
                          </span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-[#e2e9f1] bg-[#f7f9fc] p-5">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-[#081529] shadow-sm">
                            {getInitials(order.customer?.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff6500]">
                              Customer
                            </p>
                            <p className="mt-1 break-words font-black text-[#24344f]">
                              {order.customer?.name || "Customer"}
                            </p>
                            <p className="mt-1 break-all text-sm text-[#8290a5]">
                              {order.customer?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="xl:min-w-[250px] xl:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9aa8bb]">
                          Order total
                        </p>
                        <p className="mt-2 text-3xl font-black tracking-tight">
                          {formatMoney(order.total)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 xl:justify-end">
                          {normalizedStatus === "PENDING" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order, "PAID")
                              }
                              disabled={updatingOrderId === order.id}
                              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingOrderId === order.id
                                ? "Approving..."
                                : "Mark Paid"}
                            </button>
                          )}

                          {normalizedStatus !== "CANCELLED" &&
                            normalizedStatus !== "CANCELED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderStatus(
                                    order,
                                    "CANCELLED"
                                  )
                                }
                                disabled={
                                  updatingOrderId === order.id
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingOrderId === order.id
                                  ? "Updating..."
                                  : "Cancel"}
                              </button>
                            )}

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-xl bg-[#081529] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ff6500]"
                          >
                            View Order
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 border-t border-[#e7edf4] pt-6 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoBox
                        label="Payment provider"
                        value={order.paymentProvider || "—"}
                      />
                      <InfoBox
                        label="Payment reference"
                        value={order.paymentReference || "—"}
                      />
                      <InfoBox
                        label="Subtotal"
                        value={formatMoney(order.subtotal)}
                      />
                      <InfoBox
                        label="Service fee"
                        value={formatMoney(order.serviceFee)}
                      />
                    </div>

                    {order.items?.length > 0 && (
                      <div className="mt-6 rounded-[22px] border border-[#e2e9f1] bg-[#f7f9fc] p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff6500]">
                              Purchased products
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#718099]">
                              Items included in this order.
                            </p>
                          </div>

                          <p className="text-sm font-black text-[#60718e]">
                            {order.items.length} item
                            {order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e2e9f1] bg-white px-4 py-4 sm:flex-row sm:items-center"
                            >
                              <div className="min-w-0">
                                <p className="break-words font-black text-[#24344f]">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-[#8e9aab]">
                                  Qty {item.quantity} · Unit{" "}
                                  {formatMoney(item.price)}
                                </p>
                              </div>

                              <p className="shrink-0 font-black text-[#081529]">
                                {formatMoney(
                                  item.price * item.quantity
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminHeader() {
  return (
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
              Admin Orders
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          <AdminNav href="/admin">Dashboard</AdminNav>
          <AdminNav href="/admin/products">Products</AdminNav>
          <AdminNav href="/admin/orders" active>
            Orders
          </AdminNav>
          <AdminNav href="/admin/customers">Customers</AdminNav>
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
    <div className="min-w-0 rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
        {label}
      </p>
      <p
        className={`mt-3 break-words text-2xl font-black tracking-tight ${
          accent ? "text-[#ff7a22]" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-white/45">
        {helper}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone: "orange" | "green" | "amber" | "red" | "navy";
}) {
  const tones = {
    orange: "bg-orange-50 text-[#ff6500]",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    navy: "bg-slate-100 text-[#081529]",
  };

  return (
    <div className="rounded-[28px] border border-[#dce4ef] bg-white p-6 shadow-[0_16px_50px_rgba(20,35,60,.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-[#60718e]">{label}</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-[#081529]">
            {value}
          </p>
          <p className="mt-2 text-sm text-[#94a1b5]">{description}</p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>
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
          : "shrink-0 rounded-2xl border border-[#dce4ef] bg-[#f8fafc] px-5 py-3 text-sm font-bold text-[#60718e] transition hover:border-[#ffb783] hover:bg-white hover:text-[#081529]"
      }
    >
      {children}
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e2e9f1] bg-[#f7f9fc] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9aa8bb]">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-[#53627a]">
        {value}
      </p>
    </div>
  );
}
