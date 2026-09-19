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
  if (!value) return "No expiry";

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

  if (!parts.length) return "ZA";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminOrderDetails({ orderId }: Props) {
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
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
        throw new Error(data?.error || "Unable to load order details.");
      }

      setOrder(data?.order || null);
    } catch (loadError) {
      console.error("ADMIN_ORDER_DETAILS_UI_ERROR:", loadError);

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
    if (!order) return;

    const label =
      status === "PAID"
        ? "mark this order as PAID"
        : status === "PENDING"
          ? "move this order back to PENDING"
          : "CANCEL this order";

    const confirmed = window.confirm(
      `Are you sure you want to ${label}?`
    );

    if (!confirmed) return;

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
      <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
        <AdminHeader />
        <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
          <div className="grid min-h-[420px] place-items-center rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e7edf4] border-t-[#ff6500]" />
              <p className="mt-5 font-semibold text-[#718099]">
                Loading order details...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
        <AdminHeader />
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-10">
          <div className="rounded-[30px] border border-red-200 bg-white p-8 shadow-[0_20px_60px_rgba(20,35,60,.06)] md:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-600">
              !
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight">
              Unable to load order
            </h1>
            <p className="mt-3 max-w-2xl text-[#718099]">{error}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadOrder}
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 font-black text-white transition hover:bg-[#ff7420]"
              >
                Try Again
              </button>

              <Link
                href="/admin/orders"
                className="rounded-2xl border border-[#dce4ef] bg-[#f8fafc] px-6 py-3.5 font-black text-[#081529] transition hover:bg-white"
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
      <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
        <AdminHeader />
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-10">
          <div className="rounded-[30px] border border-[#dce4ef] bg-white p-10 text-center shadow-[0_20px_60px_rgba(20,35,60,.06)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-2xl text-[#ff6500]">
              ✦
            </div>
            <h1 className="mt-5 text-3xl font-black">Order not found</h1>
            <p className="mt-2 text-[#718099]">
              This order could not be found or may no longer be available.
            </p>

            <Link
              href="/admin/orders"
              className="mt-7 inline-flex rounded-2xl bg-[#081529] px-6 py-3.5 font-black text-white transition hover:bg-[#ff6500]"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const normalizedStatus = String(order.status || "").toUpperCase();
  const paid = normalizedStatus === "PAID";

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
      <AdminHeader />

      <section
        className="relative overflow-hidden bg-[#071426] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 6% 100%, rgba(0,190,220,.16), transparent 30%), radial-gradient(circle at 92% 12%, rgba(255,101,0,.18), transparent 28%)",
          backgroundSize: "64px 64px, 64px 64px, auto, auto",
        }}
      >
        <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-10 md:py-16">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/45">
            <Link href="/admin" className="transition hover:text-white">
              Admin
            </Link>
            <span>/</span>
            <Link
              href="/admin/orders"
              className="transition hover:text-white"
            >
              Orders
            </Link>
            <span>/</span>
            <span className="font-semibold text-white/80">
              {order.orderNumber}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                <span
                  className={`h-2 w-2 rounded-full ${getStatusDot(
                    order.status
                  )}`}
                />
                Order Details
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <h1 className="text-4xl font-black tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                  {order.orderNumber}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClasses(
                    order.status
                  )}`}
                >
                  {normalizedStatus || "UNKNOWN"}
                </span>
              </div>

              <p className="mt-5 text-lg text-white/55">
                Created {formatDate(order.createdAt)}
              </p>

              <p className="mt-2 break-all text-xs text-white/30">
                Order ID: {order.id}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/admin/orders"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-black text-white transition hover:bg-white/10"
                >
                  ← Back to Orders
                </Link>

                <button
                  type="button"
                  onClick={loadOrder}
                  disabled={updatingStatus !== null}
                  className="rounded-2xl bg-[#ff6500] px-5 py-3 font-black text-white transition hover:bg-[#ff7420] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Refresh Order
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HeroMetric
                label="Order total"
                value={formatMoney(order.total)}
                helper={`${order.itemCount} item${
                  order.itemCount === 1 ? "" : "s"
                }`}
                accent
              />
              <HeroMetric
                label="Customer"
                value={order.customer?.name || "Customer"}
                helper={order.customer?.email || "No email address"}
              />
              <HeroMetric
                label="Payment"
                value={normalizedStatus || "Unknown"}
                helper={order.paymentProvider || "Provider not set"}
              />
              <HeroMetric
                label="Downloads"
                value={String(
                  order.items.filter((item) => item.download).length
                )}
                helper="Items with download access"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10 md:py-12">
        {(actionMessage || actionError) && (
          <div className="mb-8 space-y-3">
            {actionMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {actionMessage}
              </div>
            )}

            {actionError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {actionError}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.5fr_.8fr]">
          <div className="space-y-8">
            <section className="rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
              <SectionHeader
                eyebrow="Customer"
                title="Customer information"
                helper="Account details connected to this order."
              />

              <div className="grid gap-4 p-6 sm:grid-cols-2 md:p-8">
                <ProfileCard
                  name={order.customer?.name || "Customer"}
                  email={order.customer?.email || "No email"}
                  role={order.customer?.role || "CUSTOMER"}
                />

                <div className="grid gap-4">
                  <InfoBox
                    label="Customer ID"
                    value={order.customer?.id || order.userId}
                  />
                  <InfoBox label="Order user ID" value={order.userId} />
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
              <SectionHeader
                eyebrow="Products"
                title="Purchased items"
                helper={`${order.items.length} product${
                  order.items.length === 1 ? "" : "s"
                } in this order.`}
              />

              {order.items.length === 0 ? (
                <div className="grid min-h-[260px] place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-xl text-[#ff6500]">
                      ✦
                    </div>
                    <h3 className="mt-4 text-xl font-black">
                      No purchased items found
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#e7edf4]">
                  {order.items.map((item, index) => {
                    const usage =
                      item.download && item.download.maxDownloads > 0
                        ? Math.min(
                            100,
                            (item.download.downloadCount /
                              item.download.maxDownloads) *
                              100
                          )
                        : 0;

                    return (
                      <article key={item.id} className="p-6 md:p-8">
                        <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-start">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#081529] text-sm font-black text-white">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-2xl font-black tracking-tight">
                              {item.title}
                            </h3>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <MetaPill>
                                Qty {item.quantity}
                              </MetaPill>
                              <MetaPill>
                                Unit {formatMoney(item.price)}
                              </MetaPill>
                              {item.productId && (
                                <MetaPill>
                                  Product linked
                                </MetaPill>
                              )}
                            </div>

                            <div className="mt-4 space-y-1 text-xs text-[#9aa8bb]">
                              {item.productId && (
                                <p className="break-all">
                                  Product ID: {item.productId}
                                </p>
                              )}
                              <p className="break-all">
                                Order Item ID: {item.id}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#f7f9fc] px-5 py-4 md:text-right">
                            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9aa8bb]">
                              Line total
                            </p>
                            <p className="mt-2 text-2xl font-black text-[#081529]">
                              {formatMoney(item.lineTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-[#dce4ef] bg-[#f7f9fc] p-5 md:p-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                                Download access
                              </p>
                              <h4 className="mt-1 text-lg font-black">
                                Entitlement status
                              </h4>
                            </div>

                            <span
                              className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black ${
                                item.download
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {item.download
                                ? "ACCESS AVAILABLE"
                                : "NO ENTITLEMENT"}
                            </span>
                          </div>

                          {item.download ? (
                            <>
                              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

                              <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold text-[#7c8aa0]">
                                  <span>Download usage</span>
                                  <span>
                                    {item.download.downloadCount}/
                                    {item.download.maxDownloads}
                                  </span>
                                </div>

                                <div className="h-2.5 overflow-hidden rounded-full bg-[#e7edf4]">
                                  <div
                                    className="h-full rounded-full bg-[#0ba7b4] transition-all"
                                    style={{ width: `${usage}%` }}
                                  />
                                </div>
                              </div>

                              <p className="mt-4 break-all text-xs text-[#a4b0c1]">
                                Entitlement ID: {item.download.id}
                              </p>
                            </>
                          ) : (
                            <p className="mt-5 text-sm leading-6 text-amber-700">
                              No download entitlement exists for this
                              purchased item.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[30px] border border-[#dce4ef] bg-white p-6 shadow-[0_20px_60px_rgba(20,35,60,.06)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                Summary
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Order summary
              </h2>

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label="Items"
                  value={`${order.itemCount}`}
                />
                <SummaryRow
                  label="Subtotal"
                  value={formatMoney(order.subtotal)}
                />
                <SummaryRow
                  label="Service fee"
                  value={formatMoney(order.serviceFee)}
                />
              </div>

              <div className="my-6 border-t border-[#e7edf4]" />

              <div className="flex items-end justify-between gap-4">
                <span className="font-bold text-[#60718e]">Total</span>
                <span className="text-3xl font-black tracking-tight text-[#081529]">
                  {formatMoney(order.total)}
                </span>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#dce4ef] bg-white p-6 shadow-[0_20px_60px_rgba(20,35,60,.06)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                Payment
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Payment information
              </h2>

              <div className="mt-6 space-y-3">
                <InfoBox
                  label="Payment status"
                  value={normalizedStatus || "Unknown"}
                />
                <InfoBox
                  label="Payment provider"
                  value={order.paymentProvider || "—"}
                />
                <InfoBox
                  label="Payment reference"
                  value={order.paymentReference || "—"}
                />
              </div>

              <div
                className={`mt-6 rounded-2xl border p-5 ${
                  paid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      paid ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-black ${
                        paid
                          ? "text-emerald-800"
                          : "text-amber-800"
                      }`}
                    >
                      {paid
                        ? "Payment confirmed"
                        : "Payment not confirmed"}
                    </p>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        paid
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {paid
                        ? "This order is paid. Eligible download access can remain active."
                        : "This order has not been confirmed as paid yet."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-[#071426] p-6 text-white shadow-[0_20px_60px_rgba(20,35,60,.12)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                Admin controls
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Order status
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Status changes affect how this order appears across the admin
                and customer experience.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => updateOrderStatus("PAID")}
                  disabled={
                    updatingStatus !== null ||
                    normalizedStatus === "PAID"
                  }
                  className="w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-[#05281d] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
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
                    normalizedStatus === "PENDING"
                  }
                  className="w-full rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-3.5 font-black text-amber-200 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-40"
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
                    normalizedStatus === "CANCELLED"
                  }
                  className="w-full rounded-2xl border border-red-300/25 bg-red-300/10 px-5 py-3.5 font-black text-red-200 transition hover:bg-red-300/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updatingStatus === "CANCELLED"
                    ? "Updating..."
                    : "Cancel Order"}
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={loadOrder}
                  disabled={updatingStatus !== null}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Refresh Order
                </button>

                <Link
                  href="/admin/orders"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 font-black text-white transition hover:bg-white/10"
                >
                  Back to Orders
                </Link>

                <Link
                  href="/admin"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 px-5 py-3.5 font-black text-white/80 transition hover:bg-white/[0.05] hover:text-white"
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
              Admin Order Details
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

function SectionHeader({
  eyebrow,
  title,
  helper,
}: {
  eyebrow: string;
  title: string;
  helper: string;
}) {
  return (
    <div className="border-b border-[#e7edf4] p-6 md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-[#718099]">{helper}</p>
    </div>
  );
}

function ProfileCard({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  return (
    <div className="rounded-[24px] bg-[#071426] p-5 text-white">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-[#081529]">
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <p className="break-words text-xl font-black">{name}</p>
          <p className="mt-1 break-all text-sm text-white/45">{email}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/35">
          Account role
        </p>
        <p className="mt-2 font-black text-cyan-300">
          {String(role || "CUSTOMER").toUpperCase()}
        </p>
      </div>
    </div>
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
    <div className="rounded-2xl border border-[#e2e9f1] bg-[#f7f9fc] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9aa8bb]">
        {label}
      </p>
      <p className="mt-2 break-all font-black text-[#53627a]">
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
    <div className="rounded-2xl border border-[#e2e9f1] bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#9aa8bb]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-[#53627a]">
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
      <span className="font-semibold text-[#718099]">{label}</span>
      <span className="font-black text-[#081529]">{value}</span>
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#dce4ef] bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#60718e]">
      {children}
    </span>
  );
}
