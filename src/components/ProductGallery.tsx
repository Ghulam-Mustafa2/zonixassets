"use client";

import { useEffect, useMemo, useState } from "react";

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
        .map((image) => image?.trim())
        .filter(
          (image, index, list): image is string =>
            Boolean(image) && list.indexOf(image) === index
        )
        .slice(0, 3),
    [images]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages([]);
    setLightboxOpen(false);
  }, [images]);

  const availableImages = cleanImages.filter(
    (image) => !failedImages.includes(image)
  );

  const activeImage =
    availableImages[activeIndex] ||
    availableImages[0] ||
    null;

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowLeft" && availableImages.length > 1) {
        setActiveIndex((current) =>
          current <= 0 ? availableImages.length - 1 : current - 1
        );
      }

      if (event.key === "ArrowRight" && availableImages.length > 1) {
        setActiveIndex((current) =>
          current >= availableImages.length - 1 ? 0 : current + 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, availableImages.length]);

  function selectImage(index: number) {
    if (!availableImages[index]) return;

    setActiveIndex(index);
  }

  function handleImageError(image: string) {
    setFailedImages((current) =>
      current.includes(image)
        ? current
        : [...current, image]
    );

    setActiveIndex(0);
  }

  return (
    <div className="space-y-4">
      {/* Main preview */}
      <div className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6b00] shadow-sm backdrop-blur-md sm:left-5 sm:top-5">
          Product Preview
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f6fa]">
          {activeImage ? (
            <>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Open ${title} preview ${activeIndex + 1} fullscreen`}
                className="absolute inset-0 z-10 cursor-zoom-in"
              >
                <img
                  src={activeImage}
                  alt={`${title} preview ${activeIndex + 1}`}
                  onError={() =>
                    handleImageError(activeImage)
                  }
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />
              </button>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071027]/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

              <div className="pointer-events-none absolute bottom-4 right-4 translate-y-2 rounded-xl border border-white/40 bg-[#071027]/85 px-3 py-2 text-[10px] font-bold text-white opacity-0 shadow-lg backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Click to enlarge
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.12),_transparent_38%),linear-gradient(135deg,#f8fafc,#eef2f7)] px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-orange-200 bg-orange-50 text-3xl text-[#ff6b00] shadow-sm">
                  ✦
                </div>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                  Digital Asset
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#071027] sm:text-3xl">
                  {title}
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Product preview images will appear here
                  when they are added from the admin panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail gallery */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((index) => {
          const image = availableImages[index];

          if (!image) {
            return (
              <div
                key={`empty-${index}`}
                className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-[#f8fafc]"
              >
                <div className="text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm text-slate-300 shadow-sm">
                    +
                  </div>

                  <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-300">
                    Preview
                  </span>
                </div>
              </div>
            );
          }

          const isActive = activeIndex === index;

          return (
            <button
              key={image}
              type="button"
              onClick={() => selectImage(index)}
              aria-label={`Show ${title} preview ${index + 1}`}
              aria-pressed={isActive}
              className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-white text-left shadow-sm outline-none transition-all duration-300 ${
                isActive
                  ? "border-[#ff6b00] ring-2 ring-[#ff6b00]/15"
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-[#ff6b00]/50 hover:shadow-md"
              }`}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                onError={() => handleImageError(image)}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071027]/90 via-[#071027]/40 to-transparent px-2.5 pb-2 pt-8 transition-opacity ${
                  isActive
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  {index === 0
                    ? "Main Preview"
                    : `Preview ${index + 1}`}
                </span>
              </div>

              {isActive && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6b00] text-[11px] font-black text-white shadow-md">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gallery info */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-[#071027]">
            Product gallery
          </p>

          <p className="mt-0.5 text-[11px] text-slate-500">
            Choose a preview, then click the main image to enlarge it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {availableImages.length > 0
              ? `${availableImages.length} preview${
                  availableImages.length === 1 ? "" : "s"
                }`
              : "Preview pending"}
          </span>
        </div>
      </div>

      {lightboxOpen && activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image preview`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050816]/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image preview"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl font-light text-white transition hover:bg-white/20 sm:right-7 sm:top-7"
          >
            ×
          </button>

          <div
            className="relative flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex max-h-[78vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-2xl">
              <img
                src={activeImage}
                alt={`${title} enlarged preview ${activeIndex + 1}`}
                className="max-h-[78vh] max-w-full object-contain"
              />

              {availableImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((current) =>
                        current <= 0
                          ? availableImages.length - 1
                          : current - 1
                      )
                    }
                    aria-label="Previous preview"
                    className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#071027]/75 text-xl font-black text-white shadow-lg transition hover:bg-[#ff6b00] sm:left-5"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((current) =>
                        current >= availableImages.length - 1
                          ? 0
                          : current + 1
                      )
                    }
                    aria-label="Next preview"
                    className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#071027]/75 text-xl font-black text-white shadow-lg transition hover:bg-[#ff6b00] sm:right-5"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {availableImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show enlarged preview ${index + 1}`}
                  aria-pressed={activeIndex === index}
                  className={`h-16 w-20 overflow-hidden rounded-xl border transition sm:h-20 sm:w-24 ${
                    activeIndex === index
                      ? "border-[#ff6b00] ring-2 ring-[#ff6b00]/30"
                      : "border-white/15 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            <p className="text-center text-xs font-semibold text-white/60">
              Preview {activeIndex + 1} of {availableImages.length} · Use arrow
              keys to browse and Esc to close.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}