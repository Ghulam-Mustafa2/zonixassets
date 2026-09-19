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
          error: "Supabase is not configured.",
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
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const user = await userResponse
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

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,role,is_active&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const profileData = await profileResponse
    .json()
    .catch(() => null);

  if (!profileResponse.ok) {
    console.error(
      "DELETE_IMAGE_PROFILE_ERROR:",
      profileData
    );

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
    String(profile.role || "").toUpperCase() !==
      "ADMIN" ||
    profile.is_active === false
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  /*
    Single-owner protection.

    OWNER_ADMIN_USER_ID must match the one Supabase Auth user
    who owns and operates ZonixAssets. Even if another profile
    is accidentally assigned ADMIN, this route will deny it.
  */
  const ownerAdminUserId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "OWNER_ADMIN_USER_ID is not configured.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  if (user.id !== ownerAdminUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "This store is restricted to one owner administrator.",
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

function extractStoragePath(
  imageUrl: string,
  supabaseUrl: string
) {
  const publicPrefix =
    `${supabaseUrl}/storage/v1/object/public/product-images/`;

  if (!imageUrl.startsWith(publicPrefix)) {
    return null;
  }

  const rawPath =
    imageUrl.slice(
      publicPrefix.length
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

/*
  IMPORTANT:
  Do not encode the whole storage path with encodeURIComponent(),
  otherwise:
    products/image.jpg
  becomes:
    products%2Fimage.jpg

  Supabase needs the "/" path separator to remain intact.
*/
function encodeStorageObjectPath(
  storagePath: string
) {
  return storagePath
    .split("/")
    .map((part) =>
      encodeURIComponent(part)
    )
    .join("/");
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request
      .json()
      .catch(() => null);

    const imageUrl =
      typeof body?.imageUrl ===
      "string"
        ? body.imageUrl.trim()
        : "";

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "Image URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    const storagePath =
      extractStoragePath(
        imageUrl,
        auth.supabaseUrl
      );

    /*
      Manually pasted/external images are not
      stored in our bucket. Just tell the client
      that storage cleanup was skipped.
    */
    if (!storagePath) {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          message:
            "External image URL removed from the form. No Supabase Storage file needed deletion.",
        },
        {
          status: 200,
        }
      );
    }

    const encodedStoragePath =
      encodeStorageObjectPath(
        storagePath
      );

    const deleteResponse =
      await fetch(
        `${auth.supabaseUrl}/storage/v1/object/product-images/${encodedStoragePath}`,
        {
          method: "DELETE",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const deleteResult =
      await deleteResponse
        .json()
        .catch(() => null);

    if (!deleteResponse.ok) {
      console.error(
        "PRODUCT_IMAGE_DELETE_ERROR:",
        {
          status:
            deleteResponse.status,
          storagePath,
          details:
            deleteResult,
        }
      );

      return NextResponse.json(
        {
          error:
            deleteResult?.message ||
            deleteResult?.error ||
            "Unable to delete product image.",
          details:
            deleteResult,
          storagePath,
        },
        {
          status:
            deleteResponse.status,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        skipped: false,
        path:
          storagePath,
        message:
          "Product image deleted successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_IMAGE_DELETE_ROUTE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while deleting the image.",
      },
      {
        status: 500,
      }
    );
  }
}
