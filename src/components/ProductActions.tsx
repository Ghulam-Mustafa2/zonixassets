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
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={added}
        className="rounded-xl bg-emerald-400 px-6 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-default disabled:bg-emerald-300"
      >
        {added ? "Added to Cart ✓" : "Add to Cart"}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={buying}
        className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
      >
        {buying ? "Opening Checkout..." : "Buy Now"}
      </button>
    </div>
  );
}