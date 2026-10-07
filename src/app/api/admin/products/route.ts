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
  product_type: string | null;
  price: number | string;
  featured: boolean;
  is_active: boolean;
  file_path: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  demo_url: string | null;
  tech_stack: string | null;
  file_format: string | null;
  license_type: string | null;
  package_contents: string | null;
  file_size_bytes: number | string | null;
  updated_at?: string | null;
  created_at?: string;
};

type CreateProductBody = {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  productType?: string;
  price?: number | string;
  featured?: boolean;
  isActive?: boolean;
  filePath?: string | null;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  demoUrl?: string | null;
  techStack?: string | null;
  fileFormat?: string | null;
  licenseType?: string | null;
  packageContents?: string | null;
  fileSizeBytes?: number | string | null;
};

function normalizeProductType(value: unknown) {
  const normalized =
    typeof value === "string"
      ? value
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_")
      : "";

  if (
    normalized === "DIGITAL_DOWNLOAD" ||
    normalized === "DIGITAL" ||
    normalized === "DOWNLOAD" ||
    normalized === "DIGITAL_PRODUCT"
  ) {
    return "DIGITAL_DOWNLOAD";
  }

  if (
    normalized === "AI_RENTAL" ||
    normalized === "AI_RENTAL_SERVICE" ||
    normalized === "MANAGED_AI_SERVICE"
  ) {
    return "AI_RENTAL";
  }

  return normalized;
}


