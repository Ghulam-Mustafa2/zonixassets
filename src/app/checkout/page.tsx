"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    cartCount,
    cartTotal,
    clearCart,
  } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] =
    useState("Pakistan");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
    Backend currently uses service fee = 0.
    Keep frontend total consistent with server.
  */
  const serviceFee = 0;
  const grandTotal = cartTotal + serviceFee;

  async function handleCheckout(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim()
    ) {
      setError(
        "Please enter your first name, last name and email."
      );

      return;
    }

    if (
      !address.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setError(
        "Please complete your billing information."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
        IMPORTANT:
        Only product IDs and quantities are sent.

        Price is verified again on the server
        from Supabase.
      */
      const orderItems = cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const response = await fetch(
        "/api/orders/create",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            items: orderItems,

            customer: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              country,
              address: address.trim(),
              city: city.trim(),
              postalCode: postalCode.trim(),
            },

            paymentMethod: "lemon_squeezy",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "Your session has expired. Please sign in again."
          );

          setTimeout(() => {
            router.push("/login");
          }, 1500);

          return;
        }

        throw new Error(
          data?.error ||
            "Unable to create your order."
        );
      }

      const createdOrderId = data?.order?.id;

      if (!createdOrderId) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      /*
        Create a secure Lemon Squeezy checkout
        for the newly-created PENDING order.
      */
      setSuccess(
        "Order created. Opening secure payment..."
      );

      const paymentResponse = await fetch(
        "/api/payments/lemon-checkout",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: createdOrderId,
          }),
        }
      );

      const paymentData = await paymentResponse
        .json()
        .catch(() => null);

      if (!paymentResponse.ok) {
        if (paymentResponse.status === 401) {
          setError(
            "Your session has expired. Please sign in again."
          );

          setTimeout(() => {
            router.push("/login");
          }, 1500);

          return;
        }

        throw new Error(
          paymentData?.error ||
            "Order was created, but the secure payment checkout could not be opened."
        );
      }

      const checkoutUrl =
        typeof paymentData?.checkoutUrl === "string"
          ? paymentData.checkoutUrl.trim()
          : "";

      if (!checkoutUrl) {
        throw new Error(
          "Payment checkout URL was not returned."
        );
      }

      /*
        Clear the local cart only after both:
        1. the order is created in Supabase
        2. Lemon Squeezy checkout is created
      */
      clearCart();

      /*
        Use a full browser navigation because
        Lemon Squeezy checkout is an external URL.
      */
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      console.error(
        "CHECKOUT_ERROR:",
        checkoutError
      );

      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Something went wrong while creating your order."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="mx-auto max-w-4xl px-6 py-24">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10 text-3xl">
              🛒
            </div>

            <h1 className="mt-6 text-3xl font-bold">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-md text-white/50">
              Add at least one digital product
              before proceeding to checkout.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-block rounded-xl bg-emerald-400 px-7 py-4 font-semibold text-black transition hover:bg-emerald-300"
            >
              Browse Products
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-medium text-emerald-400">
            Secure Checkout
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Complete Your Purchase
          </h1>

          <p className="mt-4 max-w-2xl text-white/50">
            Enter your details and review your
            order before payment.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleCheckout}
        className="mx-auto max-w-7xl px-6 py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            {/* Customer Information */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-black">
                  1
                </div>

                <div>
                  <p className="text-sm text-emerald-400">
                    Customer Details
                  </p>

                  <h2 className="text-2xl font-bold">
                    Contact Information
                  </h2>
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    First Name
                  </label>

                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(
                        event.target.value
                      )
                    }
                    placeholder="Your first name"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Last Name
                  </label>

                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(event) =>
                      setLastName(
                        event.target.value
                      )
                    }
                    placeholder="Your last name"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-white/60">
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                  />

                  <p className="mt-2 text-xs text-white/30">
                    Download access and order
                    confirmation will be sent here.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-white/60">
                    Country
                  </label>

                  <select
                    value={country}
                    onChange={(event) =>
                      setCountry(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-emerald-400/50"
                  >
                    <option>Pakistan</option>
                    <option>
                      United States
                    </option>
                    <option>
                      United Kingdom
                    </option>
                    <option>
                      United Arab Emirates
                    </option>
                    <option>
                      Saudi Arabia
                    </option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-black">
                  2
                </div>

                <div>
                  <p className="text-sm text-emerald-400">
                    Payment
                  </p>

                  <h2 className="text-2xl font-bold">
                    Secure Online Payment
                  </h2>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Lemon Squeezy Checkout
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/45">
                      After your order is created, you will be
                      redirected to Lemon Squeezy&apos;s secure
                      checkout to complete the payment.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Secure
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/30">
                Your download access will only be enabled after
                the payment is confirmed.
              </p>
            </section>

            {/* Billing */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-black">
                  3
                </div>

                <div>
                  <p className="text-sm text-emerald-400">
                    Billing
                  </p>

                  <h2 className="text-2xl font-bold">
                    Billing Information
                  </h2>
                </div>
              </div>

              <div className="mt-8 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Address
                  </label>

                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="Street address"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      City
                    </label>

                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(event) =>
                        setCity(
                          event.target.value
                        )
                      }
                      placeholder="City"
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      Postal Code
                    </label>

                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(event) =>
                        setPostalCode(
                          event.target.value
                        )
                      }
                      placeholder="Postal code"
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/50"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDE */}
          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-28">
            <p className="text-sm font-medium text-emerald-400">
              Order Summary
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Review Your Order
            </h2>

            <div className="mt-7 space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-white/10 pb-5"
                >
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-black text-emerald-400">
                    ✦
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-emerald-400">
                      {item.category}
                    </p>

                    <p className="mt-1 truncate font-medium">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold">
                    $
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>

              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>

                <span>
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-white/50">
                <span>
                  Digital Delivery
                </span>

                <span className="text-emerald-400">
                  Free
                </span>
              </div>

              <div className="flex justify-between text-white/50">
                <span>Service Fee</span>

                <span>
                  ${serviceFee.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
              <span className="text-white/50">
                Total
              </span>

              <span className="text-3xl font-bold">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 w-full rounded-xl bg-emerald-400 px-6 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Opening Secure Payment..."
                : `Pay Securely — $${grandTotal.toFixed(
                    2
                  )}`}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-white/30">
              By completing your purchase, you
              agree to ZonixAssets&apos; terms and
              digital product policies.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black p-3 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Secure
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Checkout
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black p-3 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Verified
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Server Pricing
                </p>
              </div>
            </div>

            <Link
              href="/cart"
              className="mt-5 block text-center text-sm text-white/40 transition hover:text-white"
            >
              ← Back to Cart
            </Link>
          </aside>
        </div>
      </form>

      <Footer />
    </main>
  );
}