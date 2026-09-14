"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type SiteSettings = {
  id?: string;
  site_name: string;
  logo_url: string | null;
  tagline: string | null;
  homepage_heading: string | null;
  homepage_subheading: string | null;
  homepage_primary_button_text: string | null;
  homepage_primary_button_url: string | null;
  footer_text: string | null;
};

type HomepageSettings = {
  id?: string;
  featured_products_enabled: boolean;
  featured_products_title: string;
  featured_products_subtitle: string | null;
  featured_products_limit: number;
  featured_products_auto_scroll: boolean;
  featured_products_scroll_speed: number;
  offers_enabled: boolean;
  promotion_banner_enabled: boolean;
  categories_title: string;
  categories_subtitle: string | null;
};

type SocialLink = {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  icon_key: string | null;
  is_visible: boolean;
  sort_order: number;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  badge_text: string | null;
  discount_text: string | null;
  coupon_code: string | null;
  button_text: string | null;
  button_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
};

type PromotionBanner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  target_url: string | null;
  open_in_new_tab: boolean;
  is_active: boolean;
  sort_order: number;
};

type SettingsResponse = {
  success: boolean;
  site: SiteSettings | null;
  homepage: HomepageSettings | null;
  socialLinks: SocialLink[];
  offers: Offer[];
  promotionBanners: PromotionBanner[];
  error?: string;
  code?: string;
};

const defaultSite: SiteSettings = {
  site_name: "PakStore",
  logo_url: "",
  tagline: "Your digital marketplace",
  homepage_heading:
    "Discover digital products built for creators.",
  homepage_subheading:
    "Browse premium digital products, tools and resources.",
  homepage_primary_button_text:
    "Browse Store",
  homepage_primary_button_url:
    "/products",
  footer_text:
    "© PakStore. All rights reserved.",
};

const defaultHomepage: HomepageSettings = {
  featured_products_enabled: true,
  featured_products_title:
    "Featured Products",
  featured_products_subtitle:
    "Popular products available right now.",
  featured_products_limit: 10,
  featured_products_auto_scroll: true,
  featured_products_scroll_speed: 35,
  offers_enabled: true,
  promotion_banner_enabled: true,
  categories_title:
    "Popular Categories",
  categories_subtitle:
    "Browse Collections",
};

function inputClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40";
}

function textareaClass() {
  return `${inputClass()} min-h-28 resize-y`;
}

