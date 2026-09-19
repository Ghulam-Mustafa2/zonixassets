"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type OrderItem = {
  id?: string;
  productId?: string;
  productTitle: string;
  productPrice?: number;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type DashboardResponse = {
  success?: boolean;
  orders?: Order[];
  error?: string;
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function statusClasses(status: string) {
  const normalized = status?.toUpperCase();

  if (normalized === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "PENDING") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (normalized === "CANCELLED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (normalized === "REFUNDED") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();

  const orderId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      if (!orderId) {
        setError("Invalid order ID.");
        return;
      }

      const response = await fetch(
        "/api/account/dashboard",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data: DashboardResponse =
        await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load your order."
        );
      }

      const foundOrder =
        data.orders?.find(
          (item) => item.id === orderId
        ) || null;

      if (!foundOrder) {
        setError(
          "We could not find this order."
        );

        return;
      }

      setOrder(foundOrder);
    } catch (loadError) {
      console.error(
        "ORDER_SUCCESS_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);



  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-20">
        {loading && (
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />

              <p className="mt-4 text-sm text-white/40">
                Loading your order...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[32px] border border-red-400/20 bg-red-400/5 p-8 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-2xl text-red-300">
              !
            </div>

            <h1 className="mt-6 text-3xl font-bold">
              Order could not be loaded
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-white/50">
              {error}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/account"
                className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
              >
                Go to Dashboard
              </Link>

              <Link
                href="/products"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10"
              >
                Browse Products
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && order && (
          <>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-4xl text-emerald-400">
                ✓
              </div>

              <p className="mt-6 text-sm font-medium text-emerald-400">
                Order Successfully Created
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Thank You for Your Order
              </h1>

              <p className="mx-auto mt-4 max-w-xl leading-7 text-white/45">
                Your order has been saved successfully
                in ZonixAssets. You can track its status
                from your customer dashboard.
              </p>
            </div>

            <section className="mt-12 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 p-6 md:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                      Order Number
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      {order.orderNumber}
                    </h2>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${statusClasses(
                      order.status
                    )}`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
                <div>
                  <p className="text-sm text-white/35">
                    Order Date
                  </p>

                  <p className="mt-2 font-medium">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/35">
                    Items
                  </p>

                  <p className="mt-2 font-medium">
                    {order.items.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/35">
                    Total
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {formatMoney(order.total)}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 p-6 md:p-8">
                <p className="text-sm font-medium text-emerald-400">
                  Order Items
                </p>

                <div className="mt-5 space-y-3">
                  {order.items.map(
                    (item, index) => (
                      <div
                        key={
                          item.id ||
                          `${item.productTitle}-${index}`
                        }
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black p-5"
                      >
                        <div>
                          <h3 className="font-semibold">
                            {item.productTitle}
                          </h3>

                          <p className="mt-1 text-sm text-white/40">
                            Quantity:{" "}
                            {item.quantity}
                          </p>
                        </div>

                        {typeof item.productPrice ===
                          "number" && (
                          <p className="font-semibold">
                            {formatMoney(
                              item.productPrice *
                                item.quantity
                            )}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            {order.status.toUpperCase() ===
              "PENDING" && (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
                <p className="font-semibold text-amber-300">
                  Payment Pending
                </p>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Your order has been created successfully.
                  Download access will be enabled automatically
                  after your payment is confirmed.
                </p>
              </div>
            )}

            {order.status.toUpperCase() ===
              "PAID" && (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                <p className="font-semibold text-emerald-300">
                  Payment Confirmed
                </p>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Your payment has been confirmed.
                  Eligible downloads are available
                  from your account dashboard.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/account"
                className="rounded-xl bg-emerald-400 px-6 py-4 text-center font-semibold text-black transition hover:bg-emerald-300"
              >
                View My Orders
              </Link>

              <Link
                href="/products"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center font-semibold transition hover:bg-white/10"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Secure
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Account Order
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Verified
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Server Pricing
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Protected
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Customer Account
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}