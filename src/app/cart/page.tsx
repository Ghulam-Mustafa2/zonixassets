"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  } = useCart();

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#0b1025]">
      <Navbar />

      {/* Page Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                Shopping Cart
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Your digital products.
              </h1>

              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                {cartCount} {cartCount === 1 ? "item" : "items"} ready for
                checkout.
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="w-fit rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                Clear cart
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {cart.length === 0 ? (
          /* Empty Cart */
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center sm:py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#fff4ea] text-4xl">
                🛒
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                Your cart
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Your cart is empty.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                Browse Zonix Assets and add premium digital products,
                templates, graphics, UI kits and tools to your cart.
              </p>

              <Link
                href="/products"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#ff6b00] px-7 font-bold text-white shadow-[0_12px_30px_rgba(255,107,0,0.20)] transition hover:bg-[#ea6200]"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
            {/* Cart Products */}
            <div>
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                  Your Selection
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Products in your cart
                </h2>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="grid sm:grid-cols-[170px_1fr]">
                      {/* Preview */}
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative flex min-h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff4ea] via-white to-[#eef3f8] sm:min-h-full"
                      >
                        <div className="absolute h-28 w-28 rounded-full bg-[#ff6b00]/10 blur-3xl" />

                        <div className="relative text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-white text-2xl text-[#ff6b00] shadow-sm">
                            ✦
                          </div>

                          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Digital Product
                          </p>
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#ff6b00]">
                              {item.category || "Digital Product"}
                            </p>

                            <Link
                              href={`/products/${item.slug}`}
                              className="mt-2 block"
                            >
                              <h3 className="text-xl font-black tracking-tight transition hover:text-[#ff6b00] sm:text-2xl">
                                {item.title}
                              </h3>
                            </Link>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              Instant digital access from your Zonix Assets
                              account after payment confirmation.
                            </p>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Price
                            </p>

                            <p className="mt-1 text-2xl font-black">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="w-fit text-sm font-bold text-red-500 transition hover:text-red-600"
                          >
                            Remove
                          </button>

                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Quantity
                            </span>

                            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-[#f8fafc]">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-slate-500 transition hover:bg-white hover:text-[#ff6b00]"
                                aria-label={`Decrease ${item.title} quantity`}
                              >
                                −
                              </button>

                              <span className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 bg-white text-sm font-black">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => increaseQuantity(item.id)}
                                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-slate-500 transition hover:bg-white hover:text-[#ff6b00]"
                                aria-label={`Increase ${item.title} quantity`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Digital Product Notice */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <TrustCard
                  icon="↓"
                  title="Instant"
                  text="Digital access"
                />
                <TrustCard
                  icon="✓"
                  title="Secure"
                  text="Checkout"
                />
                <TrustCard
                  icon="⌂"
                  title="Account"
                  text="Downloads"
                />
              </div>
            </div>

            {/* Order Summary */}
            <aside className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-28">
              <div className="bg-[#111936] px-6 py-7 text-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff8a38]">
                  Order Summary
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Ready to checkout?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Review your order before continuing to secure payment.
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4 border-b border-slate-200 pb-6 text-sm">
                  <SummaryRow label="Items" value={String(cartCount)} />

                  <SummaryRow
                    label="Subtotal"
                    value={`$${cartTotal.toFixed(2)}`}
                  />

                  <SummaryRow label="Shipping" value="Not required" accent />

                  <SummaryRow label="Digital delivery" value="Included" accent />
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Total
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      One-time payment
                    </p>
                  </div>

                  <span className="text-3xl font-black tracking-tight">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-7 flex min-h-14 w-full items-center justify-center rounded-xl bg-[#ff6b00] px-6 text-center font-black text-white shadow-[0_12px_30px_rgba(255,107,0,0.22)] transition hover:bg-[#ea6200]"
                >
                  Proceed to Checkout →
                </Link>

                <Link
                  href="/products"
                  className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-[#f8fafc] px-6 text-center text-sm font-bold transition hover:border-slate-300 hover:bg-white"
                >
                  Continue Shopping
                </Link>

                {/* Security Area */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Secure checkout
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your payment is handled through the configured secure
                        payment provider.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-orange-100 bg-[#fff8f1] p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6b00] shadow-sm">
                      ↓
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Download after payment
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Purchased files unlock inside your account after
                        payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff4ea] font-black text-[#ff6b00]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>

      <span
        className={
          accent
            ? "text-right font-bold text-emerald-600"
            : "text-right font-bold text-[#0b1025]"
        }
      >
        {value}
      </span>
    </div>
  );
}