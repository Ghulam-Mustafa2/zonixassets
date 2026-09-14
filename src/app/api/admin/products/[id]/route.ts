import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  is_active?: boolean | null;
};

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  price: number | string;
  featured: boolean;
  is_active: boolean;
  file_path: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  created_at?: string;
};

type UpdateProductBody = {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  price?: number | string;
  featured?: boolean;
  isActive?: boolean;
  filePath?: string | null;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      error: "Supabase configuration is missing.",
      status: 500,
      supabaseUrl: null,
      supabaseKey: null,
      accessToken: null,
      user: null,
      profile: null,
    };
  }

  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get("pakstore-access-token")?.value;

  if (!accessToken) {
    return {
      error: "You must be signed in.",
      status: 401,
      supabaseUrl,
      supabaseKey,
      accessToken: null,
      user: null,
      profile: null,
    };
  }

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const user = await userResponse.json();

  if (!userResponse.ok || !user?.id) {
    return {
      error:
        "Your session is invalid or expired.",
      status: 401,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user: null,
      profile: null,
    };
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,email,role,is_active`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const profileData =
    await profileResponse.json();

  if (!profileResponse.ok) {
    return {
      error:
        profileData?.message ||
        "Unable to verify admin account.",
      status:
        profileResponse.status || 500,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile: null,
    };
  }

  const profile =
    Array.isArray(profileData)
      ? (profileData[0] as
          | ProfileRow
          | undefined)
      : undefined;

  if (!profile) {
    return {
      error: "Profile not found.",
      status: 404,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile: null,
    };
  }

  if (
    profile.role?.toUpperCase() !==
      "ADMIN" ||
    profile.is_active === false
  ) {
    return {
      error:
        "You do not have permission to manage products.",
      status: 403,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile,
    };
  }

  return {
    error: null,
    status: 200,
    supabaseUrl,
    supabaseKey,
    accessToken,
    user,
    profile,
  };
}

/*
  GET /api/admin/products/[id]
*/

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await getAdminAuth();

    if (
      auth.error ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "Unable to verify admin.",
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } =
      await context.params;

    const productId =
      id?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
        productId
      )}&select=id,title,slug,description,category,price,featured,is_active,file_path,image_url,image_url_2,image_url_3,created_at`,
      {
        method: "GET",
        headers: {
          apikey:
            auth.supabaseKey,
          Authorization:
            `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "ADMIN_PRODUCT_GET_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.message ||
            "Unable to load product.",
        },
        {
          status:
            response.status || 500,
        }
      );
    }

    const product =
      Array.isArray(data)
        ? (data[0] as
            | ProductRow
            | undefined)
        : undefined;

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          description:
            product.description || "",
          category:
            product.category,
          price:
            Number(product.price || 0),
          featured:
            Boolean(product.featured),
          isActive:
            product.is_active !== false,
          filePath:
            product.file_path,
          imageUrl:
            product.image_url,
          imageUrl2:
            product.image_url_2,
          imageUrl3:
            product.image_url_3,
          createdAt:
            product.created_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_PRODUCT_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading the product.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  PATCH /api/admin/products/[id]
*/

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await getAdminAuth();

    if (
      auth.error ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "Unable to verify admin.",
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } =
      await context.params;

    const productId =
      id?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Check product exists
    */

    const existingResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
          productId
        )}&select=id,slug`,
        {
          method: "GET",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const existingData =
      await existingResponse.json();

    if (!existingResponse.ok) {
      return NextResponse.json(
        {
          error:
            existingData?.message ||
            "Unable to verify product.",
        },
        {
          status: 500,
        }
      );
    }

    const existingProduct =
      Array.isArray(existingData)
        ? existingData[0]
        : undefined;

    if (!existingProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      (await request.json()) as UpdateProductBody;

    const updates: Record<
      string,
      unknown
    > = {};

    /*
      Title
    */

    if (
      body.title !== undefined
    ) {
      const title =
        typeof body.title ===
        "string"
          ? body.title.trim()
          : "";

      if (!title) {
        return NextResponse.json(
          {
            error:
              "Product title cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (title.length > 160) {
        return NextResponse.json(
          {
            error:
              "Product title is too long.",
          },
          {
            status: 400,
          }
        );
      }

      updates.title = title;
    }

    /*
      Slug
    */

    if (
      body.slug !== undefined
    ) {
      const slug =
        typeof body.slug ===
        "string"
          ? body.slug
              .trim()
              .toLowerCase()
          : "";

      if (!slug) {
        return NextResponse.json(
          {
            error:
              "Product slug cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          slug
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Slug can only contain lowercase letters, numbers and hyphens.",
          },
          {
            status: 400,
          }
        );
      }

      /*
        Duplicate slug check
      */

      const duplicateResponse =
        await fetch(
          `${auth.supabaseUrl}/rest/v1/products?slug=eq.${encodeURIComponent(
            slug
          )}&id=neq.${encodeURIComponent(
            productId
          )}&select=id`,
          {
            method: "GET",
            headers: {
              apikey:
                auth.supabaseKey,
              Authorization:
                `Bearer ${auth.accessToken}`,
            },
            cache: "no-store",
          }
        );

      const duplicateData =
        await duplicateResponse.json();

      if (!duplicateResponse.ok) {
        return NextResponse.json(
          {
            error:
              duplicateData?.message ||
              "Unable to verify product slug.",
          },
          {
            status: 500,
          }
        );
      }

      if (
        Array.isArray(
          duplicateData
        ) &&
        duplicateData.length > 0
      ) {
        return NextResponse.json(
          {
            error:
              "Another product already uses this slug.",
          },
          {
            status: 409,
          }
        );
      }

      updates.slug = slug;
    }

    /*
      Description
    */

    if (
      body.description !==
      undefined
    ) {
      updates.description =
        typeof body.description ===
        "string"
          ? body.description.trim()
          : "";
    }

    /*
      Category
    */

    if (
      body.category !== undefined
    ) {
      const category =
        typeof body.category ===
        "string"
          ? body.category.trim()
          : "";

      if (!category) {
        return NextResponse.json(
          {
            error:
              "Category cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updates.category =
        category;
    }

    /*
      Price
    */

    if (
      body.price !== undefined
    ) {
      const price =
        Number(body.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Enter a valid product price.",
          },
          {
            status: 400,
          }
        );
      }

      updates.price = price;
    }

    /*
      Featured
    */

    if (
      body.featured !== undefined
    ) {
      updates.featured =
        body.featured === true;
    }

    /*
      Active
    */

    if (
      body.isActive !==
      undefined
    ) {
      updates.is_active =
        body.isActive === true;
    }

    /*
      File path
    */

    if (
      body.filePath !==
      undefined
    ) {
      updates.file_path =
        typeof body.filePath ===
        "string"
          ? body.filePath.trim() ||
            null
          : null;
    }

    /*
      Product image URLs
    */

    const imageUpdates = [
      {
        bodyKey: "imageUrl",
        column: "image_url",
        label: "Image 1",
      },
      {
        bodyKey: "imageUrl2",
        column: "image_url_2",
        label: "Image 2",
      },
      {
        bodyKey: "imageUrl3",
        column: "image_url_3",
        label: "Image 3",
      },
    ] as const;

    for (const image of imageUpdates) {
      const rawValue =
        body[image.bodyKey];

      if (rawValue === undefined) {
        continue;
      }

      const imageUrl =
        typeof rawValue === "string"
          ? rawValue.trim() || null
          : null;

      if (imageUrl) {
        try {
          const parsedUrl =
            new URL(imageUrl);

          if (
            parsedUrl.protocol !==
              "http:" &&
            parsedUrl.protocol !==
              "https:"
          ) {
            throw new Error(
              "Invalid protocol"
            );
          }
        } catch {
          return NextResponse.json(
            {
              error:
                `${image.label} URL must be a valid http or https URL.`,
            },
            {
              status: 400,
            }
          );
        }
      }

      updates[image.column] =
        imageUrl;
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No product changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Update product
    */

    const updateResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
          productId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            apikey:
              auth.supabaseKey,

            Authorization:
              `Bearer ${auth.accessToken}`,

            Prefer:
              "return=representation",
          },

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    const updatedData =
      await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        "ADMIN_PRODUCT_UPDATE_ERROR:",
        updatedData
      );

      return NextResponse.json(
        {
          error:
            updatedData?.message ||
            "Unable to update product.",
        },
        {
          status:
            updateResponse.status ||
            500,
        }
      );
    }

    const product =
      Array.isArray(updatedData)
        ? updatedData[0]
        : updatedData;

    if (!product?.id) {
      return NextResponse.json(
        {
          error:
            "Product was not updated correctly.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Product updated successfully.",

        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          description:
            product.description || "",
          category:
            product.category,
          price:
            Number(product.price || 0),
          featured:
            Boolean(product.featured),
          isActive:
            product.is_active !== false,
          filePath:
            product.file_path,
          imageUrl:
            product.image_url,
          imageUrl2:
            product.image_url_2,
          imageUrl3:
            product.image_url_3,
          createdAt:
            product.created_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_PRODUCT_UPDATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the product.",
      },
      {
        status: 500,
      }
    );
  }
}

function extractProductImageStoragePath(
  imageUrl: string | null | undefined,
  supabaseUrl: string
) {
  if (!imageUrl) {
    return null;
  }

  const publicPrefix =
    `${supabaseUrl}/storage/v1/object/public/product-images/`;

  if (!imageUrl.startsWith(publicPrefix)) {
    return null;
  }

  const rawPath =
    imageUrl.slice(publicPrefix.length);

  if (!rawPath) {
    return null;
  }

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function extractProductFileStoragePath(
  filePath: string | null | undefined,
  supabaseUrl: string
) {
  if (!filePath) {
    return null;
  }

  const trimmedPath = filePath.trim();

  if (!trimmedPath) {
    return null;
  }

  /*
    Normal case from our upload-file route:
    products/123-file.zip
  */
  if (
    !trimmedPath.startsWith("http://") &&
    !trimmedPath.startsWith("https://")
  ) {
    return trimmedPath.replace(/^\/+/, "");
  }

  /*
    Also support a Supabase Storage URL if one
    was manually saved in the database.
  */
  const publicPrefix =
    `${supabaseUrl}/storage/v1/object/public/product-files/`;

  const authenticatedPrefix =
    `${supabaseUrl}/storage/v1/object/authenticated/product-files/`;

  const objectPrefix =
    `${supabaseUrl}/storage/v1/object/product-files/`;

  const matchingPrefix = [
    publicPrefix,
    authenticatedPrefix,
    objectPrefix,
  ].find((prefix) =>
    trimmedPath.startsWith(prefix)
  );

  if (!matchingPrefix) {
    return null;
  }

  const rawPath =
    trimmedPath.slice(
      matchingPrefix.length
    );

  if (!rawPath) {
    return null;
  }

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}


function encodeStorageObjectPath(
  storagePath: string
) {
  return storagePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

/*
  DELETE /api/admin/products/[id]
*/

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await getAdminAuth();

    if (
      auth.error ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "Unable to verify admin.",
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } =
      await context.params;

    const productId =
      id?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Load product first so we still have
      its image URLs before deleting it.
    */

    const productResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
          productId
        )}&select=id,title,file_path,image_url,image_url_2,image_url_3`,
        {
          method: "GET",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const productData =
      await productResponse
        .json()
        .catch(() => null);

    if (!productResponse.ok) {
      return NextResponse.json(
        {
          error:
            productData?.message ||
            "Unable to verify product.",
        },
        {
          status:
            productResponse.status || 500,
        }
      );
    }

    const product =
      Array.isArray(productData)
        ? productData[0]
        : undefined;

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Delete product from database first.

      Image cleanup happens immediately after.
      This avoids leaving a product record
      pointing to files that were already removed
      if the database delete itself fails.
    */

    const deleteResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
          productId
        )}`,
        {
          method: "DELETE",

          headers: {
            apikey:
              auth.supabaseKey,

            Authorization:
              `Bearer ${auth.accessToken}`,

            Prefer:
              "return=representation",
          },
        }
      );

    const deletedData =
      await deleteResponse
        .json()
        .catch(() => null);

    if (!deleteResponse.ok) {
      console.error(
        "ADMIN_PRODUCT_DELETE_ERROR:",
        deletedData
      );

      return NextResponse.json(
        {
          error:
            deletedData?.message ||
            "Unable to delete product.",
        },
        {
          status:
            deleteResponse.status ||
            500,
        }
      );
    }

    /*
      Clean up any images that belong to
      our public product-images bucket.

      External/manual image URLs are ignored.
    */

    const imageUrls = [
      product.image_url,
      product.image_url_2,
      product.image_url_3,
    ];

    const storagePaths = Array.from(
      new Set(
        imageUrls
          .map((imageUrl) =>
            extractProductImageStoragePath(
              imageUrl,
              auth.supabaseUrl
            )
          )
          .filter(
            (
              storagePath
            ): storagePath is string =>
              Boolean(storagePath)
          )
      )
    );

    const deletedImagePaths: string[] = [];
    const failedImagePaths: string[] = [];

    for (const storagePath of storagePaths) {
      const storageDeleteResponse =
        await fetch(
          `${auth.supabaseUrl}/storage/v1/object/product-images/${encodeStorageObjectPath(
            storagePath
          )}`,
          {
            method: "DELETE",
            headers: {
              apikey:
                auth.supabaseKey,
              Authorization:
                `Bearer ${auth.accessToken}`,
            },
          }
        );

      if (storageDeleteResponse.ok) {
        deletedImagePaths.push(
          storagePath
        );
        continue;
      }

      const storageError =
        await storageDeleteResponse
          .json()
          .catch(() => null);

      console.error(
        "ADMIN_PRODUCT_IMAGE_CLEANUP_ERROR:",
        {
          productId,
          storagePath,
          status:
            storageDeleteResponse.status,
          details:
            storageError,
        }
      );

      failedImagePaths.push(
        storagePath
      );
    }

    /*
      Clean up the downloadable product file from
      the private product-files bucket.

      Our upload-file route stores paths like:
      products/123-product.zip

      If the database contains some unrelated
      external URL, it is ignored safely.
    */

    const productFilePath =
      extractProductFileStoragePath(
        product.file_path,
        auth.supabaseUrl
      );

    let fileCleanupAttempted = 0;
    let fileCleanupDeleted = 0;
    let fileCleanupFailed = 0;
    let deletedFilePath: string | null = null;
    let failedFilePath: string | null = null;

    if (productFilePath) {
      fileCleanupAttempted = 1;

      const fileDeleteResponse =
        await fetch(
          `${auth.supabaseUrl}/storage/v1/object/product-files/${encodeStorageObjectPath(
            productFilePath
          )}`,
          {
            method: "DELETE",
            headers: {
              apikey:
                auth.supabaseKey,
              Authorization:
                `Bearer ${auth.accessToken}`,
            },
          }
        );

      if (fileDeleteResponse.ok) {
        fileCleanupDeleted = 1;
        deletedFilePath =
          productFilePath;
      } else {
        const fileStorageError =
          await fileDeleteResponse
            .json()
            .catch(() => null);

        console.error(
          "ADMIN_PRODUCT_FILE_CLEANUP_ERROR:",
          {
            productId,
            storagePath:
              productFilePath,
            status:
              fileDeleteResponse.status,
            details:
              fileStorageError,
          }
        );

        fileCleanupFailed = 1;
        failedFilePath =
          productFilePath;
      }
    }

    const cleanupHasFailures =
      failedImagePaths.length > 0 ||
      fileCleanupFailed > 0;

    return NextResponse.json(
      {
        success: true,

        message:
          cleanupHasFailures
            ? `${product.title} deleted successfully, but some storage files could not be removed.`
            : `${product.title} deleted successfully.`,

        deletedProductId:
          productId,

        imageCleanup: {
          attempted:
            storagePaths.length,
          deleted:
            deletedImagePaths.length,
          failed:
            failedImagePaths.length,
          deletedPaths:
            deletedImagePaths,
          failedPaths:
            failedImagePaths,
        },

        fileCleanup: {
          attempted:
            fileCleanupAttempted,
          deleted:
            fileCleanupDeleted,
          failed:
            fileCleanupFailed,
          deletedPath:
            deletedFilePath,
          failedPath:
            failedFilePath,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_PRODUCT_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while deleting the product.",
      },
      {
        status: 500,
      }
    );
  }
}
