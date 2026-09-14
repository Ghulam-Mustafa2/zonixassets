import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type OrderItem = {
  id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal: number | string;
  service_fee: number | string;
  total: number | string;
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  is_active?: boolean | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatMoney(value: number | string) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClasses(status: string) {
  const normalized = status?.toUpperCase();

  if (normalized === "PAID") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "PENDING") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (normalized === "CANCELLED") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (normalized === "REFUNDED") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default async function OrderDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const orderId = id?.trim();

  if (!orderId) {
    notFound();
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  /*
    Read login session
  */

  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get(
      "pakstore-access-token"
    )?.value;

  if (!accessToken) {
    redirect("/login");
  }

  /*
    Verify logged-in user
  */

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const userData =
    await userResponse.json();

  if (
    !userResponse.ok ||
    !userData?.id
  ) {
    redirect("/login");
  }

  /*
    Verify current account status.

    A valid Supabase session is not enough:
    suspended accounts must not be able to
    view protected order details.
  */

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        userData.id
      )}&select=id,is_active`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

  const profileData =
    await profileResponse.json();

  if (!profileResponse.ok) {
    console.error(
      "ORDER_DETAILS_PROFILE_ERROR:",
      profileData
    );

    throw new Error(
      profileData?.message ||
        "Unable to verify account status."
    );
  }

  const profile =
    Array.isArray(profileData)
      ? (profileData[0] as
          | ProfileRow
          | undefined)
      : undefined;

  if (!profile) {
    redirect("/login");
  }

  if (profile.is_active === false) {
    redirect("/login");
  }

  /*
    Fetch order

    IMPORTANT:
    We filter using BOTH:
    - order ID
    - logged-in user ID

    This prevents another customer
    from viewing somebody else's order.
  */

  const orderResponse = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
      orderId
    )}&user_id=eq.${encodeURIComponent(
      userData.id
    )}&select=id,order_number,user_id,status,subtotal,service_fee,total,payment_provider,payment_reference,created_at`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const orderData =
    await orderResponse.json();

  if (!orderResponse.ok) {
    console.error(
      "ORDER_DETAILS_FETCH_ERROR:",
      orderData
    );

    throw new Error(
      orderData?.message ||
        "Unable to load order."
    );
  }

  const order =
    Array.isArray(orderData)
      ? (orderData[0] as
          | Order
          | undefined)
      : undefined;

  if (!order) {
    notFound();
  }

  /*
    Fetch order items
  */

  const itemsResponse = await fetch(
    `${supabaseUrl}/rest/v1/order_items?order_id=eq.${encodeURIComponent(
      order.id
    )}&select=id,product_id,product_title,product_price,quantity`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const itemsData =
    await itemsResponse.json();

  if (!itemsResponse.ok) {
    console.error(
      "ORDER_DETAILS_ITEMS_ERROR:",
      itemsData
    );

    throw new Error(
      itemsData?.message ||
        "Unable to load order items."
    );
  }

  const items: OrderItem[] =
    Array.isArray(itemsData)
      ? itemsData
      : [];

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  const isPaid =
    order.status?.toUpperCase() ===
    "PAID";

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/40">
            <Link
              href="/account"
              className="transition hover:text-white"
            >
              Account
            </Link>

            <span>/</span>

            <span>Orders</span>

            <span>/</span>

            <span className="text-white/70">
              {order.order_number}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-8">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    Order Details
                  </p>

                  <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                    {order.order_number}
                  </h1>

                  <p className="mt-3 text-sm text-white/40">
                    Created {formatDate(order.created_at)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase ${getStatusClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div>
                <p className="text-sm text-emerald-400">
                  Purchased Products
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Order Items
                </h2>
              </div>

              <div className="mt-7 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black p-6 text-sm text-white/40">
                    No order items found.
                  </div>
                ) : (
                  items.map((item) => {
                    const price =
                      Number(
                        item.product_price ||
                          0
                      );

                    const quantity =
                      Number(
                        item.quantity || 0
                      );

                    const lineTotal =
                      price * quantity;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-black p-5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <h3 className="font-semibold">
                            {
                              item.product_title
                            }
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/40">
                            <span>
                              Quantity:{" "}
                              {quantity}
                            </span>

                            <span>
                              Unit price:{" "}
                              {formatMoney(
                                price
                              )}
                            </span>
                          </div>
                        </div>

                        <p className="text-lg font-bold">
                          {formatMoney(
                            lineTotal
                          )}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm text-emerald-400">
                Payment
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Payment Information
              </h2>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black p-5">
                  <p className="text-sm text-white/40">
                    Payment Status
                  </p>

                  <p className="mt-2 font-semibold">
                    {isPaid
                      ? "Payment Confirmed"
                      : "Payment Pending"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-5">
                  <p className="text-sm text-white/40">
                    Payment Provider
                  </p>

                  <p className="mt-2 font-semibold">
                    {order.payment_provider ||
                      "Not processed yet"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-5 md:col-span-2">
                  <p className="text-sm text-white/40">
                    Payment Reference
                  </p>

                  <p className="mt-2 break-all font-medium">
                    {order.payment_reference ||
                      "No payment reference yet"}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/account"
                className="flex-1 rounded-xl bg-emerald-400 px-6 py-4 text-center font-semibold text-black transition hover:bg-emerald-300"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/products"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center font-semibold transition hover:bg-white/10"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-emerald-400">
              Summary
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Order Summary
            </h2>

            <div className="mt-7 space-y-4 border-b border-white/10 pb-6 text-sm">
              <div className="flex justify-between gap-4 text-white/50">
                <span>Items</span>

                <span>
                  {totalQuantity}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-white/50">
                <span>Subtotal</span>

                <span>
                  {formatMoney(
                    order.subtotal
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-white/50">
                <span>
                  Service Fee
                </span>

                <span>
                  {formatMoney(
                    order.service_fee
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-white/50">
                Total
              </span>

              <span className="text-3xl font-bold">
                {formatMoney(
                  order.total
                )}
              </span>
            </div>

            <div
              className={`mt-6 rounded-2xl border p-4 ${
                isPaid
                  ? "border-emerald-400/20 bg-emerald-400/5"
                  : "border-yellow-400/20 bg-yellow-400/5"
              }`}
            >
              <p
                className={
                  isPaid
                    ? "font-semibold text-emerald-300"
                    : "font-semibold text-yellow-300"
                }
              >
                {isPaid
                  ? "Order Paid"
                  : "Payment Pending"}
              </p>

              <p className="mt-2 text-sm leading-6 text-white/40">
                {isPaid
                  ? "Your payment has been confirmed. Eligible digital downloads are available from your account."
                  : "This order exists, but payment has not been completed yet."}
              </p>
            </div>

            {isPaid && (
              <Link
                href="/account"
                className="mt-5 block w-full rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15"
              >
                View Downloads
              </Link>
            )}
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}