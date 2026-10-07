"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

export type ProductReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewer_name: string;
  verified_purchase: boolean;
  created_at: string;
};

type ProductReviewsProps = {
  productId: string;
  initialReviews: ProductReview[];
};

function StarRow({
  value,
  interactive = false,
  onChange,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={interactive ? "Choose rating" : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`text-2xl leading-none transition ${
              star <= value ? "text-amber-400" : "text-slate-300"
            } hover:scale-110`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ) : (
          <span
            key={star}
            className={star <= Math.round(value) ? "text-amber-400" : "text-slate-300"}
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

export default function ProductReviews({
  productId,
  initialReviews,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  async function refreshReviews() {
    const response = await fetch(
      `/api/reviews?productId=${encodeURIComponent(productId)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (response.ok && Array.isArray(data?.reviews)) {
      setReviews(data.reviews);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          title,
          body,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save your review.");
      }

      setMessage(
        data?.message || "Thanks — your verified purchase review is live."
      );
      setTitle("");
      setBody("");
      setRating(5);
      await refreshReviews();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save your review."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[.86fr_1.14fr]">
          <div className="border-b border-slate-200 bg-[#f8fafc] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
              Customer Reviews
            </p>

            {reviews.length > 0 ? (
              <>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-black tracking-tight text-[#0b1025]">
                    {average.toFixed(1)}
                  </span>
                  <span className="pb-1 text-sm font-bold text-slate-500">
                    / 5
                  </span>
                </div>

                <div className="mt-3">
                  <StarRow value={average} />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Based on {reviews.length} verified purchase
                  {reviews.length === 1 ? " review" : " reviews"}.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0b1025]">
                  No customer reviews yet.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ratings only appear after a real buyer purchases this product
                  and submits a review.
                </p>
              </>
            )}

            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-800">
                Verified purchase only
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                ZonixAssets checks the account&apos;s paid order history before
                accepting a product review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="text-sm font-black text-[#0b1025]">
                  Your rating
                </label>
                <div className="mt-2">
                  <StarRow value={rating} interactive onChange={setRating} />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-[#0b1025]">
                  Review title <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={100}
                  placeholder="What stood out?"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#0b1025]">
                  Your review
                </label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  minLength={10}
                  maxLength={1200}
                  required
                  rows={5}
                  placeholder="Share your experience with the product..."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {message && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  {message}
                </p>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <p>{error}</p>
                  {error.toLowerCase().includes("sign in") && (
                    <Link
                      href="/login"
                      className="mt-2 inline-flex font-black underline underline-offset-2"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#0b1025] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff6b00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving review..." : "Submit verified review"}
              </button>
            </form>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                  Buyer Feedback
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0b1025] sm:text-3xl">
                  Reviews from real customers.
                </h2>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-[#f8fafc] p-8 text-center">
                <p className="text-base font-black text-[#0b1025]">
                  Be the first verified buyer to review this product.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  No rating or review count is shown until genuine feedback exists.
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#0b1025]">
                            {review.reviewer_name}
                          </p>
                          {review.verified_purchase && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700">
                              Verified purchase
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <StarRow value={review.rating} />
                        </div>
                      </div>

                      <time
                        className="text-xs font-semibold text-slate-400"
                        dateTime={review.created_at}
                      >
                        {new Intl.DateTimeFormat("en", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(review.created_at))}
                      </time>
                    </div>

                    {review.title && (
                      <h3 className="mt-4 text-base font-black text-[#0b1025]">
                        {review.title}
                      </h3>
                    )}

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {review.body}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
