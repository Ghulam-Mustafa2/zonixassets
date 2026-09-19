"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type ProductActionsProps = {
  product: {
    id: string;
    slug: string;
    title: string;
    category: string;
    price: number;
  };
};

export default function ProductActions({
  product,
}: ProductActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  function handleAddToCart() {
    addToCart(product);

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  function handleBuyNow() {
    setBuying(true);

    addToCart(product);

    router.push("/checkout");
  }

  return (
    <div className="mt-8 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={added}
          className="
            group relative overflow-hidden rounded-xl
            bg-[#ff6b00] px-6 py-4
            text-sm font-black text-white
            shadow-[0_12px_30px_rgba(255,107,0,0.22)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:bg-[#f25f00]
            hover:shadow-[0_16px_34px_rgba(255,107,0,0.28)]
            active:translate-y-0
            disabled:cursor-default disabled:bg-[#ff8a3d]
            disabled:hover:translate-y-0
          "
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {added ? (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs"
                >
                  ✓
                </span>
                Added to Cart
              </>
            ) : (
              <>
                <span aria-hidden="true" className="text-base">
                  🛒
                </span>
                Add to Cart
              </>
            )}
          </span>

          <span
            aria-hidden="true"
            className="
              absolute inset-y-0 -left-1/3 w-1/3
              skew-x-[-18deg] bg-white/15
              transition-all duration-500
              group-hover:left-[115%]
            "
          />
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buying}
          className="
            rounded-xl border border-[#24304f]
            bg-[#111a3a] px-6 py-4
            text-sm font-black text-white
            shadow-[0_10px_24px_rgba(15,23,42,0.14)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:border-[#ff6b00]
            hover:bg-[#182349]
            hover:shadow-[0_14px_28px_rgba(15,23,42,0.18)]
            active:translate-y-0
            disabled:cursor-wait disabled:opacity-60
            disabled:hover:translate-y-0
          "
        >
          <span className="flex items-center justify-center gap-2">
            {buying ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
                Opening Checkout...
              </>
            ) : (
              <>
                <span aria-hidden="true" className="text-base">
                  ⚡
                </span>
                Buy Now
              </>
            )}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-500 sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] text-emerald-600"
          >
            ✓
          </span>
          Secure checkout
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-[10px] text-[#ff6b00]"
          >
            ↓
          </span>
          Instant digital access
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-700"
          >
            ⌁
          </span>
          Account delivery
        </span>
      </div>
    </div>
  );
}
