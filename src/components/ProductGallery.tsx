"use client";

import { useMemo, useState } from "react";

type ProductGalleryProps = {
  title: string;
  images: string[];
};

export default function ProductGallery({
  title,
  images,
}: ProductGalleryProps) {
  const cleanImages = useMemo(
    () =>
      images
        .map((image) => image.trim())
        .filter(
          (image, index, list) =>
            Boolean(image) &&
            list.indexOf(image) === index
        )
        .slice(0, 3),
    [images]
  );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const activeImage =
    cleanImages[activeIndex] ||
    cleanImages[0] ||
    null;

  function selectImage(index: number) {
    if (!cleanImages[index]) {
      return;
    }

    setActiveIndex(index);
  }

  return (
    <div>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-black">
        <div className="absolute h-72 w-72 rounded-full bg-emerald-400/20 blur-[100px]" />

        {activeImage ? (
          <img
            src={activeImage}
            alt={`${title} preview ${activeIndex + 1}`}
            className="relative h-full w-full object-cover"
          />
        ) : (
          <div className="relative text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10 text-3xl text-emerald-400">
              ✦
            </div>

            <p className="text-sm text-white/30">
              Product Preview
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              {title}
            </h2>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => {
          const image =
            cleanImages[index];

          if (!image) {
            return (
              <div
                key={index}
                className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white/20"
              >
                No preview
              </div>
            );
          }

          const isActive =
            activeIndex === index;

          return (
            <button
              key={image}
              type="button"
              onClick={() =>
                selectImage(index)
              }
              className={`group relative overflow-hidden rounded-2xl border bg-white/[0.03] text-left transition ${
                isActive
                  ? "border-emerald-400 ring-2 ring-emerald-400/20"
                  : "border-white/10 hover:border-emerald-400/40"
              }`}
              aria-label={`Show ${title} preview ${index + 1}`}
              aria-pressed={isActive}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                className="aspect-video h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur">
                {index === 0
                  ? "Main"
                  : `Preview ${index + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
