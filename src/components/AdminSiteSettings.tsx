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
  site_name: "ZonixAssets",
  logo_url: "",
  tagline: "Premium Digital Asset Store",
  homepage_heading:
    "Discover digital products built for creators.",
  homepage_subheading:
    "Browse premium digital products, tools and resources.",
  homepage_primary_button_text:
    "Browse Store",
  homepage_primary_button_url:
    "/products",
  footer_text:
    "© ZonixAssets. All rights reserved.",
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
      <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
        <AdminHeader />
        <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
          <div className="grid min-h-[420px] place-items-center rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e7edf4] border-t-[#ff6500]" />
              <p className="mt-5 font-semibold text-[#718099]">
                Loading site settings...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#081529]">
      <AdminHeader />

      <section
        className="relative overflow-hidden bg-[#071426] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 8% 100%, rgba(0,190,220,.15), transparent 30%), radial-gradient(circle at 92% 14%, rgba(255,101,0,.18), transparent 28%)",
          backgroundSize: "64px 64px, 64px 64px, auto, auto",
        }}
      >
        <div className="mx-auto grid max-w-[1600px] gap-9 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
              Site Control Center
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Shape the storefront,
              <span className="block text-white/45">brand and promotions.</span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-white/55 md:text-lg">
              Manage website identity, homepage sections, social links, offers
              and promotional banners from one professional CMS workspace.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/"
                target="_blank"
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 font-black text-white shadow-[0_14px_34px_rgba(255,101,0,.22)] transition hover:bg-[#ff7420]"
              >
                Preview Website
              </Link>

              <button
                type="button"
                onClick={loadSettings}
                disabled={saving}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 font-black text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Refresh Settings
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric
              label="Social links"
              value={String(socialLinks.length)}
              helper={`${socialLinks.filter((item) => item.is_visible).length} visible`}
            />
            <HeroMetric
              label="Offers"
              value={String(offers.length)}
              helper={`${offers.filter((item) => item.is_active).length} active`}
            />
            <HeroMetric
              label="Banners"
              value={String(promotionBanners.length)}
              helper={`${promotionBanners.filter((item) => item.is_active).length} active`}
            />
            <HeroMetric
              label="Homepage"
              value={homepage.featured_products_enabled ? "Live" : "Limited"}
              helper="Featured product section"
              accent
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-12">
        {(error || success) && (
          <div className="mb-8 space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {success}
              </div>
            )}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Brand"
            value={site.site_name || "ZonixAssets"}
            helper="Public site identity"
            tone="orange"
          />
          <StatCard
            label="Social"
            value={String(socialLinks.length)}
            helper="Connected social channels"
            tone="cyan"
          />
          <StatCard
            label="Offers"
            value={String(offers.filter((item) => item.is_active).length)}
            helper="Active campaigns"
            tone="violet"
          />
          <StatCard
            label="Banners"
            value={String(
              promotionBanners.filter((item) => item.is_active).length
            )}
            helper="Active promotions"
            tone="green"
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <SectionHeading
            number="01"
            eyebrow="Brand"
            title="Website identity"
            description="Control the public website name, logo, hero copy and footer text."
          />

          <div className="p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Website Name"
                value={site.site_name}
                onChange={(value) =>
                  setSite({ ...site, site_name: value })
                }
              />

              <Field
                label="Logo URL"
                value={site.logo_url || ""}
                onChange={(value) =>
                  setSite({ ...site, logo_url: value })
                }
                placeholder="https://..."
              />

              <Field
                label="Tagline"
                value={site.tagline || ""}
                onChange={(value) =>
                  setSite({ ...site, tagline: value })
                }
              />

              <Field
                label="Primary Button Text"
                value={site.homepage_primary_button_text || ""}
                onChange={(value) =>
                  setSite({
                    ...site,
                    homepage_primary_button_text: value,
                  })
                }
              />

              <div className="md:col-span-2">
                <Field
                  label="Homepage Heading"
                  value={site.homepage_heading || ""}
                  onChange={(value) =>
                    setSite({ ...site, homepage_heading: value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <TextAreaField
                  label="Homepage Subheading"
                  value={site.homepage_subheading || ""}
                  onChange={(value) =>
                    setSite({
                      ...site,
                      homepage_subheading: value,
                    })
                  }
                />
              </div>

              <Field
                label="Primary Button URL"
                value={site.homepage_primary_button_url || ""}
                onChange={(value) =>
                  setSite({
                    ...site,
                    homepage_primary_button_url: value,
                  })
                }
                placeholder="/products"
              />

              <Field
                label="Footer Text"
                value={site.footer_text || ""}
                onChange={(value) =>
                  setSite({ ...site, footer_text: value })
                }
              />
            </div>

            <ActionBar
              helper="Save your brand and public website identity."
              buttonLabel={saving ? "Saving..." : "Save Website Settings"}
              disabled={saving}
              onClick={() => saveSingleton("site", site)}
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <SectionHeading
            number="02"
            eyebrow="Homepage"
            title="Homepage content"
            description="Configure featured products, categories, offers and promotion visibility."
          />

          <div className="p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Featured Products Title"
                value={homepage.featured_products_title}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    featured_products_title: value,
                  })
                }
              />

              <Field
                label="Featured Products Subtitle"
                value={homepage.featured_products_subtitle || ""}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    featured_products_subtitle: value,
                  })
                }
              />

              <NumberField
                label="Products Limit"
                value={homepage.featured_products_limit}
                min={1}
                max={30}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    featured_products_limit: value,
                  })
                }
              />

              <NumberField
                label="Scroll Speed"
                value={homepage.featured_products_scroll_speed}
                min={5}
                max={120}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    featured_products_scroll_speed: value,
                  })
                }
              />

              <Field
                label="Categories Title"
                value={homepage.categories_title}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    categories_title: value,
                  })
                }
              />

              <Field
                label="Categories Subtitle"
                value={homepage.categories_subtitle || ""}
                onChange={(value) =>
                  setHomepage({
                    ...homepage,
                    categories_subtitle: value,
                  })
                }
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Toggle
                label="Featured Products"
                checked={homepage.featured_products_enabled}
                onChange={(checked) =>
                  setHomepage({
                    ...homepage,
                    featured_products_enabled: checked,
                  })
                }
              />

              <Toggle
                label="Auto Scroll"
                checked={homepage.featured_products_auto_scroll}
                onChange={(checked) =>
                  setHomepage({
                    ...homepage,
                    featured_products_auto_scroll: checked,
                  })
                }
              />

              <Toggle
                label="Offers"
                checked={homepage.offers_enabled}
                onChange={(checked) =>
                  setHomepage({
                    ...homepage,
                    offers_enabled: checked,
                  })
                }
              />

              <Toggle
                label="Promotion Banner"
                checked={homepage.promotion_banner_enabled}
                onChange={(checked) =>
                  setHomepage({
                    ...homepage,
                    promotion_banner_enabled: checked,
                  })
                }
              />
            </div>

            <ActionBar
              helper="Publish homepage presentation and visibility changes."
              buttonLabel={saving ? "Saving..." : "Save Homepage Settings"}
              disabled={saving}
              onClick={() => saveSingleton("homepage", homepage)}
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <SectionHeading
            number="03"
            eyebrow="Footer"
            title="Social links"
            description="Add social networks, control their order and show or hide individual links."
          />

          <div className="p-6 md:p-8">
            <div className="rounded-[24px] border border-[#dce4ef] bg-[#f7f9fc] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                Add social link
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <Field
                  label="Platform"
                  value={newSocial.platform}
                  onChange={(value) =>
                    setNewSocial({
                      ...newSocial,
                      platform: value,
                    })
                  }
                  placeholder="Instagram"
                />

                <Field
                  label="Label"
                  value={newSocial.label}
                  onChange={(value) =>
                    setNewSocial({
                      ...newSocial,
                      label: value,
                    })
                  }
                  placeholder="@zonixassets"
                />

                <div className="xl:col-span-2">
                  <Field
                    label="URL"
                    value={newSocial.url}
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
                  value={newSocial.icon_key}
                  onChange={(value) =>
                    setNewSocial({
                      ...newSocial,
                      icon_key: value,
                    })
                  }
                  placeholder="instagram"
                />

                <NumberField
                  label="Order"
                  value={newSocial.sort_order}
                  min={0}
                  max={999}
                  onChange={(value) =>
                    setNewSocial({
                      ...newSocial,
                      sort_order: value,
                    })
                  }
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Toggle
                  label="Visible"
                  checked={newSocial.is_visible}
                  onChange={(checked) =>
                    setNewSocial({
                      ...newSocial,
                      is_visible: checked,
                    })
                  }
                />

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    createRecord("social", newSocial)
                  }
                  className="rounded-2xl bg-[#081529] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff6500] disabled:opacity-50"
                >
                  Add Social Link
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {socialLinks.map((item) => (
                <SocialRow
                  key={item.id}
                  item={item}
                  disabled={saving}
                  onSave={(updated) =>
                    updateRecord("social", item.id, updated)
                  }
                  onDelete={() =>
                    deleteRecord("social", item.id)
                  }
                />
              ))}

              {socialLinks.length === 0 && (
                <EmptyMessage text="No social links added yet." />
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <SectionHeading
            number="04"
            eyebrow="Marketing"
            title="Offers"
            description="Create timed discounts, coupon campaigns and call-to-action offers."
          />

          <div className="p-6 md:p-8">
            <div className="rounded-[24px] border border-[#dce4ef] bg-[#f7f9fc] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                Create offer
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Title"
                  value={newOffer.title}
                  onChange={(value) =>
                    setNewOffer({ ...newOffer, title: value })
                  }
                />

                <Field
                  label="Badge"
                  value={newOffer.badge_text}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      badge_text: value,
                    })
                  }
                  placeholder="Limited Time"
                />

                <Field
                  label="Discount Text"
                  value={newOffer.discount_text}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      discount_text: value,
                    })
                  }
                  placeholder="20% OFF"
                />

                <Field
                  label="Coupon Code"
                  value={newOffer.coupon_code}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      coupon_code: value,
                    })
                  }
                  placeholder="SAVE20"
                />

                <div className="md:col-span-2 xl:col-span-4">
                  <TextAreaField
                    label="Description"
                    value={newOffer.description}
                    onChange={(value) =>
                      setNewOffer({
                        ...newOffer,
                        description: value,
                      })
                    }
                  />
                </div>

                <Field
                  label="Button Text"
                  value={newOffer.button_text}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      button_text: value,
                    })
                  }
                />

                <Field
                  label="Button URL"
                  value={newOffer.button_url}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      button_url: value,
                    })
                  }
                />

                <Field
                  label="Starts At"
                  type="datetime-local"
                  value={newOffer.starts_at}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      starts_at: value,
                    })
                  }
                />

                <Field
                  label="Ends At"
                  type="datetime-local"
                  value={newOffer.ends_at}
                  onChange={(value) =>
                    setNewOffer({
                      ...newOffer,
                      ends_at: value,
                    })
                  }
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Toggle
                  label="Active"
                  checked={newOffer.is_active}
                  onChange={(checked) =>
                    setNewOffer({
                      ...newOffer,
                      is_active: checked,
                    })
                  }
                />

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    createRecord("offer", {
                      ...newOffer,
                      starts_at: fromDatetimeLocal(
                        newOffer.starts_at
                      ),
                      ends_at: fromDatetimeLocal(
                        newOffer.ends_at
                      ),
                    })
                  }
                  className="rounded-2xl bg-[#081529] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff6500] disabled:opacity-50"
                >
                  Add Offer
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {offers.map((item) => (
                <OfferRow
                  key={item.id}
                  item={item}
                  disabled={saving}
                  onSave={(updated) =>
                    updateRecord("offer", item.id, updated)
                  }
                  onDelete={() =>
                    deleteRecord("offer", item.id)
                  }
                />
              ))}

              {offers.length === 0 && (
                <EmptyMessage text="No offers added yet." />
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <SectionHeading
            number="05"
            eyebrow="Promotion"
            title="Promotion banners"
            description="Promote campaigns or external partners with branded promotional banners."
          />

          <div className="p-6 md:p-8">
            <div className="rounded-[24px] border border-[#dce4ef] bg-[#f7f9fc] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                Create banner
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Title"
                  value={newBanner.title}
                  onChange={(value) =>
                    setNewBanner({
                      ...newBanner,
                      title: value,
                    })
                  }
                />

                <Field
                  label="Image URL"
                  value={newBanner.image_url}
                  onChange={(value) =>
                    setNewBanner({
                      ...newBanner,
                      image_url: value,
                    })
                  }
                  placeholder="https://..."
                />

                <Field
                  label="Button Text"
                  value={newBanner.button_text}
                  onChange={(value) =>
                    setNewBanner({
                      ...newBanner,
                      button_text: value,
                    })
                  }
                />

                <Field
                  label="Target URL"
                  value={newBanner.target_url}
                  onChange={(value) =>
                    setNewBanner({
                      ...newBanner,
                      target_url: value,
                    })
                  }
                  placeholder="https://partner-site.com"
                />

                <div className="md:col-span-2 xl:col-span-4">
                  <TextAreaField
                    label="Description"
                    value={newBanner.description}
                    onChange={(value) =>
                      setNewBanner({
                        ...newBanner,
                        description: value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Toggle
                  label="Active"
                  checked={newBanner.is_active}
                  onChange={(checked) =>
                    setNewBanner({
                      ...newBanner,
                      is_active: checked,
                    })
                  }
                />

                <Toggle
                  label="Open in New Tab"
                  checked={newBanner.open_in_new_tab}
                  onChange={(checked) =>
                    setNewBanner({
                      ...newBanner,
                      open_in_new_tab: checked,
                    })
                  }
                />

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    createRecord("banner", newBanner)
                  }
                  className="rounded-2xl bg-[#081529] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff6500] disabled:opacity-50"
                >
                  Add Promotion Banner
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {promotionBanners.map((item) => (
                <BannerRow
                  key={item.id}
                  item={item}
                  disabled={saving}
                  onSave={(updated) =>
                    updateRecord("banner", item.id, updated)
                  }
                  onDelete={() =>
                    deleteRecord("banner", item.id)
                  }
                />
              ))}

              {promotionBanners.length === 0 && (
                <EmptyMessage text="No promotion banners added yet." />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111a31]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 md:px-10">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-[#081529] shadow-sm">
            ZA
          </div>

          <div className="min-w-0">
            <div className="truncate text-2xl font-black tracking-tight">
              Zonix<span className="text-cyan-400">Assets</span>
            </div>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              Site Settings
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          <AdminNav href="/admin">Dashboard</AdminNav>
          <AdminNav href="/admin/products">Products</AdminNav>
          <AdminNav href="/admin/orders">Orders</AdminNav>
          <AdminNav href="/admin/customers">Customers</AdminNav>
          <AdminNav href="/admin/content-pages">Content</AdminNav>
          <AdminNav href="/admin/site-settings" active>
            Settings
          </AdminNav>
        </nav>

        <Link
          href="/"
          target="_blank"
          className="shrink-0 rounded-2xl bg-[#ff6500] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,101,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff7420]"
        >
          View Site
        </Link>
      </div>
    </header>
  );
}

function AdminNav({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-2.5 text-sm font-black text-orange-300"
          : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
      }
    >
      {children}
    </Link>
  );
}

function HeroMetric({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
        {label}
      </p>
      <p
        className={`mt-3 break-words text-2xl font-black tracking-tight ${
          accent ? "text-[#ff7a22]" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-white/45">
        {helper}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "orange" | "cyan" | "violet" | "green";
}) {
  const tones = {
    orange: "bg-orange-50 text-[#ff6500]",
    cyan: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-[28px] border border-[#dce4ef] bg-white p-6 shadow-[0_16px_50px_rgba(20,35,60,.05)]">
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${tones[tone]}`}
      >
        ✦
      </div>
      <p className="mt-5 text-sm font-bold text-[#60718e]">{label}</p>
      <p className="mt-2 break-words text-3xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#94a1b5]">{helper}</p>
    </div>
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
    <div className="border-b border-[#e7edf4] p-6 md:p-8">
      <div className="flex gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-sm font-black text-[#ff6500]">
          {number}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-[#718099]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionBar({
  helper,
  buttonLabel,
  disabled,
  onClick,
}: {
  helper: string;
  buttonLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col gap-4 rounded-[22px] bg-[#071426] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-white/50">{helper}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 rounded-2xl bg-[#ff6500] px-5 py-3.5 font-black text-white transition hover:bg-[#ff7420] disabled:opacity-50"
      >
        {buttonLabel}
      </button>
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
      <span className="mb-2 block text-sm font-black text-[#53627a]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 text-sm font-semibold text-[#081529] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
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
      <span className="mb-2 block text-sm font-black text-[#53627a]">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 text-sm font-semibold leading-7 text-[#081529] outline-none transition focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
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
      <span className="mb-2 block text-sm font-black text-[#53627a]">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 text-sm font-semibold text-[#081529] outline-none transition focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
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
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#dce4ef] bg-white px-4 py-3.5 text-sm font-black text-[#53627a]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-[#ff6500]"
      />
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
  onSave: (data: Partial<SocialLink>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <div className="rounded-[24px] border border-[#dce4ef] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,60,.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6500]">
            Social channel
          </p>
          <p className="mt-1 font-black">{draft.platform || "Untitled"}</p>
        </div>

        <StatusBadge active={draft.is_visible} activeText="VISIBLE" inactiveText="HIDDEN" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Field
          label="Platform"
          value={draft.platform}
          onChange={(value) =>
            setDraft({ ...draft, platform: value })
          }
        />

        <Field
          label="Label"
          value={draft.label || ""}
          onChange={(value) =>
            setDraft({ ...draft, label: value })
          }
        />

        <div className="xl:col-span-2">
          <Field
            label="URL"
            value={draft.url}
            onChange={(value) =>
              setDraft({ ...draft, url: value })
            }
          />
        </div>

        <Field
          label="Icon Key"
          value={draft.icon_key || ""}
          onChange={(value) =>
            setDraft({ ...draft, icon_key: value })
          }
        />

        <NumberField
          label="Order"
          value={draft.sort_order}
          onChange={(value) =>
            setDraft({ ...draft, sort_order: value })
          }
        />
      </div>

      <RowActions
        disabled={disabled}
        toggle={
          <Toggle
            label="Visible"
            checked={draft.is_visible}
            onChange={(checked) =>
              setDraft({
                ...draft,
                is_visible: checked,
              })
            }
          />
        }
        onSave={() => onSave(draft)}
        onDelete={onDelete}
      />
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
  onSave: (data: Partial<Offer>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({
    ...item,
    starts_at: toDatetimeLocal(item.starts_at),
    ends_at: toDatetimeLocal(item.ends_at),
  });

  useEffect(() => {
    setDraft({
      ...item,
      starts_at: toDatetimeLocal(item.starts_at),
      ends_at: toDatetimeLocal(item.ends_at),
    });
  }, [item]);

  return (
    <div className="rounded-[24px] border border-[#dce4ef] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,60,.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6500]">
            Marketing offer
          </p>
          <p className="mt-1 font-black">{draft.title || "Untitled offer"}</p>
        </div>

        <StatusBadge active={draft.is_active} activeText="ACTIVE" inactiveText="INACTIVE" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Title"
          value={draft.title}
          onChange={(value) =>
            setDraft({ ...draft, title: value })
          }
        />

        <Field
          label="Badge"
          value={draft.badge_text || ""}
          onChange={(value) =>
            setDraft({ ...draft, badge_text: value })
          }
        />

        <Field
          label="Discount"
          value={draft.discount_text || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              discount_text: value,
            })
          }
        />

        <Field
          label="Coupon"
          value={draft.coupon_code || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              coupon_code: value,
            })
          }
        />

        <div className="md:col-span-2 xl:col-span-4">
          <TextAreaField
            label="Description"
            value={draft.description || ""}
            onChange={(value) =>
              setDraft({
                ...draft,
                description: value,
              })
            }
          />
        </div>

        <Field
          label="Button Text"
          value={draft.button_text || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              button_text: value,
            })
          }
        />

        <Field
          label="Button URL"
          value={draft.button_url || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              button_url: value,
            })
          }
        />

        <Field
          label="Starts At"
          type="datetime-local"
          value={draft.starts_at}
          onChange={(value) =>
            setDraft({
              ...draft,
              starts_at: value,
            })
          }
        />

        <Field
          label="Ends At"
          type="datetime-local"
          value={draft.ends_at}
          onChange={(value) =>
            setDraft({
              ...draft,
              ends_at: value,
            })
          }
        />
      </div>

      <RowActions
        disabled={disabled}
        toggle={
          <Toggle
            label="Active"
            checked={draft.is_active}
            onChange={(checked) =>
              setDraft({
                ...draft,
                is_active: checked,
              })
            }
          />
        }
        onSave={() =>
          onSave({
            ...draft,
            starts_at: fromDatetimeLocal(
              draft.starts_at
            ),
            ends_at: fromDatetimeLocal(
              draft.ends_at
            ),
          })
        }
        onDelete={onDelete}
      />
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
  onSave: (data: Partial<PromotionBanner>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <div className="rounded-[24px] border border-[#dce4ef] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,60,.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6500]">
            Promotion banner
          </p>
          <p className="mt-1 font-black">{draft.title || "Untitled banner"}</p>
        </div>

        <StatusBadge active={draft.is_active} activeText="ACTIVE" inactiveText="INACTIVE" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Title"
          value={draft.title}
          onChange={(value) =>
            setDraft({ ...draft, title: value })
          }
        />

        <Field
          label="Image URL"
          value={draft.image_url || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              image_url: value,
            })
          }
        />

        <Field
          label="Button Text"
          value={draft.button_text || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              button_text: value,
            })
          }
        />

        <Field
          label="Target URL"
          value={draft.target_url || ""}
          onChange={(value) =>
            setDraft({
              ...draft,
              target_url: value,
            })
          }
        />

        <div className="md:col-span-2 xl:col-span-4">
          <TextAreaField
            label="Description"
            value={draft.description || ""}
            onChange={(value) =>
              setDraft({
                ...draft,
                description: value,
              })
            }
          />
        </div>
      </div>

      {draft.image_url && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e2e9f1] bg-[#f7f9fc]">
          <img
            src={draft.image_url}
            alt={draft.title || "Promotion banner"}
            className="max-h-72 w-full object-cover"
          />
        </div>
      )}

      <RowActions
        disabled={disabled}
        toggle={
          <div className="flex flex-wrap gap-3">
            <Toggle
              label="Active"
              checked={draft.is_active}
              onChange={(checked) =>
                setDraft({
                  ...draft,
                  is_active: checked,
                })
              }
            />
            <Toggle
              label="Open in New Tab"
              checked={draft.open_in_new_tab}
              onChange={(checked) =>
                setDraft({
                  ...draft,
                  open_in_new_tab: checked,
                })
              }
            />
          </div>
        }
        onSave={() => onSave(draft)}
        onDelete={onDelete}
      />
    </div>
  );
}

function RowActions({
  disabled,
  toggle,
  onSave,
  onDelete,
}: {
  disabled: boolean;
  toggle: React.ReactNode;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[#e7edf4] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div>{toggle}</div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="rounded-xl bg-[#081529] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ff6500] disabled:opacity-50"
        >
          Save
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700"
          : "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600"
      }
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#cfd9e5] bg-[#f8fafc] p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-xl text-[#ff6500]">
        ✦
      </div>
      <p className="mt-4 font-bold text-[#718099]">{text}</p>
    </div>
  );
}
