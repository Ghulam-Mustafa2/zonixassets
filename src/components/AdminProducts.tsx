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
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold"
            >
              Zonix
              <span className="text-emerald-400">
                Assets
              </span>
            </Link>

            <p className="mt-1 text-xs text-white/35">
              Product Management
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/products"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              View Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* TITLE */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm text-emerald-400">
              Admin
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              Manage Products
            </h1>

            <p className="mt-3 text-white/45">
              Create, edit, feature,
              activate and manage digital
              products.
            </p>
          </div>

          <button
            onClick={loadProducts}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            Refresh Products
          </button>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* FORM */}

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-400">
                {editingId
                  ? "Editing Product"
                  : "New Product"}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {editingId
                  ? "Update Product"
                  : "Add Product"}
              </h2>
            </div>

            {editingId && (
              <button
                onClick={resetForm}
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Product Title"
                value={form.title}
                placeholder="Nova Dashboard UI"
                onChange={
                  handleTitleChange
                }
              />

              <Field
                label="Slug"
                value={form.slug}
                placeholder="nova-dashboard-ui"
                onChange={(value) =>
                  handleChange(
                    "slug",
                    createSlug(value)
                  )
                }
              />

              <div>
                <label className="text-sm text-white/45">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    handleChange(
                      "category",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-emerald-400/40"
                >
                  <option value="">
                    Select a category
                  </option>

                  {PRODUCT_CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
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
                  handleChange(
                    "price",
                    value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-white/45">
                Description
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Describe your digital product..."
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-white/45">
                    Product Download File
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/30">
                    Upload the digital product directly to the private{" "}
                    <strong className="text-white/50">
                      product-files
                    </strong>{" "}
                    bucket. Maximum file size: 50 MB.
                  </p>
                </div>

                <label
                  className={`inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 ${
                    uploadingFile
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  {uploadingFile
                    ? "Uploading File..."
                    : form.filePath.trim()
                    ? "Replace File"
                    : "Choose & Upload File"}

                  <input
                    type="file"
                    disabled={uploadingFile}
                    className="hidden"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0];

                      if (file) {
                        uploadProductFile(file);
                      }

                      event.currentTarget.value =
                        "";
                    }}
                  />
                </label>
              </div>

              <div className="mt-4">
                <label className="text-xs text-white/35">
                  Storage File Path
                </label>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={form.filePath}
                    onChange={(event) =>
                      handleChange(
                        "filePath",
                        event.target.value
                      )
                    }
                    placeholder="products/your-product.zip"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40"
                  />

                  {form.filePath.trim() && (
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() =>
                        handleChange(
                          "filePath",
                          ""
                        )
                      }
                      className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {form.filePath.trim() ? (
                  <p className="mt-2 break-all text-xs text-emerald-300/70">
                    Assigned: {form.filePath}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-white/25">
                    No product file assigned yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-white/45">
                Product Images
              </p>

              <p className="mt-1 text-xs text-white/30">
                Upload up to 3 images directly from your computer.
                Image 1 is the main cover image. You can still paste
                a public URL manually if needed. Recommended ratio:
                4:3, for example 1200 × 900 px.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
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
                  deleteProductImage(
                    form.imageUrl,
                    1
                  )
                }
              />

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
                  deleteProductImage(
                    form.imageUrl2,
                    2
                  )
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
                  deleteProductImage(
                    form.imageUrl3,
                    3
                  )
                }
              />
            </div>

            {(form.imageUrl.trim() ||
              form.imageUrl2.trim() ||
              form.imageUrl3.trim()) && (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Main Image",
                    url: form.imageUrl.trim(),
                  },
                  {
                    label: "Preview 2",
                    url: form.imageUrl2.trim(),
                  },
                  {
                    label: "Preview 3",
                    url: form.imageUrl3.trim(),
                  },
                ].map((image) => (
                  <div
                    key={image.label}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black"
                  >
                    <div className="border-b border-white/10 px-4 py-3 text-xs text-white/40">
                      {image.label}
                    </div>

                    {image.url ? (
                      <img
                        src={image.url}
                        alt={image.label}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-white/20">
                        No image
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black px-5 py-4">
                <div>
                  <p className="font-medium">
                    Active Product
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Product can be sold in
                    the marketplace.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.isActive
                  }
                  onChange={(event) =>
                    handleChange(
                      "isActive",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-emerald-400"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black px-5 py-4">
                <div>
                  <p className="font-medium">
                    Featured
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Highlight this product
                    in the store.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.featured
                  }
                  onChange={(event) =>
                    handleChange(
                      "featured",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-emerald-400"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-400 px-7 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save Product Changes"
                : "Create Product"}
            </button>
          </form>
        </section>

        {/* PRODUCTS */}

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col gap-5 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-sm text-emerald-400">
                Catalog
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                All Products
              </h2>

              <p className="mt-2 text-sm text-white/35">
                {products.length} product
                {products.length === 1
                  ? ""
                  : "s"}{" "}
                in Zonix Assets
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-emerald-400/40 md:max-w-sm"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-white/40">
              Loading products...
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="py-16 text-center">
              <h3 className="font-semibold">
                No products found
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Create your first product
                using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="p-6 md:p-8"
                  >
                    <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {
                              product.title
                            }
                          </h3>

                          {product.featured && (
                            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs text-purple-300">
                              FEATURED
                            </span>
                          )}

                          <span
                            className={
                              product.isActive
                                ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300"
                                : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs text-red-300"
                            }
                          >
                            {product.isActive
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/45">
                          /products/
                          {product.slug}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
                          <span>
                            Category:{" "}
                            {
                              product.category
                            }
                          </span>

                          <span>
                            Price:{" "}
                            <strong className="text-white">
                              {formatMoney(
                                product.price
                              )}
                            </strong>
                          </span>

                          <span>
                            File:{" "}
                            {product.filePath ||
                              "Not assigned"}
                          </span>

                          <span>
                            Images:{" "}
                            {
                              [
                                product.imageUrl,
                                product.imageUrl2,
                                product.imageUrl3,
                              ].filter(Boolean).length
                            }
                            /3 assigned
                          </span>
                        </div>

                        {(product.imageUrl ||
                          product.imageUrl2 ||
                          product.imageUrl3) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              product.imageUrl,
                              product.imageUrl2,
                              product.imageUrl3,
                            ].map((url, index) =>
                              url ? (
                                <div
                                  key={`${product.id}-image-${index + 1}`}
                                  className="h-20 w-28 overflow-hidden rounded-xl border border-white/10 bg-black"
                                >
                                  <img
                                    src={url}
                                    alt={`${product.title} preview ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              product
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleFeatured(
                              product
                            )
                          }
                          className="rounded-xl border border-purple-400/20 bg-purple-400/5 px-4 py-2 text-sm text-purple-300 transition hover:bg-purple-400/10"
                        >
                          {product.featured
                            ? "Unfeature"
                            : "Feature"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              product
                            )
                          }
                          className={
                            product.isActive
                              ? "rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 text-sm text-yellow-300 transition hover:bg-yellow-400/10"
                              : "rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-400/10"
                          }
                        >
                          {product.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            deleteId ===
                            product.id
                          }
                          onClick={() =>
                            handleDelete(
                              product
                            )
                          }
                          className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
                        >
                          {deleteId ===
                          product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
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
      <label className="text-sm text-white/45">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40"
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
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <label className="text-sm text-white/45">
        {label}
      </label>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        {value.trim() ? (
          <img
            src={value.trim()}
            alt={`${label} preview`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-white/20">
            No image selected
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300">
          {uploading
            ? "Uploading..."
            : deleting
            ? "Please wait..."
            : "Choose & Upload"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
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
            className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Clear"}
          </button>
        )}
      </div>

      <input
        type="url"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Or paste image URL..."
        className="mt-3 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40"
      />
    </div>
  );
}