function toDatetimeLocal(
  value: string | null
) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const local =
    new Date(
      date.getTime() -
        date.getTimezoneOffset() *
          60_000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function fromDatetimeLocal(
  value: string
) {
  if (!value) return null;

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

export default function AdminSiteSettings() {
  const router = useRouter();

  const [site, setSite] =
    useState<SiteSettings>(
      defaultSite
    );

  const [homepage, setHomepage] =
    useState<HomepageSettings>(
      defaultHomepage
    );

  const [socialLinks, setSocialLinks] =
    useState<SocialLink[]>([]);

  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [
    promotionBanners,
    setPromotionBanners,
  ] = useState<PromotionBanner[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [newSocial, setNewSocial] =
    useState({
      platform: "",
      label: "",
      url: "",
      icon_key: "",
      is_visible: true,
      sort_order: 0,
    });

  const [newOffer, setNewOffer] =
    useState({
      title: "",
      description: "",
      badge_text: "",
      discount_text: "",
      coupon_code: "",
      button_text: "",
      button_url: "",
      starts_at: "",
      ends_at: "",
      is_active: false,
      sort_order: 0,
    });

  const [newBanner, setNewBanner] =
    useState({
      title: "",
      description: "",
      image_url: "",
      button_text: "",
      target_url: "",
      open_in_new_tab: true,
      is_active: false,
      sort_order: 0,
    });

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/site-settings",
          {
            method: "GET",
            credentials:
              "include",
            cache:
              "no-store",
          }
        );

      const result =
        (await response.json()) as
          Partial<SettingsResponse>;

      if (
        response.status === 401
      ) {
        router.replace(
          "/login"
        );
        return;
      }

      if (
        response.status === 403
      ) {
        if (
          result.code ===
          "ACCOUNT_SUSPENDED"
        ) {
          router.replace(
            "/login"
          );
        } else {
          router.replace(
            "/account"
          );
        }
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load site settings."
        );
      }

      setSite(
        result.site
          ? {
              ...defaultSite,
              ...result.site,
            }
          : defaultSite
      );

      setHomepage(
        result.homepage
          ? {
              ...defaultHomepage,
              ...result.homepage,
            }
          : defaultHomepage
      );

      setSocialLinks(
        result.socialLinks || []
      );

      setOffers(
        result.offers || []
      );

      setPromotionBanners(
        result.promotionBanners ||
          []
      );
    } catch (loadError) {
      console.error(
        "ADMIN_SITE_SETTINGS_UI_LOAD_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load site settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function requestJson(
    input: RequestInfo,
    init: RequestInit
  ) {
    const response =
      await fetch(
        input,
        {
          ...init,
          credentials:
            "include",
          headers: {
            "Content-Type":
              "application/json",
            ...(init.headers ||
              {}),
          },
        }
      );

    const result =
      await response.json();

    if (
      response.status === 401
    ) {
      router.replace(
        "/login"
      );
      throw new Error(
        "Session expired."
      );
    }

    if (
      response.status === 403
    ) {
      if (
        result.code ===
        "ACCOUNT_SUSPENDED"
      ) {
        router.replace(
          "/login"
        );
      }

      throw new Error(
        result.error ||
          "Permission denied."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Request failed."
      );
    }

    return result;
  }

  async function saveSingleton(
    section:
      | "site"
      | "homepage",
    data: unknown
  ) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await requestJson(
        "/api/admin/site-settings",
        {
          method: "PATCH",
          body:
            JSON.stringify({
              section,
              data,
            }),
        }
      );

      setSuccess(
        section === "site"
          ? "Site settings saved successfully."
          : "Homepage settings saved successfully."
      );

      await loadSettings();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createRecord(
    section:
      | "social"
      | "offer"
      | "banner",
    data: unknown
  ) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await requestJson(
        "/api/admin/site-settings",
        {
          method: "POST",
          body:
            JSON.stringify({
              section,
              data,
            }),
        }
      );

      setSuccess(
        "Record created successfully."
      );

      await loadSettings();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateRecord(
    section:
      | "social"
      | "offer"
      | "banner",
    id: string,
    data: unknown
  ) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await requestJson(
        "/api/admin/site-settings",
        {
          method: "PATCH",
          body:
            JSON.stringify({
              section,
              id,
              data,
            }),
        }
      );

      setSuccess(
        "Record updated successfully."
      );

      await loadSettings();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(
    section:
      | "social"
      | "offer"
      | "banner",
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Delete this record permanently?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await requestJson(
        `/api/admin/site-settings?section=${encodeURIComponent(
          section
        )}&id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Record deleted successfully."
      );

      await loadSettings();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete record."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-center text-white/50">
        Loading site settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold"
            >
              Pak
              <span className="text-emerald-400">
                Store
              </span>
            </Link>

            <p className="mt-1 text-xs text-white/35">
              Site Settings & Marketing
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/products"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Products
            </Link>

            <Link
              href="/admin/analytics"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Analytics
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section>
          <p className="text-sm text-emerald-400">
            CMS
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Site Settings
          </h1>

          <p className="mt-3 max-w-3xl text-white/45">
            Manage your brand, homepage,
            social links, offers and
            promotional banners from one
            place.
          </p>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-300">
            {success}
          </div>
        )}

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <SectionHeading
            eyebrow="Brand"
            title="Website Identity"
            description="Control the public website name, logo and homepage text."
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field
              label="Website Name"
              value={
                site.site_name
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  site_name:
                    value,
                })
              }
            />

            <Field
              label="Logo URL"
              value={
                site.logo_url ||
                ""
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  logo_url:
                    value,
                })
              }
              placeholder="https://..."
            />

            <Field
              label="Tagline"
              value={
                site.tagline ||
                ""
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  tagline:
                    value,
                })
              }
            />

            <Field
              label="Primary Button Text"
              value={
                site.homepage_primary_button_text ||
                ""
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  homepage_primary_button_text:
                    value,
                })
              }
            />

            <div className="md:col-span-2">
              <Field
                label="Homepage Heading"
                value={
                  site.homepage_heading ||
                  ""
                }
                onChange={(value) =>
                  setSite({
                    ...site,
                    homepage_heading:
                      value,
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label="Homepage Subheading"
                value={
                  site.homepage_subheading ||
                  ""
                }
                onChange={(value) =>
                  setSite({
                    ...site,
                    homepage_subheading:
                      value,
                  })
                }
              />
            </div>

            <Field
              label="Primary Button URL"
              value={
                site.homepage_primary_button_url ||
                ""
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  homepage_primary_button_url:
                    value,
                })
              }
              placeholder="/products"
            />

            <Field
              label="Footer Text"
              value={
                site.footer_text ||
                ""
              }
              onChange={(value) =>
                setSite({
                  ...site,
                  footer_text:
                    value,
                })
              }
            />
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSingleton(
                  "site",
                  site
                )
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              Save Website Settings
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <SectionHeading
            eyebrow="Homepage"
            title="Homepage Content"
            description="Configure the moving product section, category text, offers and banner visibility."
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field
              label="Featured Products Title"
              value={
                homepage.featured_products_title
              }
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  featured_products_title:
                    value,
                })
              }
            />

            <Field
              label="Featured Products Subtitle"
              value={
                homepage.featured_products_subtitle ||
                ""
              }
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  featured_products_subtitle:
                    value,
                })
              }
            />

            <NumberField
              label="Products Limit"
              value={
                homepage.featured_products_limit
              }
              min={1}
              max={30}
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  featured_products_limit:
                    value,
                })
              }
            />

            <NumberField
              label="Scroll Speed"
              value={
                homepage.featured_products_scroll_speed
              }
              min={5}
              max={120}
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  featured_products_scroll_speed:
                    value,
                })
              }
            />

            <Field
              label="Categories Title"
              value={
                homepage.categories_title
              }
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  categories_title:
                    value,
                })
              }
            />

            <Field
              label="Categories Subtitle"
              value={
                homepage.categories_subtitle ||
                ""
              }
              onChange={(value) =>
                setHomepage({
                  ...homepage,
                  categories_subtitle:
                    value,
                })
              }
            />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Toggle
              label="Featured Products"
              checked={
                homepage.featured_products_enabled
              }
              onChange={(checked) =>
                setHomepage({
                  ...homepage,
                  featured_products_enabled:
                    checked,
                })
              }
            />

            <Toggle
              label="Auto Scroll"
              checked={
                homepage.featured_products_auto_scroll
              }
              onChange={(checked) =>
                setHomepage({
                  ...homepage,
                  featured_products_auto_scroll:
                    checked,
                })
              }
            />

            <Toggle
              label="Offers"
              checked={
                homepage.offers_enabled
              }
              onChange={(checked) =>
                setHomepage({
                  ...homepage,
                  offers_enabled:
                    checked,
                })
              }
            />

            <Toggle
              label="Promotion Banner"
              checked={
                homepage.promotion_banner_enabled
              }
              onChange={(checked) =>
                setHomepage({
                  ...homepage,
                  promotion_banner_enabled:
                    checked,
                })
              }
            />
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSingleton(
                  "homepage",
                  homepage
                )
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              Save Homepage Settings
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <SectionHeading
            eyebrow="Footer"
            title="Social Links"
            description="Add social networks, control their order and show or hide individual icons."
          />

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Field
              label="Platform"
              value={
                newSocial.platform
              }
              onChange={(value) =>
                setNewSocial({
                  ...newSocial,
                  platform:
                    value,
                })
              }
              placeholder="Facebook"
            />

            <Field
              label="Label"
              value={
                newSocial.label
              }
              onChange={(value) =>
                setNewSocial({
                  ...newSocial,
                  label: value,
                })
              }
              placeholder="@pakstore"
            />

            <div className="xl:col-span-2">
              <Field
                label="URL"
                value={
                  newSocial.url
                }
                onChange={(value) =>
                  setNewSocial({
                    ...newSocial,
                    url: value,
                  })
                }
                placeholder="https://..."
              />
            </div>

            <Field
              label="Icon Key"
              value={
                newSocial.icon_key
              }
              onChange={(value) =>
                setNewSocial({
                  ...newSocial,
                  icon_key:
                    value,
                })
              }
              placeholder="facebook"
            />

            <NumberField
              label="Order"
              value={
                newSocial.sort_order
              }
              min={0}
              max={999}
              onChange={(value) =>
                setNewSocial({
                  ...newSocial,
                  sort_order:
                    value,
                })
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Toggle
              label="Visible"
              checked={
                newSocial.is_visible
              }
              onChange={(checked) =>
                setNewSocial({
                  ...newSocial,
                  is_visible:
                    checked,
                })
              }
            />

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                createRecord(
                  "social",
                  newSocial
                )
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              Add Social Link
            </button>
          </div>

          <div className="mt-7 space-y-4">
            {socialLinks.map(
              (item) => (
                <SocialRow
                  key={item.id}
                  item={item}
                  disabled={
                    saving
                  }
                  onSave={(
                    updated
                  ) =>
                    updateRecord(
                      "social",
                      item.id,
                      updated
                    )
                  }
                  onDelete={() =>
                    deleteRecord(
                      "social",
                      item.id
                    )
                  }
                />
              )
            )}

            {socialLinks.length ===
              0 && (
              <EmptyMessage text="No social links added yet." />
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <SectionHeading
            eyebrow="Marketing"
            title="Offers"
            description="Create timed discounts, coupon campaigns and call-to-action offers."
          />

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Title"
              value={
                newOffer.title
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  title: value,
                })
              }
            />

            <Field
              label="Badge"
              value={
                newOffer.badge_text
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  badge_text:
                    value,
                })
              }
              placeholder="Limited Time"
            />

            <Field
              label="Discount Text"
              value={
                newOffer.discount_text
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  discount_text:
                    value,
                })
              }
              placeholder="20% OFF"
            />

            <Field
              label="Coupon Code"
              value={
                newOffer.coupon_code
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  coupon_code:
                    value,
                })
              }
              placeholder="SAVE20"
            />

            <div className="md:col-span-2 xl:col-span-4">
              <TextAreaField
                label="Description"
                value={
                  newOffer.description
                }
                onChange={(value) =>
                  setNewOffer({
                    ...newOffer,
                    description:
                      value,
                  })
                }
              />
            </div>

            <Field
              label="Button Text"
              value={
                newOffer.button_text
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  button_text:
                    value,
                })
              }
            />

            <Field
              label="Button URL"
              value={
                newOffer.button_url
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  button_url:
                    value,
                })
              }
            />

            <Field
              label="Starts At"
              type="datetime-local"
              value={
                newOffer.starts_at
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  starts_at:
                    value,
                })
              }
            />

            <Field
              label="Ends At"
              type="datetime-local"
              value={
                newOffer.ends_at
              }
              onChange={(value) =>
                setNewOffer({
                  ...newOffer,
                  ends_at:
                    value,
                })
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Toggle
              label="Active"
              checked={
                newOffer.is_active
              }
              onChange={(checked) =>
                setNewOffer({
                  ...newOffer,
                  is_active:
                    checked,
                })
              }
            />

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                createRecord(
                  "offer",
                  {
                    ...newOffer,
                    starts_at:
                      fromDatetimeLocal(
                        newOffer.starts_at
                      ),
                    ends_at:
                      fromDatetimeLocal(
                        newOffer.ends_at
                      ),
                  }
                )
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              Add Offer
            </button>
          </div>

          <div className="mt-7 space-y-4">
            {offers.map(
              (item) => (
                <OfferRow
                  key={item.id}
                  item={item}
                  disabled={
                    saving
                  }
                  onSave={(
                    updated
                  ) =>
                    updateRecord(
                      "offer",
                      item.id,
                      updated
                    )
                  }
                  onDelete={() =>
                    deleteRecord(
                      "offer",
                      item.id
                    )
                  }
                />
              )
            )}

            {offers.length ===
              0 && (
              <EmptyMessage text="No offers added yet." />
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <SectionHeading
            eyebrow="Promotion"
            title="Promotion Banners"
            description="Promote your own campaign or another website using a banner with an external link."
          />

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Title"
              value={
                newBanner.title
              }
              onChange={(value) =>
                setNewBanner({
                  ...newBanner,
                  title: value,
                })
              }
            />

            <Field
              label="Image URL"
              value={
                newBanner.image_url
              }
              onChange={(value) =>
                setNewBanner({
                  ...newBanner,
                  image_url:
                    value,
                })
              }
              placeholder="https://..."
            />

            <Field
              label="Button Text"
              value={
                newBanner.button_text
              }
              onChange={(value) =>
                setNewBanner({
                  ...newBanner,
                  button_text:
                    value,
                })
              }
            />

            <Field
              label="Target URL"
              value={
                newBanner.target_url
              }
              onChange={(value) =>
                setNewBanner({
                  ...newBanner,
                  target_url:
                    value,
                })
              }
              placeholder="https://partner-site.com"
            />

            <div className="md:col-span-2 xl:col-span-4">
              <TextAreaField
                label="Description"
                value={
                  newBanner.description
                }
                onChange={(value) =>
                  setNewBanner({
                    ...newBanner,
                    description:
                      value,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Toggle
              label="Active"
              checked={
                newBanner.is_active
              }
              onChange={(checked) =>
                setNewBanner({
                  ...newBanner,
                  is_active:
                    checked,
                })
              }
            />

            <Toggle
              label="Open in New Tab"
              checked={
                newBanner.open_in_new_tab
              }
              onChange={(checked) =>
                setNewBanner({
                  ...newBanner,
                  open_in_new_tab:
                    checked,
                })
              }
            />

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                createRecord(
                  "banner",
                  newBanner
                )
              }
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              Add Promotion Banner
            </button>
          </div>

          <div className="mt-7 space-y-4">
            {promotionBanners.map(
              (item) => (
                <BannerRow
                  key={item.id}
                  item={item}
                  disabled={
                    saving
                  }
                  onSave={(
                    updated
                  ) =>
                    updateRecord(
                      "banner",
                      item.id,
                      updated
                    )
                  }
                  onDelete={() =>
                    deleteRecord(
                      "banner",
                      item.id
                    )
                  }
                />
              )
            )}

            {promotionBanners.length ===
              0 && (
              <EmptyMessage text="No promotion banners added yet." />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm text-emerald-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-2 text-sm text-white/40">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/40">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={inputClass()}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/40">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={textareaClass()}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/40">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className={inputClass()}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
      />

      <span>{label}</span>
    </label>
  );
}

function SocialRow({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: SocialLink;
  disabled: boolean;
  onSave: (
    data: Partial<SocialLink>
  ) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] =
    useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Field
          label="Platform"
          value={draft.platform}
          onChange={(value) =>
            setDraft({
              ...draft,
              platform: value,
            })
          }
        />

        <Field
          label="Label"
          value={
            draft.label || ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              label: value,
            })
          }
        />

        <div className="xl:col-span-2">
          <Field
            label="URL"
            value={draft.url}
            onChange={(value) =>
              setDraft({
                ...draft,
                url: value,
              })
            }
          />
        </div>

        <Field
          label="Icon Key"
          value={
            draft.icon_key ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              icon_key: value,
            })
          }
        />

        <NumberField
          label="Order"
          value={
            draft.sort_order
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              sort_order:
                value,
            })
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Toggle
          label="Visible"
          checked={
            draft.is_visible
          }
          onChange={(checked) =>
            setDraft({
              ...draft,
              is_visible:
                checked,
            })
          }
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(draft)
          }
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300"
        >
          Save
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function OfferRow({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: Offer;
  disabled: boolean;
  onSave: (
    data: Partial<Offer>
  ) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] =
    useState({
      ...item,
      starts_at:
        toDatetimeLocal(
          item.starts_at
        ),
      ends_at:
        toDatetimeLocal(
          item.ends_at
        ),
    });

  useEffect(() => {
    setDraft({
      ...item,
      starts_at:
        toDatetimeLocal(
          item.starts_at
        ),
      ends_at:
        toDatetimeLocal(
          item.ends_at
        ),
    });
  }, [item]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Title"
          value={draft.title}
          onChange={(value) =>
            setDraft({
              ...draft,
              title: value,
            })
          }
        />

        <Field
          label="Badge"
          value={
            draft.badge_text ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              badge_text:
                value,
            })
          }
        />

        <Field
          label="Discount"
          value={
            draft.discount_text ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              discount_text:
                value,
            })
          }
        />

        <Field
          label="Coupon"
          value={
            draft.coupon_code ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              coupon_code:
                value,
            })
          }
        />

        <div className="md:col-span-2 xl:col-span-4">
          <TextAreaField
            label="Description"
            value={
              draft.description ||
              ""
            }
            onChange={(value) =>
              setDraft({
                ...draft,
                description:
                  value,
              })
            }
          />
        </div>

        <Field
          label="Button Text"
          value={
            draft.button_text ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              button_text:
                value,
            })
          }
        />

        <Field
          label="Button URL"
          value={
            draft.button_url ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              button_url:
                value,
            })
          }
        />

        <Field
          label="Starts At"
          type="datetime-local"
          value={
            draft.starts_at
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              starts_at:
                value,
            })
          }
        />

        <Field
          label="Ends At"
          type="datetime-local"
          value={
            draft.ends_at
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              ends_at:
                value,
            })
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Toggle
          label="Active"
          checked={
            draft.is_active
          }
          onChange={(checked) =>
            setDraft({
              ...draft,
              is_active:
                checked,
            })
          }
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave({
              ...draft,
              starts_at:
                fromDatetimeLocal(
                  draft.starts_at
                ),
              ends_at:
                fromDatetimeLocal(
                  draft.ends_at
                ),
            })
          }
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300"
        >
          Save
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function BannerRow({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: PromotionBanner;
  disabled: boolean;
  onSave: (
    data: Partial<PromotionBanner>
  ) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] =
    useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Title"
          value={draft.title}
          onChange={(value) =>
            setDraft({
              ...draft,
              title: value,
            })
          }
        />

        <Field
          label="Image URL"
          value={
            draft.image_url ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              image_url:
                value,
            })
          }
        />

        <Field
          label="Button Text"
          value={
            draft.button_text ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              button_text:
                value,
            })
          }
        />

        <Field
          label="Target URL"
          value={
            draft.target_url ||
            ""
          }
          onChange={(value) =>
            setDraft({
              ...draft,
              target_url:
                value,
            })
          }
        />

        <div className="md:col-span-2 xl:col-span-4">
          <TextAreaField
            label="Description"
            value={
              draft.description ||
              ""
            }
            onChange={(value) =>
              setDraft({
                ...draft,
                description:
                  value,
              })
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Toggle
          label="Active"
          checked={
            draft.is_active
          }
          onChange={(checked) =>
            setDraft({
              ...draft,
              is_active:
                checked,
            })
          }
        />

        <Toggle
          label="Open in New Tab"
          checked={
            draft.open_in_new_tab
          }
          onChange={(checked) =>
            setDraft({
              ...draft,
              open_in_new_tab:
                checked,
            })
          }
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(draft)
          }
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300"
        >
          Save
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
      {text}
    </div>
  );
}
