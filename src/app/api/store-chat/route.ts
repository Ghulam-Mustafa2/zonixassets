import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CatalogProduct = {
  title?: string;
  price?: number;
  currency?: string;
  shortDescription?: string;
  description?: string;
  productType?: string;
  category?: string | null;
  url?: string;
};

type CatalogResponse = {
  success?: boolean;
  products?: CatalogProduct[];
  meta?: {
    cheapestProduct?: {
      title?: string;
      price?: number;
      currency?: string;
      url?: string;
    } | null;
  };
};

const GM_AI_ENDPOINT =
  process.env.GM_AI_API_ENDPOINT?.trim() ||
  "https://gm-ai-boss.lovable.app/api/public/client-chat";

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object"
    )
    .map((item) => {
      const role =
        item.role === "assistant" ? "assistant" : "user";
      const content =
        typeof item.content === "string"
          ? item.content.trim().slice(0, 2000)
          : "";

      return {
        role,
        content,
      } satisfies ChatMessage;
    })
    .filter((message) => message.content)
    .slice(-12);
}

function cleanText(value: string | undefined, max = 500) {
  if (!value) return "";

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function formatMoney(
  price: number | undefined,
  currency = "USD"
) {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

function buildCatalogContext(catalog: CatalogResponse) {
  const products = Array.isArray(catalog.products)
    ? catalog.products
    : [];

  const lines = products.map((product, index) => {
    const description =
      cleanText(product.shortDescription, 260) ||
      cleanText(product.description, 420) ||
      "No additional description available.";

    return [
      `${index + 1}. ${product.title || "Digital Product"}`,
      `Price: ${formatMoney(product.price, product.currency || "USD")}`,
      `Type: ${product.productType || "DIGITAL_PRODUCT"}`,
      product.category ? `Category: ${product.category}` : null,
      `Product URL: ${product.url || "https://zonixassets.shop/products"}`,
      `Summary: ${description}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const cheapest = catalog.meta?.cheapestProduct;

  const cheapestLine = cheapest?.title
    ? `Current cheapest product: ${cheapest.title} — ${formatMoney(
        cheapest.price,
        cheapest.currency || "USD"
      )} — ${cheapest.url || ""}`
    : "Current cheapest product: unavailable.";

  return [
    "LIVE ZONIXASSETS CATALOG — CURRENT SOURCE OF TRUTH",
    "Use this data for current product names, prices and product links.",
    "Do not invent a different price, product or URL.",
    cheapestLine,
    "",
    ...lines,
  ].join("\n");
}

function extractReply(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";

  const data = payload as Record<string, unknown>;
  for (const key of ["reply", "response", "answer", "message", "content", "text"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = extractReply(value);
      if (nested) return nested;
    }
  }

  if (Array.isArray(data.choices)) {
    for (const choice of data.choices) {
      const result = extractReply(choice);
      if (result) return result;
    }
  }

  return "";
}

async function readUpstreamReply(response: Response): Promise<string> {
  const raw = (await response.text()).trim();
  if (!raw) return "";

  const looksLikeJson =
    response.headers.get("content-type")?.includes("application/json") ||
    raw.startsWith("{") ||
    raw.startsWith("[") ||
    (raw.startsWith('"') && raw.endsWith('"'));

  if (!looksLikeJson) return raw;

  try {
    return extractReply(JSON.parse(raw));
  } catch {
    // Plain text sometimes starts with a JSON-like character.
    return response.headers.get("content-type")?.includes("application/json")
      ? ""
      : raw;
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      service: "ZonixAssets AI bridge",
      configured: Boolean(process.env.GM_AI_API_KEY?.trim()),
      catalog: "https://zonixassets.shop/api/ai-catalog",
      upstream: "GM AI",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GM_AI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GM AI bridge is not configured yet. Add GM_AI_API_KEY in Vercel environment variables.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      messages?: unknown;
      message?: unknown;
    };

    let messages = sanitizeMessages(body.messages);

    if (
      messages.length === 0 &&
      typeof body.message === "string" &&
      body.message.trim()
    ) {
      messages = [
        {
          role: "user",
          content: body.message.trim().slice(0, 2000),
        },
      ];
    }

    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a message.",
        },
        { status: 400 }
      );
    }

    const catalogUrl = new URL("/api/ai-catalog", request.url);

    const catalogResponse = await fetch(catalogUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!catalogResponse.ok) {
      console.error(
        "STORE_CHAT_CATALOG_ERROR:",
        catalogResponse.status,
        await catalogResponse.text()
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The live product catalog is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const catalog =
      (await catalogResponse.json()) as CatalogResponse;

    const catalogContext = buildCatalogContext(catalog);

    // GM AI receives one user turn. This prevents older user turns or
    // catalog instructions from being mistaken for the current question.
    const latestIndex = messages.map((m) => m.role).lastIndexOf("user");
    if (latestIndex < 0 || latestIndex !== messages.length - 1) {
      return NextResponse.json(
        { success: false, error: "Please provide a new customer message." },
        { status: 400 }
      );
    }

    const currentQuestion = messages[latestIndex].content;
    const history = messages
      .slice(Math.max(0, latestIndex - 6), latestIndex)
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
      .join("\n");

    const upstreamMessages: ChatMessage[] = [{
      role: "user",
      content: [
        "CURRENT CUSTOMER QUESTION:",
        currentQuestion,
        "",
        "You are ZonixAssets AI Sales & Support. Answer the CURRENT question, not an earlier question. If the visitor says hello/hi, greet them naturally without talking about receiving a catalog.",
        "Only use the live catalog for product facts, prices and links. Never invent a price or product. If a price is missing, say so.",
        "Be concise and respond in English, Urdu, or Roman Urdu to match the visitor.",
        "Only when contextually relevant, offer human follow-up. Say contact details will only be used by ZonixAssets for the enquiry. Ask for name, email OR WhatsApp, and product interest; do not repeatedly ask or ask for passwords, card details, OTPs, or ID numbers.",
        history ? "PAST MESSAGES FOR CONTEXT ONLY (do not answer them):\n" + history : "",
        catalogContext,
        "ANSWER THIS CURRENT CUSTOMER QUESTION NOW:",
        currentQuestion,
      ].filter(Boolean).join("\n"),
    }];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetch(GM_AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: upstreamMessages,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();

      console.error(
        "STORE_CHAT_GM_AI_ERROR:",
        upstreamResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The AI assistant is temporarily unavailable. Please try again shortly.",
        },
        { status: 502 }
      );
    }

    const reply = await readUpstreamReply(upstreamResponse);

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The AI assistant returned an empty response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reply,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("STORE_CHAT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process the chat request right now.",
      },
      { status: 500 }
    );
  }
}
