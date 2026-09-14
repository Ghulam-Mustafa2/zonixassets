import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  is_active: boolean | null;
};

type DownloadRow = {
  id: string;
  user_id: string;
  order_item_id: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  file_path: string | null;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /*
      1. Environment variables
    */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
      2. Read entitlement ID
    */

    const { id } = await context.params;

    const downloadId = id?.trim();

    if (!downloadId) {
      return NextResponse.json(
        {
          error: "Download ID is required.",
        },
        { status: 400 }
      );
    }

    /*
      3. Read login cookie
    */

    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get(
        "pakstore-access-token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to download this file.",
        },
        { status: 401 }
      );
    }

    /*
      4. Verify logged-in user
    */

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

    const userData =
      await userResponse.json();

    if (
      !userResponse.ok ||
      !userData?.id
    ) {
      const response = NextResponse.json(
        {
          error:
            "Your session is invalid or expired. Please sign in again.",
        },
        { status: 401 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      5. Verify PakStore account status

      A valid Supabase JWT is not enough.
      Suspended accounts must not be able
      to create signed download URLs.
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,is_active`,
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
      console.error(
        "DOWNLOAD_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to verify your account status.",
        },
        {
          status:
            profileResponse.status || 500,
        }
      );
    }

    const profile =
      Array.isArray(profileData)
        ? (profileData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Your account profile could not be found.",
        },
        { status: 404 }
      );
    }

    if (profile.is_active === false) {
      const response = NextResponse.json(
        {
          code:
            "ACCOUNT_SUSPENDED",
          error:
            "Your account has been suspended. Downloads are not available.",
        },
        { status: 403 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      6. Load download entitlement
    */

    const downloadResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/downloads?id=eq.${encodeURIComponent(
          downloadId
        )}&user_id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,user_id,order_item_id,download_count,max_downloads,expires_at`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const downloadData =
      await downloadResponse.json();

    if (!downloadResponse.ok) {
      console.error(
        "DOWNLOAD_FETCH_ERROR:",
        downloadData
      );

      return NextResponse.json(
        {
          error:
            downloadData?.message ||
            "Unable to verify download access.",
        },
        {
          status:
            downloadResponse.status || 500,
        }
      );
    }

    const download =
      Array.isArray(downloadData)
        ? (downloadData[0] as
            | DownloadRow
            | undefined)
        : undefined;

    if (!download) {
      return NextResponse.json(
        {
          error:
            "Download access was not found for your account.",
        },
        { status: 404 }
      );
    }

    /*
      7. Check expiry
    */

    if (download.expires_at) {
      const expiresAt =
        new Date(
          download.expires_at
        ).getTime();

      if (
        Number.isFinite(expiresAt) &&
        expiresAt <= Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Your download access has expired.",
          },
          { status: 403 }
        );
      }
    }

    /*
      8. Check max downloads
    */

    const currentCount =
      Number(download.download_count) || 0;

    const maxDownloads =
      Number(download.max_downloads) || 10;

    if (
      currentCount >= maxDownloads
    ) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum download limit.",
        },
        { status: 403 }
      );
    }

    /*
      9. Load purchased order item
    */

    const orderItemResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/order_items?id=eq.${encodeURIComponent(
          download.order_item_id
        )}&select=id,order_id,product_id,product_title,product_price,quantity`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const orderItemData =
      await orderItemResponse.json();

    if (!orderItemResponse.ok) {
      console.error(
        "DOWNLOAD_ORDER_ITEM_ERROR:",
        orderItemData
      );

      return NextResponse.json(
        {
          error:
            orderItemData?.message ||
            "Unable to load purchased product.",
        },
        { status: 500 }
      );
    }

    const orderItem =
      Array.isArray(orderItemData)
        ? (orderItemData[0] as
            | OrderItemRow
            | undefined)
        : undefined;

    if (!orderItem) {
      return NextResponse.json(
        {
          error:
            "The purchased product could not be found.",
        },
        { status: 404 }
      );
    }

    if (!orderItem.product_id) {
      return NextResponse.json(
        {
          error:
            "This purchased item is not connected to a product.",
        },
        { status: 400 }
      );
    }

    /*
      10. Load product + storage file path
    */

    const productResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
          orderItem.product_id
        )}&select=id,title,slug,file_path`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const productData =
      await productResponse.json();

    if (!productResponse.ok) {
      console.error(
        "DOWNLOAD_PRODUCT_FETCH_ERROR:",
        productData
      );

      return NextResponse.json(
        {
          error:
            productData?.message ||
            "Unable to load product file.",
        },
        { status: 500 }
      );
    }

    const product =
      Array.isArray(productData)
        ? (productData[0] as
            | ProductRow
            | undefined)
        : undefined;

    if (!product) {
      return NextResponse.json(
        {
          error:
            "The product could not be found.",
        },
        { status: 404 }
      );
    }

    const filePath =
      product.file_path?.trim();

    if (!filePath) {
      return NextResponse.json(
        {
          error:
            "No downloadable file has been uploaded for this product yet.",
        },
        { status: 404 }
      );
    }

    /*
      11. Create signed Storage URL

      Private bucket:
      product-files

      Signed URL expires after 60 seconds.
    */

    const encodedPath =
      filePath
        .split("/")
        .map((part) =>
          encodeURIComponent(part)
        )
        .join("/");

    const signResponse =
      await fetch(
        `${supabaseUrl}/storage/v1/object/sign/product-files/${encodedPath}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            expiresIn: 60,
          }),
          cache: "no-store",
        }
      );

    const signData =
      await signResponse.json();

    if (!signResponse.ok) {
      console.error(
        "SIGNED_URL_ERROR:",
        signData
      );

      return NextResponse.json(
        {
          error:
            signData?.message ||
            signData?.error ||
            "Unable to prepare secure file download.",
        },
        {
          status:
            signResponse.status || 500,
        }
      );
    }

    const signedPath =
      signData?.signedURL ||
      signData?.signedUrl;

    if (!signedPath) {
      console.error(
        "SIGNED_URL_MISSING:",
        signData
      );

      return NextResponse.json(
        {
          error:
            "Storage did not return a signed download URL.",
        },
        { status: 500 }
      );
    }

    /*
      12. Increment download count
    */

    const newDownloadCount =
      currentCount + 1;

    const updateResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/downloads?id=eq.${encodeURIComponent(
          download.id
        )}&user_id=eq.${encodeURIComponent(
          userData.id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
            Prefer:
              "return=representation",
          },
          body: JSON.stringify({
            download_count:
              newDownloadCount,
          }),
        }
      );

    const updatedDownloadData =
      await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        "DOWNLOAD_COUNT_UPDATE_ERROR:",
        updatedDownloadData
      );

      return NextResponse.json(
        {
          error:
            updatedDownloadData?.message ||
            "Unable to update download count.",
        },
        { status: 500 }
      );
    }

    /*
      13. Build final signed URL

      Supabase may return either:
      - an absolute URL
      - or /storage/v1/... path
    */

    const signedUrl =
  signedPath.startsWith("http")
    ? signedPath
    : signedPath.startsWith("/storage/v1/")
      ? `${supabaseUrl}${signedPath}`
      : `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;

    /* 
      Add ?download so browser saves the file.
    */

    const separator =
      signedUrl.includes("?")
        ? "&"
        : "?";

    const finalDownloadUrl =
      `${signedUrl}${separator}download=${encodeURIComponent(
        filePath.split("/").pop() ||
          "download"
      )}`;

    /*
      14. Redirect to real ZIP file
    */

    return NextResponse.redirect(
      finalDownloadUrl,
      {
        status: 302,
      }
    );
  } catch (error) {
    console.error(
      "SECURE_DOWNLOAD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while preparing your download.",
      },
      { status: 500 }
    );
  }
}

function clearAuthCookies(
  response: NextResponse
) {
  response.cookies.set(
    "pakstore-access-token",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );

  response.cookies.set(
    "pakstore-refresh-token",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