async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
    cookieStore.get(
      "pakstore-access-token"
    )?.value;

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

  /*
    Verify Supabase user
  */

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const user =
    await userResponse.json();

  if (
    !userResponse.ok ||
    !user?.id
  ) {
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

  /*
    Load profile role
  */

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
      )}&select=id,email,role,is_active`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
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

  /*
    Single-owner protection.

    OWNER_ADMIN_USER_ID must match the one Supabase Auth user
    who owns and operates ZonixAssets. A second profile with an
    ADMIN role will still be denied access to this route.
  */

  const ownerAdminUserId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      error:
        "OWNER_ADMIN_USER_ID is not configured.",
      status: 500,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile,
    };
  }

  if (user.id !== ownerAdminUserId) {
    return {
      error:
        "This store is restricted to one owner administrator.",
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
  ==========================================================
  GET /api/admin/products

  Return all products for admin panel.
  ==========================================================
*/

export async function GET() {
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

    const response =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?select=id,title,slug,description,category,product_type,price,featured,is_active,file_path,image_url,image_url_2,image_url_3,demo_url,tech_stack,file_format,license_type,package_contents,file_size_bytes,updated_at,created_at&order=created_at.desc`,
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
        "ADMIN_PRODUCTS_GET_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.message ||
            "Unable to load products.",
        },
        {
          status:
            response.status || 500,
        }
      );
    }

    const products =
      Array.isArray(data)
        ? (data as ProductRow[])
        : [];

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products: products.map(
          (product) => ({
            id: product.id,

            title:
              product.title,

            slug:
              product.slug,

            description:
              product.description ||
              "",

            category:
              product.category,

            productType:
              normalizeProductType(product.product_type) ||
              "DIGITAL_DOWNLOAD",

            price:
              Number(
                product.price || 0
              ),

            featured:
              Boolean(
                product.featured
              ),

            isActive:
              product.is_active !==
              false,

            filePath:
              product.file_path,

            imageUrl:
              product.image_url,

            imageUrl2:
              product.image_url_2,

            imageUrl3:
              product.image_url_3,

            demoUrl:
              product.demo_url,

            techStack:
              product.tech_stack,

            fileFormat:
              product.file_format,

            licenseType:
              product.license_type,

            packageContents:
              product.package_contents,

            fileSizeBytes:
              product.file_size_bytes == null
                ? null
                : Number(product.file_size_bytes),

            updatedAt:
              product.updated_at,

            createdAt:
              product.created_at,
          })
        ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_PRODUCTS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading products.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ==========================================================
  POST /api/admin/products

  Create a new digital product.
  ==========================================================
*/

export async function POST(
  request: Request
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

    const body =
      (await request.json()) as CreateProductBody;

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug
            .trim()
            .toLowerCase()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const productType =
      normalizeProductType(body.productType) ||
      "DIGITAL_DOWNLOAD";

    const price =
      Number(body.price);

    const featured =
      body.featured === true;

    const isActive =
      body.isActive !== false;

    const filePath =
      typeof body.filePath === "string"
        ? body.filePath.trim() ||
          null
        : null;

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim() ||
          null
        : null;

    const imageUrl2 =
      typeof body.imageUrl2 === "string"
        ? body.imageUrl2.trim() ||
          null
        : null;

    const imageUrl3 =
      typeof body.imageUrl3 === "string"
        ? body.imageUrl3.trim() ||
          null
        : null;

    const demoUrl =
      typeof body.demoUrl === "string"
        ? body.demoUrl.trim() || null
        : null;

    const techStack =
      typeof body.techStack === "string"
        ? body.techStack.trim() || null
        : null;

    const fileFormat =
      typeof body.fileFormat === "string"
        ? body.fileFormat.trim() || null
        : null;

    const licenseType =
      typeof body.licenseType === "string"
        ? body.licenseType.trim() || null
        : null;

    const packageContents =
      typeof body.packageContents === "string"
        ? body.packageContents.trim() || null
        : null;

    const fileSizeBytes =
      body.fileSizeBytes === null ||
      body.fileSizeBytes === undefined ||
      body.fileSizeBytes === ""
        ? null
        : Number(body.fileSizeBytes);

    /*
      Validation
    */

    if (!title) {
      return NextResponse.json(
        {
          error:
            "Product title is required.",
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

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Product slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Only URL-safe slugs.
    */

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

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Product category is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      productType !== "DIGITAL_DOWNLOAD" &&
      productType !== "AI_RENTAL"
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported product type.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (demoUrl) {
      try {
        const parsedUrl = new URL(demoUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          {
            error:
              "Live demo URL must be a valid http or https URL.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      fileSizeBytes !== null &&
      (!Number.isFinite(fileSizeBytes) ||
        fileSizeBytes < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "File size must be a valid non-negative number of bytes.",
        },
        {
          status: 400,
        }
      );
    }

    const imageUrls = [
      {
        label: "Image 1",
        value: imageUrl,
      },
      {
        label: "Image 2",
        value: imageUrl2,
      },
      {
        label: "Image 3",
        value: imageUrl3,
      },
    ];

    for (const image of imageUrls) {
      if (!image.value) {
        continue;
      }

      try {
        const parsedUrl =
          new URL(image.value);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
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

    /*
      Check slug uniqueness
    */

    const existingResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products?slug=eq.${encodeURIComponent(
          slug
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

    const existingData =
      await existingResponse.json();

    if (!existingResponse.ok) {
      console.error(
        "ADMIN_PRODUCT_SLUG_CHECK_ERROR:",
        existingData
      );

      return NextResponse.json(
        {
          error:
            existingData?.message ||
            "Unable to verify product slug.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      Array.isArray(existingData) &&
      existingData.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "A product with this slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      Create product
    */

    const createResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/products`,
        {
          method: "POST",

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

          body: JSON.stringify({
            title,
            slug,
            description,
            category,
            product_type:
              productType,
            price,
            featured,
            is_active:
              isActive,
            file_path:
              filePath,
            image_url:
              imageUrl,
            image_url_2:
              imageUrl2,
            image_url_3:
              imageUrl3,
            demo_url:
              demoUrl,
            tech_stack:
              techStack,
            file_format:
              fileFormat,
            license_type:
              licenseType,
            package_contents:
              packageContents,
            file_size_bytes:
              fileSizeBytes,
          }),
        }
      );

    const createdData =
      await createResponse.json();

    if (!createResponse.ok) {
      console.error(
        "ADMIN_PRODUCT_CREATE_ERROR:",
        createdData
      );

      return NextResponse.json(
        {
          error:
            createdData?.message ||
            "Unable to create product.",
        },
        {
          status:
            createResponse.status ||
            500,
        }
      );
    }

    const product =
      Array.isArray(createdData)
        ? createdData[0]
        : createdData;

    if (!product?.id) {
      return NextResponse.json(
        {
          error:
            "Product was not created correctly.",
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
          "Product created successfully.",

        product: {
          id: product.id,

          title:
            product.title,

          slug:
            product.slug,

          description:
            product.description ||
            "",

          category:
            product.category,

          productType:
            normalizeProductType(product.product_type) ||
            "DIGITAL_DOWNLOAD",

          price:
            Number(
              product.price || 0
            ),

          featured:
            Boolean(
              product.featured
            ),

          isActive:
            product.is_active !==
            false,

          filePath:
            product.file_path ||
            null,

          imageUrl:
            product.image_url ||
            null,

          imageUrl2:
            product.image_url_2 ||
            null,

          imageUrl3:
            product.image_url_3 ||
            null,

          demoUrl:
            product.demo_url ||
            null,

          techStack:
            product.tech_stack ||
            null,

          fileFormat:
            product.file_format ||
            null,

          licenseType:
            product.license_type ||
            null,

          packageContents:
            product.package_contents ||
            null,

          fileSizeBytes:
            product.file_size_bytes == null
              ? null
              : Number(product.file_size_bytes),

          updatedAt:
            product.updated_at ||
            null,

          createdAt:
            product.created_at,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_PRODUCT_CREATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the product.",
      },
      {
        status: 500,
      }
    );
  }
}