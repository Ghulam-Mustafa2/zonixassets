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
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-medium text-emerald-400">
            Your Shopping Cart
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Cart
              </h1>

              <p className="mt-3 text-white/50">
                {cartCount}{" "}
                {cartCount === 1 ? "item" : "items"} in your
                cart
              </p>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="w-fit text-sm text-red-400 transition hover:text-red-300"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {cart.length === 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10 text-3xl">
              🛒
            </div>

            <h2 className="mt-6 text-3xl font-bold">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-white/50">
              Explore PakStore and add premium digital products
              to your cart.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-block rounded-xl bg-emerald-400 px-7 py-4 font-semibold text-black transition hover:bg-emerald-300"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Cart Items */}
            <div className="space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center"
                >
                  {/* Product Preview */}
                  <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-black sm:w-40">
                    <span className="text-2xl text-emerald-400">
                      ✦
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">
                      {item.category}
                    </p>

                    <Link
                      href={`/products/${item.slug}`}
                      className="mt-1 block"
                    >
                      <h2 className="text-xl font-semibold transition hover:text-emerald-300">
                        {item.title}
                      </h2>
                    </Link>

                    <p className="mt-2 text-sm text-white/40">
                      Instant digital access after purchase.
                    </p>

                    <button
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                      className="mt-4 text-sm text-red-400 transition hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
                    <p className="text-xl font-bold">
                      $
                      {(
                        item.price * item.quantity
                      ).toFixed(2)}
                    </p>

                    <div className="flex items-center rounded-xl border border-white/10 bg-black">
                      <button
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        className="px-4 py-2 text-lg text-white/60 transition hover:text-white"
                      >
                        −
                      </button>

                      <span className="min-w-10 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        className="px-4 py-2 text-lg text-white/60 transition hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-28">
              <p className="text-sm font-medium text-emerald-400">
                Order Summary
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Your Order
              </h2>

              <div className="mt-7 space-y-4 border-b border-white/10 pb-6 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Items</span>
                  <span>{cartCount}</span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span>Delivery</span>
                  <span className="text-emerald-400">
                    Free
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <span className="text-white/50">
                  Total
                </span>

                <span className="text-3xl font-bold">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-7 block w-full rounded-xl bg-emerald-400 px-6 py-4 text-center font-semibold text-black transition hover:bg-emerald-300"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 block w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-medium transition hover:bg-white/10"
              >
                Continue Shopping
              </Link>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
                <p className="text-sm font-medium">
                  Secure Checkout
                </p>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Payments will be processed securely when
                  checkout integration is connected.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}