"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const labelClass =
  "mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500";

export default function CheckoutPage() {
  const router = useRouter();

  const { cart, cartCount, cartTotal, clearCart } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Pakistan");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const serviceFee = 0;
  const grandTotal = cartTotal + serviceFee;

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please enter your first name, last name and email.");
      return;
    }

    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      setError("Please complete your billing information.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const response = await fetch("/api/orders/create", {
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
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please sign in again.");

          setTimeout(() => {
            router.push("/login");
          }, 1500);

          return;
        }

        throw new Error(data?.error || "Unable to create your order.");
      }

      const createdOrderId = data?.order?.id;

      if (!createdOrderId) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      setSuccess("Order created. Opening secure payment...");

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

      const paymentData = await paymentResponse.json().catch(() => null);

      if (!paymentResponse.ok) {
        if (paymentResponse.status === 401) {
          setError("Your session has expired. Please sign in again.");

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
        throw new Error("Payment checkout URL was not returned.");
      }

      clearCart();
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      console.error("CHECKOUT_ERROR:", checkoutError);

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
      <main className="min-h-screen bg-[#f6f7fb] text-[#0b1025]">
        <Navbar />

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="bg-[#0b1537] px-6 py-10 text-center text-white sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-3xl">
                🛒
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                Secure Checkout
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Your cart is empty
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/65">
                Add at least one digital product before proceeding to
                secure checkout.
              </p>
            </div>

            <div className="px-6 py-8 text-center sm:px-10">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ff6b00] px-7 font-black text-white shadow-[0_12px_30px_rgba(255,107,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ea6200]"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#0b1025]">
      <Navbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6b00]">
                Secure Checkout
              </p>

              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Complete your purchase securely.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Confirm your customer details, review your order and
                continue to Lemon Squeezy for protected payment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 sm:min-w-[360px] sm:text-xs">
              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-3 py-4">
                <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </span>
                Secure
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-3 py-4">
                <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-[#ff6b00]">
                  ↓
                </span>
                Instant
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-3 py-4">
                <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#0b1537]">
                  ⌂
                </span>
                Account
              </div>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleCheckout}
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_410px] xl:grid-cols-[1fr_430px]">
          <div className="space-y-7">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
              <SectionHeading
                number="01"
                eyebrow="Customer details"
                title="Contact information"
                description="We use these details for your order and digital access."
              />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Your first name"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Your last name"
                    className={fieldClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={fieldClass}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Order confirmation and download access are connected
                    to this email and your Zonix Assets account.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Country</label>
                  <select
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className={fieldClass}
                  >
                    <option>Pakistan</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>United Arab Emirates</option>
                    <option>Saudi Arabia</option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="p-5 sm:p-8">
                <SectionHeading
                  number="02"
                  eyebrow="Secure payment"
                  title="Protected online checkout"
                  description="Your order is created here, then payment is completed on Lemon Squeezy."
                />
              </div>

              <div className="grid lg:grid-cols-[1fr_300px]">
                <div className="border-t border-slate-200 p-5 sm:p-8 lg:border-r">
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff6b00] font-black text-white">
                        ✓
                      </div>

                      <div>
                        <p className="font-black text-[#0b1025]">
                          Lemon Squeezy secure checkout
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          After your order is created, you will be
                          redirected to Lemon Squeezy&apos;s hosted
                          checkout to complete payment safely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <TrustMiniCard title="Server pricing" text="Verified" />
                    <TrustMiniCard title="Digital delivery" text="Included" />
                    <TrustMiniCard title="Shipping" text="Not required" />
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-[#0b1537] p-5 text-white sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                    Payment methods
                  </p>

                  <p className="mt-2 text-lg font-black">
                    Trusted checkout
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="flex h-20 items-center justify-center rounded-2xl bg-white p-4">
                      <img
                        src="/payments/visa-mastercard.png"
                        alt="Visa and Mastercard"
                        className="max-h-10 max-w-full object-contain"
                      />
                    </div>

                    <div className="flex h-20 items-center justify-center rounded-2xl bg-white p-4">
                      <img
                        src="/payments/lemon-squeezy.jpeg"
                        alt="Lemon Squeezy"
                        className="max-h-10 max-w-full object-contain"
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-white/55">
                    Zonix Assets does not store your card details.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
              <SectionHeading
                number="03"
                eyebrow="Billing information"
                title="Billing details"
                description="These details are attached to your order record."
              />

              <div className="mt-8 grid gap-5">
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    required
                    autoComplete="street-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Street address"
                    className={fieldClass}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="City"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Postal Code</label>
                    <input
                      type="text"
                      required
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      placeholder="Postal code"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <CheckoutBenefit
                icon="✓"
                title="Secure checkout"
                text="Protected payment flow"
              />
              <CheckoutBenefit
                icon="↓"
                title="Instant access"
                text="Files unlock after payment"
              />
              <CheckoutBenefit
                icon="⌂"
                title="Account delivery"
                text="Downloads stay in your account"
              />
            </section>
          </div>

          <aside className="h-fit overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:sticky lg:top-28">
            <div className="bg-[#0b1537] p-6 text-white sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                Order Summary
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Review your order
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Check your products and total before opening secure
                payment.
              </p>
            </div>

            <div className="p-6 sm:p-7">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-lg text-[#ff6b00]">
                        ✦
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6b00]">
                          {item.category}
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-[#0b1025]">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p className="text-sm font-black text-[#0b1025]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-sm">
                <SummaryRow label="Items" value={String(cartCount)} />
                <SummaryRow
                  label="Subtotal"
                  value={`$${cartTotal.toFixed(2)}`}
                />
                <SummaryRow
                  label="Shipping"
                  value="Not required"
                  positive
                />
                <SummaryRow
                  label="Digital delivery"
                  value="Included"
                  positive
                />
                <SummaryRow
                  label="Service fee"
                  value={`$${serviceFee.toFixed(2)}`}
                />
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-slate-200 pt-6">
                <div>
                  <p className="text-sm font-bold text-slate-500">Total</p>
                  <p className="mt-1 text-xs text-slate-400">
                    One-time payment
                  </p>
                </div>

                <span className="text-3xl font-black tracking-tight text-[#0b1025]">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#ff6b00] px-5 text-center font-black text-white shadow-[0_14px_35px_rgba(255,107,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ea6200] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting
                  ? "Opening Secure Payment..."
                  : `Pay Securely — $${grandTotal.toFixed(2)}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </span>
                Protected checkout
              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                By completing your purchase, you agree to Zonix
                Assets&apos; terms and digital product policies.
              </p>

              <Link
                href="/cart"
                className="mt-5 block rounded-2xl border border-slate-200 bg-[#f8fafc] px-5 py-3.5 text-center text-sm font-black text-[#0b1025] transition hover:border-orange-200 hover:bg-orange-50"
              >
                ← Back to Cart
              </Link>
            </div>
          </aside>
        </div>
      </form>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                Digital purchase
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Payment confirmed first. Download access second.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Your product files become available in your Zonix
                Assets account only after successful payment
                confirmation. No physical shipping is required.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-xs font-black text-slate-600">
                Secure payment
              </span>
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-xs font-black text-slate-600">
                Account downloads
              </span>
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-xs font-black text-slate-600">
                No shipping
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-black text-[#ff6b00]">
        {number}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0b1025]">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function TrustMiniCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
      <p className="text-xs font-black text-[#0b1025]">{title}</p>
      <p className="mt-1 text-[11px] text-slate-500">{text}</p>
    </div>
  );
}

function CheckoutBenefit({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-black text-[#ff6b00]">
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-[#0b1025]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          positive
            ? "text-right font-black text-emerald-600"
            : "text-right font-black text-[#0b1025]"
        }
      >
        {value}
      </span>
    </div>
  );
}
