import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      order_id?: string;
      order_number?: string;
      user_id?: string;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      store_id?: number;
      status?: string;
      currency?: string;
      total?: number;
      user_email?: string;
      identifier?: string;
      test_mode?: boolean;
    };
  };
};

type OrderRow = {
  id: string;
  user_id: string;
  order_number: string;
  total: number | string;
  status: string;
  payment_provider?: string | null;
  payment_reference?: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

type DownloadRow = {
  id: string;
  user_id: string;
  order_item_id: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
};

type ProductDeliveryRow = {
  id: string;
  product_type: string | null;
};

function safeSignatureCompare(
  expected: string,
  received: string
) {
  const expectedBuffer = Buffer.from(
    expected,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    received,
    "utf8"
  );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function parseBooleanEnv(
  value: string | undefined
) {
  if (!value) {
    return null;
  }

  const normalized =
    value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function serviceHeaders(
  supabaseSecretKey: string
) {
  if (
    supabaseSecretKey.startsWith(
      "sb_secret_"
    )
  ) {
    return {
      apikey:
        supabaseSecretKey,
    };
  }

  return {
    apikey:
      supabaseSecretKey,
    Authorization:
      `Bearer ${supabaseSecretKey}`,
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const webhookSecret =
      process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    const lemonStoreId =
      process.env.LEMON_SQUEEZY_STORE_ID;

    const lemonTestMode =
      parseBooleanEnv(
        process.env.LEMON_SQUEEZY_TEST_MODE
      );

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !webhookSecret ||
      !lemonStoreId ||
      lemonTestMode === null
    ) {
      console.error(
        "LEMON_WEBHOOK_CONFIG_MISSING"
      );

      return NextResponse.json(
        {
          error:
            "Webhook configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      console.error(
        "LEMON_WEBHOOK_SUPABASE_CONFIG_MISSING"
      );

      return NextResponse.json(
        {
          error:
            "Supabase server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    const rawBody =
      await request.text();

    const receivedSignature =
      request.headers.get(
        "x-signature"
      ) || "";

    if (!receivedSignature) {
      return NextResponse.json(
        {
          error:
            "Webhook signature is missing.",
        },
        {
          status: 401,
        }
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    if (
      !safeSignatureCompare(
        expectedSignature,
        receivedSignature
      )
    ) {
      console.error(
        "LEMON_WEBHOOK_INVALID_SIGNATURE"
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    let payload: LemonWebhookPayload;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const eventName =
      payload?.meta?.event_name ||
      request.headers.get(
        "x-event-name"
      ) ||
      "";

    if (
      eventName !== "order_created"
    ) {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
          event: eventName,
        },
        {
          status: 200,
        }
      );
    }

    const attributes =
      payload?.data?.attributes;

    const customData =
      payload?.meta?.custom_data;

    const orderId =
      typeof customData?.order_id ===
      "string"
        ? customData.order_id.trim()
        : "";

    const userId =
      typeof customData?.user_id ===
      "string"
        ? customData.user_id.trim()
        : "";

    const lemonOrderId =
      typeof payload?.data?.id === "string"
        ? payload.data.id.trim()
        : "";

    if (
      !orderId ||
      !userId ||
      !lemonOrderId
    ) {
      console.error(
        "LEMON_WEBHOOK_CUSTOM_DATA_MISSING",
        {
          eventName,
          customData,
          lemonOrderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Required payment metadata is missing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      String(
        attributes?.store_id ?? ""
      ) !== String(lemonStoreId)
    ) {
      console.error(
        "LEMON_WEBHOOK_STORE_MISMATCH",
        {
          receivedStoreId:
            attributes?.store_id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook store does not match.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      attributes?.test_mode !==
      lemonTestMode
    ) {
      console.error(
        "LEMON_WEBHOOK_TEST_MODE_MISMATCH",
        {
          expectedTestMode:
            lemonTestMode,
          receivedTestMode:
            attributes?.test_mode ??
            null,
          orderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook test mode does not match the configured payment mode.",
        },
        {
          status: 409,
        }
      );
    }

    const lemonStatus =
      String(
        attributes?.status || ""
      ).toLowerCase();

    if (
      lemonStatus &&
      lemonStatus !== "paid"
    ) {
      console.error(
        "LEMON_WEBHOOK_ORDER_NOT_PAID",
        {
          orderId,
          lemonStatus,
        }
      );

      return NextResponse.json(
        {
          error:
            "Lemon Squeezy order is not paid.",
        },
        {
          status: 409,
        }
      );
    }

    const lemonCurrency =
      String(
        attributes?.currency || ""
      ).toUpperCase();

    if (
      lemonCurrency &&
      lemonCurrency !== "USD"
    ) {
      console.error(
        "LEMON_WEBHOOK_CURRENCY_MISMATCH",
        {
          orderId,
          lemonCurrency,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment currency does not match the store currency.",
        },
        {
          status: 409,
        }
      );
    }

    const orderResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
          orderId
        )}&user_id=eq.${encodeURIComponent(
          userId
        )}&select=id,user_id,order_number,total,status,payment_provider,payment_reference&limit=1`,
        {
          method: "GET",

          headers:
            serviceHeaders(
              supabaseSecretKey
            ),

          cache: "no-store",
        }
      );

    const orderData =
      await orderResponse
        .json()
        .catch(() => null);

    if (!orderResponse.ok) {
      console.error(
        "LEMON_WEBHOOK_ORDER_LOAD_ERROR",
        orderData
      );

      return NextResponse.json(
        {
          error:
            "Unable to load order.",
        },
        {
          status: 500,
        }
      );
    }

    const order: OrderRow | undefined =
      Array.isArray(orderData)
        ? orderData[0]
        : undefined;

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const customOrderNumber =
      typeof customData?.order_number ===
      "string"
        ? customData.order_number.trim()
        : "";

    if (
      customOrderNumber &&
      customOrderNumber !==
        order.order_number
    ) {
      console.error(
        "LEMON_WEBHOOK_ORDER_NUMBER_MISMATCH",
        {
          orderId,
          expectedOrderNumber:
            order.order_number,
          receivedOrderNumber:
            customOrderNumber,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook order number does not match the local order.",
        },
        {
          status: 409,
        }
      );
    }

    const expectedTotalCents =
      Math.round(
        Number(order.total) * 100
      );

    const lemonTotalCents =
      Number(
        attributes?.total
      );

    if (
      !Number.isFinite(
        lemonTotalCents
      ) ||
      lemonTotalCents !==
        expectedTotalCents
    ) {
      console.error(
        "LEMON_WEBHOOK_AMOUNT_MISMATCH",
        {
          orderId,
          expectedTotalCents,
          lemonTotalCents,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount does not match the order.",
        },
        {
          status: 409,
        }
      );
    }

    const currentStatus =
      String(
        order.status || ""
      ).toUpperCase();

    const currentProvider =
      String(
        order.payment_provider || ""
      ).toUpperCase();

    const currentReference =
      String(
        order.payment_reference || ""
      ).trim();

    if (
      currentStatus === "PAID" &&
      (
        currentProvider !==
          "LEMON_SQUEEZY" ||
        (
          currentReference &&
          currentReference !==
            lemonOrderId
        )
      )
    ) {
      console.error(
        "LEMON_WEBHOOK_PAID_ORDER_CONFLICT",
        {
          orderId,
          currentProvider:
            order.payment_provider,
          currentReference:
            order.payment_reference,
          receivedReference:
            lemonOrderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "This order is already paid with different payment metadata.",
        },
        {
          status: 409,
        }
      );
    }

    const needsOrderUpdate =
      currentStatus !== "PAID" ||
      currentProvider !==
        "LEMON_SQUEEZY" ||
      currentReference !==
        lemonOrderId;

    let finalOrder = order;

    if (needsOrderUpdate) {
      const updateResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
            orderId
          )}&user_id=eq.${encodeURIComponent(
            userId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              ...serviceHeaders(
                supabaseSecretKey
              ),

              Prefer:
                "return=representation",
            },

            body: JSON.stringify({
              status: "PAID",
              payment_provider:
                "LEMON_SQUEEZY",
              payment_reference:
                lemonOrderId,
            }),

            cache: "no-store",
          }
        );

      const updatedData =
        await updateResponse
          .json()
          .catch(() => null);

      if (!updateResponse.ok) {
        console.error(
          "LEMON_WEBHOOK_ORDER_UPDATE_ERROR",
          updatedData
        );

        return NextResponse.json(
          {
            error:
              "Unable to update order payment status.",
          },
          {
            status: 500,
          }
        );
      }

      const updatedOrder =
        Array.isArray(updatedData)
          ? updatedData[0]
          : updatedData;

      if (updatedOrder?.id) {
        finalOrder =
          updatedOrder as OrderRow;
      }
    }

    const itemsResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/order_items?order_id=eq.${encodeURIComponent(
          orderId
        )}&select=id,order_id,product_id,product_title,product_price,quantity`,
        {
          method: "GET",

          headers:
            serviceHeaders(
              supabaseSecretKey
            ),

          cache: "no-store",
        }
      );

    const itemsData =
      await itemsResponse
        .json()
        .catch(() => null);

    if (!itemsResponse.ok) {
      console.error(
        "LEMON_WEBHOOK_ITEMS_LOAD_ERROR",
        itemsData
      );

      return NextResponse.json(
        {
          error:
            "Payment is confirmed, but order items could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    const orderItems =
      Array.isArray(itemsData)
        ? (itemsData as OrderItemRow[])
        : [];

    if (orderItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "Payment is confirmed, but this order has no items.",
        },
        {
          status: 500,
        }
      );
    }

    const invalidOrderItems =
      orderItems.filter(
        (item) =>
          !item.product_id
      );

    if (invalidOrderItems.length > 0) {
      console.error(
        "LEMON_WEBHOOK_ORDER_ITEM_PRODUCT_MISSING",
        {
          orderId,
          itemIds:
            invalidOrderItems.map(
              (item) => item.id
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment is confirmed, but one or more purchased items are not linked to products.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Provision ZonixAssets-side AI rental records for AI_RENTAL
      products. GM AI client creation remains a manual admin step
      until we have a stable authenticated provisioning API.
    */

    const productIds =
      Array.from(
        new Set(
          orderItems
            .map(
              (item) =>
                item.product_id
            )
            .filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        )
      );

    let aiRentalOrderItems:
      OrderItemRow[] = [];

    if (productIds.length > 0) {
      const productFilter =
        productIds
          .map(
            (id) =>
              `"${id}"`
          )
          .join(",");

      const productResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/products?id=in.(${encodeURIComponent(
            productFilter
          )})&select=id,product_type`,
          {
            method: "GET",
            headers:
              serviceHeaders(
                supabaseSecretKey
              ),
            cache: "no-store",
          }
        );

      const productData =
        await productResponse
          .json()
          .catch(() => null);

      if (!productResponse.ok) {
        console.error(
          "LEMON_WEBHOOK_PRODUCT_TYPE_LOAD_ERROR",
          productData
        );
      } else {
        const productTypes =
          new Map(
            (
              Array.isArray(
                productData
              )
                ? (productData as ProductDeliveryRow[])
                : []
            ).map(
              (product) => [
                product.id,
                String(
                  product.product_type ||
                    "DIGITAL_DOWNLOAD"
                ).toUpperCase(),
              ]
            )
          );

        aiRentalOrderItems =
          orderItems.filter(
            (item) =>
              item.product_id &&
              productTypes.get(
                item.product_id
              ) === "AI_RENTAL"
          );
      }
    }

    if (
      aiRentalOrderItems.length > 0
    ) {
      const rentalItemIds =
        aiRentalOrderItems
          .map(
            (item) =>
              `"${item.id}"`
          )
          .join(",");

      const existingRentalsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/ai_rentals?user_id=eq.${encodeURIComponent(
            userId
          )}&order_item_id=in.(${encodeURIComponent(
            rentalItemIds
          )})&select=id,order_item_id`,
          {
            method: "GET",
            headers:
              serviceHeaders(
                supabaseSecretKey
              ),
            cache: "no-store",
          }
        );

      const existingRentalsData =
        await existingRentalsResponse
          .json()
          .catch(() => null);

      if (
        existingRentalsResponse.ok
      ) {
        const existingRentalItems =
          new Set(
            (
              Array.isArray(
                existingRentalsData
              )
                ? existingRentalsData
                : []
            ).map(
              (
                rental: {
                  order_item_id?: string;
                }
              ) =>
                rental.order_item_id
            )
          );

        const missingRentals =
          aiRentalOrderItems.filter(
            (item) =>
              !existingRentalItems.has(
                item.id
              )
          );

        if (missingRentals.length > 0) {
          const createRentalsResponse =
            await fetch(
              `${supabaseUrl}/rest/v1/ai_rentals`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  ...serviceHeaders(
                    supabaseSecretKey
                  ),
                  Prefer:
                    "return=minimal",
                },
                body: JSON.stringify(
                  missingRentals.map(
                    (item) => ({
                      user_id:
                        userId,
                      order_item_id:
                        item.id,
                      product_id:
                        item.product_id,
                      status:
                        "PENDING_SETUP",
                    })
                  )
                ),
                cache:
                  "no-store",
              }
            );

          if (
            !createRentalsResponse.ok
          ) {
            console.error(
              "LEMON_WEBHOOK_AI_RENTAL_CREATE_ERROR",
              await createRentalsResponse
                .text()
                .catch(
                  () => ""
                )
            );
          }
        }
      } else {
        console.error(
          "LEMON_WEBHOOK_AI_RENTAL_LOAD_ERROR",
          existingRentalsData
        );
      }
    }

    const orderItemIds =
      orderItems.map(
        (item) => item.id
      );

    const downloadFilter =
      orderItemIds
        .map((id) => `"${id}"`)
        .join(",");

    const downloadsResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/downloads?user_id=eq.${encodeURIComponent(
          userId
        )}&order_item_id=in.(${encodeURIComponent(
          downloadFilter
        )})&select=id,user_id,order_item_id,download_count,max_downloads,expires_at`,
        {
          method: "GET",

          headers:
            serviceHeaders(
              supabaseSecretKey
            ),

          cache: "no-store",
        }
      );

    const downloadsData =
      await downloadsResponse
        .json()
        .catch(() => null);

    if (!downloadsResponse.ok) {
      console.error(
        "LEMON_WEBHOOK_DOWNLOADS_LOAD_ERROR",
        downloadsData
      );

      return NextResponse.json(
        {
          error:
            "Payment is confirmed, but download access could not be checked.",
        },
        {
          status: 500,
        }
      );
    }

    const existingDownloads =
      Array.isArray(downloadsData)
        ? (downloadsData as DownloadRow[])
        : [];

    const existingOrderItemIds =
      new Set(
        existingDownloads.map(
          (download) =>
            download.order_item_id
        )
      );

    const missingOrderItems =
      orderItems.filter(
        (item) =>
          !existingOrderItemIds.has(
            item.id
          )
      );

    let createdDownloads: DownloadRow[] =
      [];

    if (
      missingOrderItems.length > 0
    ) {
      const downloadsPayload =
        missingOrderItems.map(
          (item) => ({
            user_id: userId,
            order_item_id: item.id,
            download_count: 0,
            max_downloads: 10,
            expires_at: null,
          })
        );

      const createDownloadsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/downloads`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...serviceHeaders(
                supabaseSecretKey
              ),

              Prefer:
                "return=representation",
            },

            body: JSON.stringify(
              downloadsPayload
            ),

            cache: "no-store",
          }
        );

      const createdDownloadsData =
        await createDownloadsResponse
          .json()
          .catch(() => null);

      if (!createDownloadsResponse.ok) {
        console.error(
          "LEMON_WEBHOOK_DOWNLOADS_CREATE_ERROR",
          createdDownloadsData
        );

        return NextResponse.json(
          {
            error:
              "Payment is confirmed, but download access could not be created.",
          },
          {
            status: 500,
          }
        );
      }

      createdDownloads =
        Array.isArray(
          createdDownloadsData
        )
          ? (createdDownloadsData as DownloadRow[])
          : [];
    }

    console.log(
      "LEMON_PAYMENT_CONFIRMED",
      {
        orderId,
        lemonOrderId,
        status:
          finalOrder.status,
        createdDownloads:
          createdDownloads.length,
        existingDownloads:
          existingDownloads.length,
        testMode:
          attributes?.test_mode ??
          null,
        configuredTestMode:
          lemonTestMode,
      }
    );

    return NextResponse.json(
      {
        success: true,
        orderId,
        status: "PAID",
        paymentProvider:
          "LEMON_SQUEEZY",
        paymentReference:
          lemonOrderId,
        downloads: {
          created:
            createdDownloads.length,
          existing:
            existingDownloads.length,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "LEMON_WEBHOOK_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}
