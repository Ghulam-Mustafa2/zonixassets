"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DownloadInfo = {
  id: string;
  downloadCount: number;
  maxDownloads: number;
  remaining: number;
  expiresAt: string | null;
  createdAt: string | null;
};

type OrderItem = {
  id: string;
  productId: string | null;
  title: string;
  price: number;
  quantity: number;
  lineTotal: number;
  download: DownloadInfo | null;
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
  status: string;
  userId: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: string;
  itemCount: number;
  customer: Customer;
  items: OrderItem[];
};

type Props = {
  orderId: string;
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No expiry";
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
  const normalized = status?.toUpperCase();

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

export default function AdminOrderDetails({
  orderId,
}: Props) {
  const router = useRouter();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState<string | null>(null);

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(
          orderId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
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
          data?.error ||
            "Unable to load order details."
        );
      }

      setOrder(data?.order || null);
    } catch (loadError) {
      console.error(
        "ADMIN_ORDER_DETAILS_UI_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(
    status: "PAID" | "PENDING" | "CANCELLED"
  ) {
    if (!order) {
      return;
    }

    const label =
      status === "PAID"
        ? "mark this order as PAID"
        : status === "PENDING"
          ? "move this order back to PENDING"
          : "CANCEL this order";

    const confirmed = window.confirm(
      `Are you sure you want to ${label}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStatus(status);
      setActionMessage("");
      setActionError("");

      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
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

      setActionMessage(
        data?.message || `Order updated to ${status}.`
      );

      await loadOrder();
    } catch (updateError) {
      console.error(
        "ADMIN_ORDER_STATUS_UPDATE_UI_ERROR:",
        updateError
      );

      setActionError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/40">
            Loading order details...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
            <h1 className="text-2xl font-bold text-red-300">
              Unable to load order
            </h1>

            <p className="mt-3 text-red-200/70">
              {error}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadOrder}
                className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
              >
                Try Again
              </button>

              <Link
                href="/admin/orders"
                className="rounded-xl border border-white/10 px-5 py-3 font-semibold"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <h1 className="text-2xl font-bold">
              Order not found
            </h1>

            <Link
              href="/admin/orders"
              className="mt-6 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
              Admin Order Details
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
              href="/products"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              View Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* BREADCRUMB */}

        <div className="mb-6 text-sm text-white/40">
          <Link
            href="/admin"
            className="hover:text-white"
          >
            Admin
          </Link>

          <span className="mx-2">/</span>

          <Link
            href="/admin/orders"
            className="hover:text-white"
          >
            Orders
          </Link>

          <span className="mx-2">/</span>

          <span className="text-white/70">
            {order.orderNumber}
          </span>
        </div>

        {/* HERO */}

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-emerald-400">
                Order Details
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {order.orderNumber}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-white/40">
                Created {formatDate(order.createdAt)}
              </p>

              <p className="mt-1 break-all text-xs text-white/25">
                Order ID: {order.id}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black px-6 py-5 lg:text-right">
              <p className="text-sm text-white/40">
                Order Total
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {formatMoney(order.total)}
              </p>

              <p className="mt-2 text-xs text-white/30">
                {order.itemCount} item
                {order.itemCount === 1
                  ? ""
                  : "s"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_0.8fr]">
          {/* LEFT COLUMN */}

          <div className="space-y-8">
            {/* CUSTOMER */}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm text-emerald-400">
                Customer
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Customer Information
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoBox
                  label="Customer Name"
                  value={
                    order.customer?.name ||
                    "Customer"
                  }
                />

                <InfoBox
                  label="Email Address"
                  value={
                    order.customer?.email ||
                    "No email"
                  }
                />

                <InfoBox
                  label="Account Role"
                  value={
                    order.customer?.role ||
                    "CUSTOMER"
                  }
                />

                <InfoBox
                  label="Customer ID"
                  value={
                    order.customer?.id ||
                    order.userId
                  }
                />
              </div>
            </section>

            {/* ITEMS */}

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Products
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Purchased Items
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  {order.items.length} product
                  {order.items.length === 1
                    ? ""
                    : "s"}{" "}
                  in this order.
                </p>
              </div>

              {order.items.length === 0 ? (
                <div className="p-8 text-white/40">
                  No purchased items found.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {order.items.map((item) => (
                    <article
                      key={item.id}
                      className="p-6 md:p-8"
                    >
                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                        <div>
                          <p className="text-xl font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-2 text-sm text-white/40">
                            Quantity: {item.quantity}
                          </p>

                          <p className="mt-1 text-sm text-white/40">
                            Unit Price:{" "}
                            {formatMoney(item.price)}
                          </p>

                          {item.productId && (
                            <p className="mt-2 break-all text-xs text-white/25">
                              Product ID:{" "}
                              {item.productId}
                            </p>
                          )}

                          <p className="mt-1 break-all text-xs text-white/25">
                            Order Item ID: {item.id}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <p className="text-sm text-white/40">
                            Line Total
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {formatMoney(
                              item.lineTotal
                            )}
                          </p>
                        </div>
                      </div>

                      {/* DOWNLOAD ENTITLEMENT */}

                      <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
                        <p className="text-xs uppercase tracking-[0.15em] text-emerald-400">
                          Download Access
                        </p>

                        {item.download ? (
                          <>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <SmallInfo
                                label="Used"
                                value={`${item.download.downloadCount}`}
                              />

                              <SmallInfo
                                label="Maximum"
                                value={`${item.download.maxDownloads}`}
                              />

                              <SmallInfo
                                label="Remaining"
                                value={`${item.download.remaining}`}
                              />

                              <SmallInfo
                                label="Expires"
                                value={formatDate(
                                  item.download.expiresAt
                                )}
                              />
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between text-xs text-white/40">
                                <span>
                                  Download Usage
                                </span>

                                <span>
                                  {
                                    item.download
                                      .downloadCount
                                  }
                                  /
                                  {
                                    item.download
                                      .maxDownloads
                                  }
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      item.download
                                        .maxDownloads >
                                        0
                                        ? (item
                                            .download
                                            .downloadCount /
                                            item
                                              .download
                                              .maxDownloads) *
                                            100
                                        : 0
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <p className="mt-4 break-all text-xs text-white/25">
                              Entitlement ID:{" "}
                              {item.download.id}
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-yellow-300/80">
                            No download entitlement
                            exists for this item.
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}

          <aside className="space-y-8">
            {/* SUMMARY */}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm text-emerald-400">
                Summary
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <SummaryRow
                  label="Items"
                  value={`${order.itemCount}`}
                />

                <SummaryRow
                  label="Subtotal"
                  value={formatMoney(
                    order.subtotal
                  )}
                />

                <SummaryRow
                  label="Service Fee"
                  value={formatMoney(
                    order.serviceFee
                  )}
                />
              </div>

              <div className="my-6 border-t border-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-white/60">
                  Total
                </span>

                <span className="text-3xl font-bold">
                  {formatMoney(
                    order.total
                  )}
                </span>
              </div>
            </section>

            {/* PAYMENT */}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm text-emerald-400">
                Payment
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Payment Information
              </h2>

              <div className="mt-6 space-y-4">
                <InfoBox
                  label="Payment Status"
                  value={order.status}
                />

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
              </div>

              {order.status?.toUpperCase() ===
              "PAID" ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="font-semibold text-emerald-300">
                    Payment Confirmed
                  </p>

                  <p className="mt-2 text-sm text-emerald-100/60">
                    This order has been paid.
                    Eligible download access is
                    active.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                  <p className="font-semibold text-yellow-300">
                    Payment Pending
                  </p>

                  <p className="mt-2 text-sm text-yellow-100/60">
                    Payment has not been
                    confirmed for this order.
                  </p>
                </div>
              )}
            </section>

            {/* ACTIONS */}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm text-emerald-400">
                Admin
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Quick Actions
              </h2>

              <div className="mt-6 space-y-3">
                {actionMessage && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
                    {actionMessage}
                  </div>
                )}

                {actionError && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                    {actionError}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                    Order Status
                  </p>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => updateOrderStatus("PAID")}
                      disabled={
                        updatingStatus !== null ||
                        order.status?.toUpperCase() === "PAID"
                      }
                      className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingStatus === "PAID"
                        ? "Updating..."
                        : "Mark as PAID"}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus("PENDING")}
                      disabled={
                        updatingStatus !== null ||
                        order.status?.toUpperCase() === "PENDING"
                      }
                      className="w-full rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingStatus === "PENDING"
                        ? "Updating..."
                        : "Mark as PENDING"}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus("CANCELLED")}
                      disabled={
                        updatingStatus !== null ||
                        order.status?.toUpperCase() === "CANCELLED"
                      }
                      className="w-full rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingStatus === "CANCELLED"
                        ? "Updating..."
                        : "Cancel Order"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadOrder}
                  disabled={updatingStatus !== null}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Refresh Order
                </button>

                <Link
                  href="/admin/orders"
                  className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
                >
                  Back to Orders
                </Link>

                <Link
                  href="/admin"
                  className="flex w-full items-center justify-center rounded-xl border border-white/10 px-5 py-3 font-semibold transition hover:bg-white/5"
                >
                  Admin Dashboard
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
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
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <p className="mt-2 break-all font-medium">
        {value}
      </p>
    </div>
  );
}

function SmallInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/45">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}