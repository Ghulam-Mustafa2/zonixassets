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

type FilterType =
  | "ALL"
  | "PAID"
  | "PENDING";

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
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
  const normalized =
    status?.toUpperCase();

  if (normalized === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "PENDING") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  ) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default function AdminOrders() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [stats, setStats] =
    useState<Stats>({
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("ALL");

  const [search, setSearch] =
    useState("");

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

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

    if (!confirmed) {
      return;
    }

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
      console.error(
        "ADMIN_ORDER_STATUS_UPDATE_ERROR:",
        updateError
      );

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

      const response = await fetch(
        url,
        {
          method: "GET",
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
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load admin orders."
        );
      }

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );

      setStats({
        totalOrders:
          Number(
            data?.stats?.totalOrders
          ) || 0,

        paidOrders:
          Number(
            data?.stats?.paidOrders
          ) || 0,

        pendingOrders:
          Number(
            data?.stats?.pendingOrders
          ) || 0,

        totalRevenue:
          Number(
            data?.stats?.totalRevenue
          ) || 0,
      });
    } catch (loadError) {
      console.error(
        "ADMIN_ORDERS_UI_ERROR:",
        loadError
      );

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

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return orders;
      }

      return orders.filter(
        (order) => {
          return (
            order.orderNumber
              ?.toLowerCase()
              .includes(query) ||
            order.customer?.name
              ?.toLowerCase()
              .includes(query) ||
            order.customer?.email
              ?.toLowerCase()
              .includes(query) ||
            order.firstProductTitle
              ?.toLowerCase()
              .includes(query) ||
            order.status
              ?.toLowerCase()
              .includes(query)
          );
        }
      );
    }, [orders, search]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
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
              Order Management
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
        {/* TITLE */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm text-emerald-400">
              Admin
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              Manage Orders
            </h1>

            <p className="mt-3 text-white/45">
              Review customer orders,
              payments and purchased
              products.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Orders"}
          </button>
        </div>

        {/* MESSAGES */}

        {successMessage && (
          <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* STATS */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={String(
              stats.totalOrders
            )}
            description="Orders in current view"
          />

          <StatCard
            label="Paid Orders"
            value={String(
              stats.paidOrders
            )}
            description="Payment confirmed"
            highlight
          />

          <StatCard
            label="Pending Orders"
            value={String(
              stats.pendingOrders
            )}
            description="Waiting for payment"
          />

          <StatCard
            label="Revenue"
            value={formatMoney(
              stats.totalRevenue
            )}
            description="Paid order revenue"
            highlight
          />
        </section>

        {/* FILTERS */}

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={
                  filter === "ALL"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All Orders
              </FilterButton>

              <FilterButton
                active={
                  filter === "PAID"
                }
                onClick={() =>
                  setFilter("PAID")
                }
              >
                Paid
              </FilterButton>

              <FilterButton
                active={
                  filter === "PENDING"
                }
                onClick={() =>
                  setFilter(
                    "PENDING"
                  )
                }
              >
                Pending
              </FilterButton>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, customer, email..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-emerald-400/40 lg:max-w-md"
            />
          </div>
        </section>

        {/* ORDERS */}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <p className="text-sm text-emerald-400">
              Orders
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Order List
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Showing{" "}
              {filteredOrders.length}{" "}
              order
              {filteredOrders.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-white/40">
              Loading orders...
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="py-20 text-center">
              <h3 className="font-semibold">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-white/35">
                There are no orders
                matching this filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredOrders.map(
                (order) => (
                  <article
                    key={order.id}
                    className="p-6 md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr_auto] xl:items-center">
                      {/* ORDER INFO */}

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {
                              order.orderNumber
                            }
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {order.status ||
                              "UNKNOWN"}
                          </span>
                        </div>

                        <p className="mt-3 text-base font-semibold">
                          {
                            order.firstProductTitle
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
                          <span>
                            {
                              order.itemCount
                            }{" "}
                            item
                            {order.itemCount ===
                            1
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

                      {/* CUSTOMER */}

                      <div className="rounded-xl border border-white/10 bg-black p-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-emerald-400">
                          Customer
                        </p>

                        <p className="mt-2 font-semibold">
                          {order.customer
                            ?.name ||
                            "Customer"}
                        </p>

                        <p className="mt-1 break-all text-sm text-white/40">
                          {order.customer
                            ?.email ||
                            "No email"}
                        </p>

                        <p className="mt-2 text-xs text-white/25">
                          ID:{" "}
                          {order.userId}
                        </p>
                      </div>

                      {/* TOTAL + BUTTON */}

                      <div className="xl:text-right">
                        <p className="text-2xl font-bold">
                          {formatMoney(
                            order.total
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          Order Total
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 xl:justify-end">
                          {order.status?.toUpperCase() === "PENDING" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order, "PAID")
                              }
                              disabled={updatingOrderId === order.id}
                              className="inline-flex rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingOrderId === order.id
                                ? "Approving..."
                                : "Approve / Mark Paid"}
                            </button>
                          )}

                          {order.status?.toUpperCase() !== "CANCELLED" &&
                            order.status?.toUpperCase() !== "CANCELED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderStatus(order, "CANCELLED")
                                }
                                disabled={updatingOrderId === order.id}
                                className="inline-flex rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingOrderId === order.id
                                  ? "Updating..."
                                  : "Cancel"}
                              </button>
                            )}

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                          >
                            View Order
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* PAYMENT INFO */}

                    <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
                      <InfoBox
                        label="Payment Provider"
                        value={
                          order.paymentProvider ||
                          "-"
                        }
                      />

                      <InfoBox
                        label="Payment Reference"
                        value={
                          order.paymentReference ||
                          "-"
                        }
                      />

                      <InfoBox
                        label="Subtotal"
                        value={formatMoney(
                          order.subtotal
                        )}
                      />
                    </div>

                    {/* ORDER ITEMS */}

                    {order.items?.length >
                      0 && (
                      <div className="mt-6">
                        <p className="mb-3 text-sm text-white/40">
                          Purchased Products
                        </p>

                        <div className="space-y-2">
                          {order.items.map(
                            (item) => (
                              <div
                                key={
                                  item.id
                                }
                                className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 sm:flex-row sm:items-center"
                              >
                                <div>
                                  <p className="font-medium">
                                    {
                                      item.title
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    Qty:{" "}
                                    {
                                      item.quantity
                                    }{" "}
                                    · Unit:{" "}
                                    {formatMoney(
                                      item.price
                                    )}
                                  </p>
                                </div>

                                <p className="font-semibold">
                                  {formatMoney(
                                    item.price *
                                      item.quantity
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
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
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/40">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          highlight
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
          ? "rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black"
          : "rounded-xl border border-white/10 bg-black px-5 py-2.5 text-sm text-white/60 transition hover:bg-white/5"
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
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-medium">
        {value}
      </p>
    </div>
  );
}