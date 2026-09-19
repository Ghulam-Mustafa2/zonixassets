"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  featured: boolean;
  isActive: boolean;
  filePath: string | null;
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  createdAt?: string;
};

type ProductForm = {
  title: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  featured: boolean;
  isActive: boolean;
  filePath: string;
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
};

const emptyForm: ProductForm = {
  title: "",
  slug: "",
  description: "",
  category: "",
  price: "",
  featured: false,
  isActive: true,
  filePath: "",
  imageUrl: "",
  imageUrl2: "",
  imageUrl3: "",
};

const PRODUCT_CATEGORIES = [
  "Website Templates",
  "UI Kits",
  "Graphics",
  "Digital Tools",
] as const;

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] =
    useState(false);
  const [uploadingImage, setUploadingImage] =
    useState<1 | 2 | 3 | null>(null);

  const [deletingImage, setDeletingImage] =
    useState<1 | 2 | 3 | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/products",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load products."
        );
      }

      setProducts(
        Array.isArray(data?.products)
          ? data.products
          : []
      );
    } catch (loadError) {
      console.error(
        "ADMIN_PRODUCTS_LOAD_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.title
            .toLowerCase()
            .includes(query) ||
          product.slug
            .toLowerCase()
            .includes(query) ||
          product.category
            .toLowerCase()
            .includes(query)
      );
    }, [products, search]);

  function handleChange(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleTitleChange(
    value: string
  ) {
    setForm((current) => ({
      ...current,
      title: value,

      slug:
        editingId ||
        current.slug.trim()
          ? current.slug
          : createSlug(value),
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }


  async function uploadProductFile(
    file: File
  ) {
    try {
      setUploadingFile(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/products/upload-file",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "You do not have permission to upload product files."
        );
      }

      if (
        !response.ok ||
        !data?.storagePath
      ) {
        throw new Error(
          data?.error ||
            "Unable to upload product file."
        );
      }

      setForm((current) => ({
        ...current,
        filePath: String(
          data.storagePath
        ),
      }));

      setSuccess(
        `Product file uploaded successfully: ${
          data?.fileName ||
          data.storagePath
        }`
      );
    } catch (uploadError) {
      console.error(
        "ADMIN_PRODUCT_FILE_UPLOAD_ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload product file."
      );
    } finally {
      setUploadingFile(false);
    }
  }


  async function uploadProductImage(
    file: File,
    slot: 1 | 2 | 3
  ) {
    try {
      setUploadingImage(slot);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/products/upload-image",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "You do not have permission to upload images."
        );
      }

      if (!response.ok || !data?.imageUrl) {
        throw new Error(
          data?.error ||
            "Unable to upload product image."
        );
      }

      const field: keyof ProductForm =
        slot === 1
          ? "imageUrl"
          : slot === 2
          ? "imageUrl2"
          : "imageUrl3";

      setForm((current) => ({
        ...current,
        [field]: data.imageUrl,
      }));

      setSuccess(
        `Image ${slot} uploaded successfully.`
      );
    } catch (uploadError) {
      console.error(
        "ADMIN_PRODUCT_IMAGE_UPLOAD_ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload product image."
      );
    } finally {
      setUploadingImage(null);
    }
  }

  async function deleteProductImage(
    imageUrl: string,
    slot: 1 | 2 | 3
  ) {
    if (!imageUrl.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Remove image ${slot}?\n\nIf this image was uploaded to Supabase product-images storage, the file will also be deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImage(slot);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/products/delete-image",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: imageUrl.trim(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "You do not have permission to delete images."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to delete product image."
        );
      }

      const field: keyof ProductForm =
        slot === 1
          ? "imageUrl"
          : slot === 2
          ? "imageUrl2"
          : "imageUrl3";

      setForm((current) => ({
        ...current,
        [field]: "",
      }));

      setSuccess(
        data?.skipped
          ? `Image ${slot} removed from the form.`
          : `Image ${slot} deleted successfully.`
      );
    } catch (deleteImageError) {
      console.error(
        "ADMIN_PRODUCT_IMAGE_DELETE_ERROR:",
        deleteImageError
      );

      setError(
        deleteImageError instanceof Error
          ? deleteImageError.message
          : "Unable to delete product image."
      );
    } finally {
      setDeletingImage(null);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      title: product.title,
      slug: product.slug,
      description:
        product.description || "",
      category: product.category,
      price: String(product.price),
      featured: product.featured,
      isActive: product.isActive,
      filePath: product.filePath || "",
      imageUrl: product.imageUrl || "",
      imageUrl2: product.imageUrl2 || "",
      imageUrl3: product.imageUrl3 || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.title.trim()) {
        setError(
          "Product title is required."
        );
        return;
      }

      if (!form.slug.trim()) {
        setError(
          "Product slug is required."
        );
        return;
      }

      if (!form.category.trim()) {
        setError(
          "Product category is required."
        );
        return;
      }

      const numericPrice =
        Number(form.price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        setError(
          "Enter a valid product price."
        );
        return;
      }

      const endpoint =
        editingId
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products";

      const method =
        editingId
          ? "PATCH"
          : "POST";

      const response = await fetch(
        endpoint,
        {
          method,

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title:
              form.title.trim(),

            slug:
              createSlug(
                form.slug
              ),

            description:
              form.description.trim(),

            category:
              form.category.trim(),

            price:
              numericPrice,

            featured:
              form.featured,

            isActive:
              form.isActive,

            filePath:
              form.filePath.trim() ||
              null,

            imageUrl:
              form.imageUrl.trim() ||
              null,

            imageUrl2:
              form.imageUrl2.trim() ||
              null,

            imageUrl3:
              form.imageUrl3.trim() ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save product."
        );
      }

      setSuccess(
        data?.message ||
          (editingId
            ? "Product updated successfully."
            : "Product created successfully.")
      );

      resetForm();

      await loadProducts();
    } catch (saveError) {
      console.error(
        "ADMIN_PRODUCT_SAVE_ERROR:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    product: Product
  ) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive:
              !product.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to change product status."
        );
      }

      setSuccess(
        product.isActive
          ? "Product deactivated."
          : "Product activated."
      );

      await loadProducts();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to change product status."
      );
    }
  }

  async function toggleFeatured(
    product: Product
  ) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            featured:
              !product.featured,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update featured status."
        );
      }

      setSuccess(
        product.featured
          ? "Product removed from featured."
          : "Product marked as featured."
      );

      await loadProducts();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update featured status."
      );
    }
  }

  async function handleDelete(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.title}" permanently?\n\nFor normal products, deactivating is safer than deleting.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteId(product.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to delete product."
        );
      }

      setSuccess(
        data?.message ||
          "Product deleted successfully."
      );

      if (
        editingId === product.id
      ) {
        resetForm();
      }

      await loadProducts();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product."
      );
    } finally {
      setDeleteId(null);
    }
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
        <div className="mx-auto grid max-w-[1600px] gap-9 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
              Product Center
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Build and manage your
              <span className="block text-white/45">digital product catalog.</span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-white/55 md:text-lg">
              Create products, upload files and previews, control visibility,
              feature key assets and keep the storefront catalog organized.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadProducts}
                disabled={loading}
                className="rounded-2xl bg-[#ff6500] px-6 py-3.5 font-black text-white shadow-[0_14px_34px_rgba(255,101,0,.22)] transition hover:bg-[#ff7420] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Products"}
              </button>

              <Link
                href="/products"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 font-black text-white transition hover:bg-white/10"
              >
                View Store
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric
              label="Products"
              value={String(products.length)}
              helper={`${products.filter((item) => item.isActive).length} active`}
            />
            <HeroMetric
              label="Featured"
              value={String(products.filter((item) => item.featured).length)}
              helper="Highlighted products"
            />
            <HeroMetric
              label="With files"
              value={String(products.filter((item) => item.filePath).length)}
              helper="Downloadable assets ready"
            />
            <HeroMetric
              label="With images"
              value={String(products.filter((item) => item.imageUrl).length)}
              helper="Products with cover images"
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
            label="Total products"
            value={String(products.length)}
            helper="All catalog entries"
            tone="orange"
          />
          <StatCard
            label="Active"
            value={String(products.filter((item) => item.isActive).length)}
            helper="Visible for sale"
            tone="green"
          />
          <StatCard
            label="Featured"
            value={String(products.filter((item) => item.featured).length)}
            helper="Highlighted in store"
            tone="violet"
          />
          <StatCard
            label="Inactive"
            value={String(products.filter((item) => !item.isActive).length)}
            helper="Hidden from store"
            tone="slate"
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <div className="flex flex-col gap-4 border-b border-[#e7edf4] p-6 md:flex-row md:items-start md:justify-between md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                {editingId ? "Editing product" : "New product"}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                {editingId ? "Update product" : "Create product"}
              </h2>
              <p className="mt-2 max-w-2xl text-[#718099]">
                Add product information, downloadable files and up to three
                preview images.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-fit rounded-2xl border border-[#dce4ef] bg-[#f8fafc] px-5 py-3 text-sm font-black text-[#60718e] transition hover:bg-white hover:text-[#081529]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.08fr_.92fr]">
              <div className="space-y-7">
                <FormSection
                  number="01"
                  title="Product details"
                  helper="Core information customers will see in the store."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Product title"
                      value={form.title}
                      placeholder="Nova Dashboard UI"
                      onChange={handleTitleChange}
                    />

                    <Field
                      label="Slug"
                      value={form.slug}
                      placeholder="nova-dashboard-ui"
                      onChange={(value) =>
                        handleChange("slug", createSlug(value))
                      }
                    />

                    <div>
                      <label className="text-sm font-black text-[#53627a]">
                        Category
                      </label>

                      <select
                        value={form.category}
                        onChange={(event) =>
                          handleChange("category", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 font-semibold text-[#081529] outline-none transition focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        <option value="">Select a category</option>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Field
                      label="Price"
                      value={form.price}
                      type="number"
                      placeholder="29"
                      onChange={(value) =>
                        handleChange("price", value)
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-black text-[#53627a]">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        handleChange("description", event.target.value)
                      }
                      rows={6}
                      placeholder="Describe your digital product..."
                      className="mt-2 w-full resize-none rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 leading-7 text-[#081529] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </FormSection>

                <FormSection
                  number="02"
                  title="Download file"
                  helper="Upload the digital asset customers receive after purchase."
                >
                  <div className="rounded-[24px] border border-[#dce4ef] bg-[#f7f9fc] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-[#081529]">
                          Product download file
                        </p>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#718099]">
                          Upload directly to the private{" "}
                          <strong>product-files</strong> bucket. Maximum file
                          size: 50 MB.
                        </p>
                      </div>

                      <label
                        className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#081529] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff6500] ${
                          uploadingFile
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingFile
                          ? "Uploading..."
                          : form.filePath.trim()
                            ? "Replace File"
                            : "Upload File"}

                        <input
                          type="file"
                          disabled={uploadingFile}
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (file) {
                              uploadProductFile(file);
                            }

                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-5">
                      <label className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa8bb]">
                        Storage file path
                      </label>

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={form.filePath}
                          onChange={(event) =>
                            handleChange("filePath", event.target.value)
                          }
                          placeholder="products/your-product.zip"
                          className="min-w-0 flex-1 rounded-2xl border border-[#dce4ef] bg-white px-4 py-3.5 text-sm font-semibold text-[#081529] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:ring-4 focus:ring-orange-100"
                        />

                        {form.filePath.trim() && (
                          <button
                            type="button"
                            disabled={uploadingFile}
                            onClick={() =>
                              handleChange("filePath", "")
                            }
                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <p className="mt-2 break-all text-xs text-[#9aa8bb]">
                        {form.filePath.trim()
                          ? `Assigned: ${form.filePath}`
                          : "No product file assigned yet."}
                      </p>
                    </div>
                  </div>
                </FormSection>
              </div>

              <div className="space-y-7">
                <FormSection
                  number="03"
                  title="Product images"
                  helper="Image 1 is the main cover. Recommended ratio: 4:3."
                >
                  <div className="grid gap-4">
                    <ImageUploadField
                      label="Image 1 (Main)"
                      value={form.imageUrl}
                      uploading={uploadingImage === 1}
                      deleting={deletingImage === 1}
                      onUpload={(file) =>
                        uploadProductImage(file, 1)
                      }
                      onChange={(value) =>
                        handleChange("imageUrl", value)
                      }
                      onClear={() =>
                        deleteProductImage(form.imageUrl, 1)
                      }
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <ImageUploadField
                        label="Image 2"
                        value={form.imageUrl2}
                        uploading={uploadingImage === 2}
                        deleting={deletingImage === 2}
                        onUpload={(file) =>
                          uploadProductImage(file, 2)
                        }
                        onChange={(value) =>
                          handleChange("imageUrl2", value)
                        }
                        onClear={() =>
                          deleteProductImage(form.imageUrl2, 2)
                        }
                      />

                      <ImageUploadField
                        label="Image 3"
                        value={form.imageUrl3}
                        uploading={uploadingImage === 3}
                        deleting={deletingImage === 3}
                        onUpload={(file) =>
                          uploadProductImage(file, 3)
                        }
                        onChange={(value) =>
                          handleChange("imageUrl3", value)
                        }
                        onClear={() =>
                          deleteProductImage(form.imageUrl3, 3)
                        }
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  number="04"
                  title="Publishing"
                  helper="Control store visibility and featured placement."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ToggleCard
                      title="Active product"
                      helper="Product can be sold in the store."
                      checked={form.isActive}
                      onChange={(checked) =>
                        handleChange("isActive", checked)
                      }
                    />

                    <ToggleCard
                      title="Featured"
                      helper="Highlight this product in the store."
                      checked={form.featured}
                      onChange={(checked) =>
                        handleChange("featured", checked)
                      }
                    />
                  </div>
                </FormSection>

                <div className="rounded-[26px] bg-[#071426] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                    Ready to publish
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    {editingId ? "Save product changes" : "Create product"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Review the product title, pricing, file and cover image
                    before saving.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-5 w-full rounded-2xl bg-[#ff6500] px-6 py-4 font-black text-white transition hover:bg-[#ff7420] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Product Changes"
                        : "Create Product"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-10 overflow-hidden rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
          <div className="grid gap-5 border-b border-[#e7edf4] p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
                Catalog
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                All products
              </h2>
              <p className="mt-2 text-[#718099]">
                {products.length} product{products.length === 1 ? "" : "s"} in
                Zonix Assets.
              </p>
            </div>

            <div className="w-full md:w-[390px]">
              <label className="mb-2 block text-sm font-black text-[#60718e]">
                Search
              </label>
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-5 py-4 text-[#081529] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-[320px] place-items-center">
              <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e7edf4] border-t-[#ff6500]" />
                <p className="mt-5 font-semibold text-[#718099]">
                  Loading products...
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-2xl text-[#ff6500]">
                  ✦
                </div>
                <h3 className="mt-5 text-2xl font-black">
                  No products found
                </h3>
                <p className="mt-2 text-[#718099]">
                  Create your first product using the form above.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e7edf4]">
              {filteredProducts.map((product) => {
                const imageCount = [
                  product.imageUrl,
                  product.imageUrl2,
                  product.imageUrl3,
                ].filter(Boolean).length;

                return (
                  <article
                    key={product.id}
                    className="p-6 transition hover:bg-[#fbfcfe] md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[170px_1fr_auto] xl:items-center">
                      <div className="overflow-hidden rounded-[22px] border border-[#e2e9f1] bg-[#f7f9fc]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center">
                            <div className="text-center">
                              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-[#ff6500]">
                                ✦
                              </div>
                              <p className="mt-2 text-xs font-bold text-[#9aa8bb]">
                                No cover image
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black tracking-tight">
                            {product.title}
                          </h3>

                          {product.featured && (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">
                              FEATURED
                            </span>
                          )}

                          <span
                            className={
                              product.isActive
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700"
                                : "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-black text-red-700"
                            }
                          >
                            {product.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-[#718099]">
                          /products/{product.slug}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaPill>{product.category}</MetaPill>
                          <MetaPill>{formatMoney(product.price)}</MetaPill>
                          <MetaPill>
                            {product.filePath ? "File assigned" : "No file"}
                          </MetaPill>
                          <MetaPill>
                            {imageCount}/3 images
                          </MetaPill>
                        </div>

                        {(product.imageUrl2 || product.imageUrl3) && (
                          <div className="mt-4 flex gap-2">
                            {[product.imageUrl2, product.imageUrl3]
                              .filter(Boolean)
                              .map((url, index) => (
                                <div
                                  key={`${product.id}-${index}`}
                                  className="h-14 w-20 overflow-hidden rounded-xl border border-[#e2e9f1]"
                                >
                                  <img
                                    src={String(url)}
                                    alt={`${product.title} preview ${index + 2}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 xl:max-w-[320px] xl:justify-end">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="rounded-xl border border-[#dce4ef] bg-white px-4 py-2.5 text-sm font-black text-[#53627a] transition hover:border-[#cbd6e4] hover:text-[#081529]"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-xl bg-[#081529] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ff6500]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFeatured(product)}
                          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 transition hover:bg-violet-100"
                        >
                          {product.featured ? "Unfeature" : "Feature"}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleActive(product)}
                          className={
                            product.isActive
                              ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                          }
                        >
                          {product.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          disabled={deleteId === product.id}
                          onClick={() => handleDelete(product)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                        >
                          {deleteId === product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
              Admin Products
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          <AdminNav href="/admin">Dashboard</AdminNav>
          <AdminNav href="/admin/products" active>
            Products
          </AdminNav>
          <AdminNav href="/admin/orders">Orders</AdminNav>
          <AdminNav href="/admin/customers">Customers</AdminNav>
          <AdminNav href="/admin/analytics">Analytics</AdminNav>
          <AdminNav href="/admin/audit-logs">Audit Logs</AdminNav>
        </nav>

        <Link
          href="/products"
          className="shrink-0 rounded-2xl bg-[#ff6500] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,101,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff7420]"
        >
          View Store
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
  tone: "orange" | "green" | "violet" | "slate";
}) {
  const tones = {
    orange: "bg-orange-50 text-[#ff6500]",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-[28px] border border-[#dce4ef] bg-white p-6 shadow-[0_16px_50px_rgba(20,35,60,.05)]">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${tones[tone]}`}>
        ✦
      </div>
      <p className="mt-5 font-bold text-[#60718e]">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-[#94a1b5]">{helper}</p>
    </div>
  );
}

function FormSection({
  number,
  title,
  helper,
  children,
}: {
  number: string;
  title: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#dce4ef] bg-white p-5 md:p-6">
      <div className="mb-5 flex gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-sm font-black text-[#ff6500]">
          {number}
        </div>

        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#718099]">{helper}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ToggleCard({
  title,
  helper,
  checked,
  onChange,
}: {
  title: string;
  helper: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border border-[#dce4ef] bg-[#f7f9fc] p-5">
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#718099]">{helper}</p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-[#ff6500]"
      />
    </label>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#dce4ef] bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#60718e]">
      {children}
    </span>
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
    <div>
      <label className="text-sm font-black text-[#53627a]">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 w-full rounded-2xl border border-[#dce4ef] bg-[#f7f9fc] px-4 py-3.5 text-[#081529] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:bg-white focus:ring-4 focus:ring-orange-100"
      />
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  uploading,
  deleting,
  onUpload,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  uploading: boolean;
  deleting: boolean;
  onUpload: (file: File) => void;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-[#dce4ef] bg-[#f7f9fc] p-4">
      <label className="text-sm font-black text-[#53627a]">{label}</label>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#e2e9f1] bg-white">
        {value.trim() ? (
          <img
            src={value.trim()}
            alt={`${label} preview`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-[#ff6500]">
                ✦
              </div>
              <p className="mt-2 text-xs font-bold text-[#9aa8bb]">
                No image selected
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <label
          className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#081529] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff6500] ${
            uploading || deleting
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          {uploading
            ? "Uploading..."
            : deleting
              ? "Please wait..."
              : "Choose & Upload"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading || deleting}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onUpload(file);
              }

              event.currentTarget.value = "";
            }}
          />
        </label>

        {value.trim() && (
          <button
            type="button"
            onClick={onClear}
            disabled={uploading || deleting}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Clear"}
          </button>
        )}
      </div>

      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or paste image URL..."
        className="mt-3 w-full rounded-xl border border-[#dce4ef] bg-white px-3 py-3 text-xs font-semibold text-[#53627a] outline-none transition placeholder:text-[#a8b4c5] focus:border-[#ff9b5c] focus:ring-4 focus:ring-orange-100"
      />
    </div>
  );
}
