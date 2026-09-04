import "server-only";
import crypto from "node:crypto";

const MAYAR_API_BASE =
  process.env.MAYAR_API_BASE_URL ??
  (process.env.MAYAR_SANDBOX === "true"
    ? "https://api.mayar.io/hl/v1"
    : "https://api.mayar.id/hl/v1");

export type MayarInvoiceRequest = {
  name: string;
  email: string;
  mobile?: string;
  redirectUrl?: string;
  description: string;
  expiredAt?: string;
  items: { quantity: number; rate: number; description: string }[];
  extraData: Record<string, string>;
};

export type MayarInvoiceResponse = {
  statusCode: number;
  messages: string;
  data: {
    id: string;
    transactionId: string;
    link: string;
    expiredAt?: number;
    extraData?: Record<string, string>;
  };
};

export class MayarError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "MayarError";
  }
}

function apiKey(): string {
  const key = process.env.MAYAR_API_KEY;
  if (!key) {
    throw new MayarError(
      "MAYAR_API_KEY belum dikonfigurasi. Set environment variable terlebih dahulu.",
    );
  }
  return key;
}

export async function createInvoice(
  input: MayarInvoiceRequest,
): Promise<MayarInvoiceResponse["data"]> {
  const response = await fetch(`${MAYAR_API_BASE}/invoice/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as MayarInvoiceResponse & {
    message?: string;
  };

  if (!response.ok || payload.statusCode !== 200 || !payload.data?.id) {
    throw new MayarError(
      payload.messages ?? payload.message ?? "Gagal membuat invoice Mayar.",
      response.status,
    );
  }

  return payload.data;
}

export async function getInvoice(
  invoiceId: string,
): Promise<{
  id: string;
  amount: number;
  status?: string;
  transactions?: { id: string; status: string }[];
  link?: string;
  description?: string;
}> {
  const response = await fetch(`${MAYAR_API_BASE}/invoice/${invoiceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
    },
  });

  if (!response.ok) {
    throw new MayarError(
      "Gagal mengambil detail invoice dari Mayar.",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    statusCode: number;
    data: {
      id: string;
      amount: number;
      status?: string;
      transactions?: { id: string; status: string }[];
      link?: string;
      description?: string;
    };
  };

  return payload.data;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.MAYAR_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "MAYAR_WEBHOOK_SECRET tidak dikonfigurasi — webhook diterima tanpa verifikasi signature.",
    );
    return true;
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(provided, "utf8"),
    );
  } catch {
    return false;
  }
}
