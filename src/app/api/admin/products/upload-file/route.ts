import { NextRequest, NextResponse } from "next/server";

type AdminAuthSuccess = {
  ok: true;
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
};

type AdminAuthFailure = {
  ok: false;
  response: NextResponse;
};

type AdminAuthResult =
  | AdminAuthSuccess
  | AdminAuthFailure;

const MAX_FILE_SIZE =
  50 * 1024 * 1024; // 50 MB

async function getAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Supabase is not configured.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  const accessToken =
    request.cookies.get(
      "pakstore-access-token"
    )?.value ||
    request.cookies.get(
      "sb-access-token"
    )?.value ||
    request.cookies.get(
      "access_token"
    )?.value;

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const user =
    await userResponse
      .json()
      .catch(() => null);

  if (
    !userResponse.ok ||
    !user?.id
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid session.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
      )}&select=id,role,is_active&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

  const profileData =
    await profileResponse
      .json()
      .catch(() => null);

  if (!profileResponse.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Unable to verify admin account.",
        },
        {
          status:
            profileResponse.status,
        }
      ),
    };
  }

  const profile =
    Array.isArray(profileData)
      ? profileData[0]
      : null;

  if (
    !profile ||
    String(
      profile.role || ""
    ).toUpperCase() !== "ADMIN" ||
    profile.is_active === false
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    ok: true,
    supabaseUrl,
    supabaseKey,
    accessToken,
  };
}

function sanitizeFileName(
  fileName: string
) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9.\-_]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const formData =
      await request.formData();

    const uploadedFile =
      formData.get("file");

    if (
      !uploadedFile ||
      !(uploadedFile instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Product file is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      uploadedFile.size <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      uploadedFile.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Product file must be 50 MB or smaller.",
        },
        {
          status: 400,
        }
      );
    }

    const safeName =
      sanitizeFileName(
        uploadedFile.name
      );

    const finalName =
      safeName ||
      `product-file-${Date.now()}`;

    const uniqueFileName =
      `${Date.now()}-${crypto.randomUUID()}-${finalName}`;

    const storagePath =
      `products/${uniqueFileName}`;

    const fileBuffer =
      await uploadedFile.arrayBuffer();

    const uploadResponse =
      await fetch(
        `${auth.supabaseUrl}/storage/v1/object/product-files/${storagePath
          .split("/")
          .map((part) =>
            encodeURIComponent(part)
          )
          .join("/")}`,
        {
          method: "POST",

          headers: {
            apikey:
              auth.supabaseKey,

            Authorization:
              `Bearer ${auth.accessToken}`,

            "Content-Type":
              uploadedFile.type ||
              "application/octet-stream",

            "x-upsert": "false",
          },

          body: fileBuffer,
        }
      );

    const uploadResult =
      await uploadResponse
        .json()
        .catch(() => null);

    if (!uploadResponse.ok) {
      console.error(
        "PRODUCT_FILE_UPLOAD_ERROR:",
        uploadResult
      );

      return NextResponse.json(
        {
          error:
            uploadResult?.message ||
            uploadResult?.error ||
            "Unable to upload product file.",

          details:
            uploadResult,
        },
        {
          status:
            uploadResponse.status,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        storagePath,

        fileName:
          finalName,

        size:
          uploadedFile.size,

        mimeType:
          uploadedFile.type ||
          "application/octet-stream",

        message:
          "Product file uploaded successfully.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_FILE_UPLOAD_ROUTE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while uploading the product file.",
      },
      {
        status: 500,
      }
    );
  }
}