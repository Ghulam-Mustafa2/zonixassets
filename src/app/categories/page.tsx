import Link from "next/link";

type Category = {
  title: string;
  slug: string;
  description: string;
  icon: string;
};

const categories: Category[] = [
  {
    title: "Website Templates",
    slug: "website-templates",
    description:
      "Modern website templates for startups, creators, agencies and businesses.",
    icon: "⌘",
  },
  {
    title: "UI Kits",
    slug: "ui-kits",
    description:
      "Reusable UI components and interface kits for websites and applications.",
    icon: "◫",
  },
  {
    title: "Graphics",
    slug: "graphics",
    description:
      "Creative graphics, social media assets, mockups and design resources.",
    icon: "✦",
  },
  {
    title: "Digital Tools",
    slug: "digital-tools",
    description:
      "Useful digital tools and resources designed to improve your workflow.",
    icon: "⚡",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/20 to-black">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            Browse Collections
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Product Categories
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">
            Explore digital products by category and find templates,
            graphics, UI resources and tools designed for creators,
            developers and modern businesses.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group flex min-h-[300px] flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl text-emerald-400 transition group-hover:bg-emerald-400 group-hover:text-black">
                  {category.icon}
                </div>

                <h2 className="mt-8 text-2xl font-bold">
                  {category.title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {category.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-400">
                  Explore Category
                </span>

                <span className="text-lg text-emerald-400 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-950/20 px-8 py-14 text-center md:px-14">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-400">
            Marketplace
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Explore All Digital Products
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-white/50">
            Browse the complete collection of products available on
            ZonixAssets.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-3 font-semibold text-black transition hover:bg-emerald-300"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </main>
  );
}