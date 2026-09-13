import "server-only";
import crypto from "node:crypto";

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";
}

function snapBaseUrl(): string {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
}

function coreApiBaseUrl(): string {
  return isMidtransProduction()
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

export class MidtransError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "MidtransError";
  }
}

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!key) {
    throw new MidtransError(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi. Set environment variable terlebih dahulu.",
    );
  }
  return key;
}

function authHeader(): string {
  const encoded = Buffer.from(`${serverKey()}:`).toString("base64");
  return `Basic ${encoded}`;
}

export type SnapItemDetail = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type SnapTransactionRequest = {
  orderId: string;
  grossAmount: number;
  items: SnapItemDetail[];
  customer: { firstName: string; email: string };
  finishUrl: string;
  expiryDurationDays?: number;
  customField1?: string;
  /** Batasi metode pembayaran yang muncul, mis. ["bca_va","bri_va","qris","gopay"]. */
  enabledPayments?: string[];
};

/** Daftar metode pembayaran yang diizinkan dari env MIDTRANS_ENABLED_PAYMENTS. */
export function enabledPaymentsFromEnv(): string[] | undefined {
  const raw = process.env.MIDTRANS_ENABLED_PAYMENTS?.trim();
  if (!raw) return undefined;
  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export type SnapTransactionResponse = {
  token: string;
  redirect_url: string;
};

export async function createSnapTransaction(
  input: SnapTransactionRequest,
): Promise<SnapTransactionResponse> {
  const publicUrl = process.env.WEBHOOK_PUBLIC_URL?.trim();
  const overrideNotification = publicUrl
    ? `${publicUrl.replace(/\/$/, "")}/api/webhooks/midtrans`
    : null;

  const response = await fetch(`${snapBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(overrideNotification
        ? { "X-Override-Notification": overrideNotification }
        : {}),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      item_details: input.items,
      customer_details: {
        first_name: input.customer.firstName,
        email: input.customer.email,
      },
      callbacks: { finish: input.finishUrl },
      expiry: {
        unit: "day",
        duration: input.expiryDurationDays ?? 1,
      },
      custom_field1: input.customField1,
      ...(input.enabledPayments && input.enabledPayments.length > 0
        ? { enabled_payments: input.enabledPayments }
        : {}),
    }),
  });

  const payload = (await response.json()) as SnapTransactionResponse & {
    error_messages?: string[];
  };

  if (!response.ok || !payload.token || !payload.redirect_url) {
    const detail = payload.error_messages?.join(", ");
    throw new MidtransError(
      detail ?? "Gagal membuat transaksi Midtrans Snap.",
      response.status,
    );
  }

  return payload;
}

export type MidtransTransactionStatus = {
  order_id: string;
  transaction_id?: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount?: string;
  status_code?: string;
  status_message?: string;
  signature_key?: string;
  [key: string]: unknown;
};

export async function getTransactionStatus(
  orderId: string,
): Promise<MidtransTransactionStatus> {
  const response = await fetch(
    `${coreApiBaseUrl()}/${encodeURIComponent(orderId)}/status`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
      },
    },
  );

  const payload = (await response.json()) as MidtransTransactionStatus & {
    status_message?: string;
  };

  if (!response.ok && response.status !== 404) {
    throw new MidtransError(
      payload.status_message ?? "Gagal mengambil status transaksi Midtrans.",
      response.status,
    );
  }

  return payload;
}

export type MidtransCancelResponse = {
  status_code: string;
  status_message: string;
  transaction_status?: string;
  order_id?: string;
  transaction_id?: string;
};

export type MidtransPaymentChannel = {
  type: string;
  category?: string;
  status?: string;
  minimum_amount?: number;
  maximum_amount?: number;
  va_type?: string;
};

export type MidtransSnapResult = {
  payment_type?: string;
  charge_type?: string;
  transaction_status?: string;
  qris_acquirer?: string | null;
  qris_url?: string | null;
  qris_link?: string | null;
  qris_expiration_raw?: string | null;
  pdf_url?: string | null;
};

export type MidtransSnapDetail = {
  token: string;
  transaction_details?: { order_id?: string; gross_amount?: string };
  enabled_payments?: MidtransPaymentChannel[];
  result?: MidtransSnapResult | null;
};

/**
 * Ambil token Snap dari redirect_url (segmen terakhir, berupa UUID).
 * Dipakai sebagai fallback untuk transaksi lama yang belum punya kolom snap_token.
 */
export function snapTokenFromRedirectUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const segmen = url.split(/[?#]/)[0].split("/").filter(Boolean).pop();
  return segmen && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segmen)
    ? segmen
    : null;
}

/** Detail transaksi Snap (dipakai untuk membaca daftar kanal + nominal minimumnya). */
export async function fetchSnapTransactionDetail(
  token: string,
): Promise<MidtransSnapDetail> {
  const response = await fetch(
    `${snapBaseUrl()}/transactions/${encodeURIComponent(token)}`,
    {
      headers: { Authorization: authHeader(), Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new MidtransError(
      "Gagal mengambil detail transaksi Snap.",
      response.status,
    );
  }

  return (await response.json()) as MidtransSnapDetail;
}

/** Batalkan transaksi yang masih pending (VA, QRIS, e-wallet, gerai retail, dll). */
export async function cancelTransaction(
  orderId: string,
): Promise<MidtransCancelResponse> {
  const response = await fetch(
    `${coreApiBaseUrl()}/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const payload = (await response.json()) as MidtransCancelResponse;
  return payload;
}

/** SHA512(order_id + status_code + gross_amount + server_key) */
export function midtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey()}`)
    .digest("hex");
}

export function verifyMidtransSignature(input: {
  orderId?: string;
  statusCode?: string;
  grossAmount?: string;
  signatureKey?: string;
}): boolean {
  const { orderId, statusCode, grossAmount, signatureKey } = input;
  if (!orderId || !statusCode || !grossAmount || !signatureKey) return false;
  if (!process.env.MIDTRANS_SERVER_KEY?.trim()) return false;

  const expected = midtransSignature(orderId, statusCode, grossAmount);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signatureKey, "utf8"),
    );
  } catch {
    return false;
  }
}

export type NormalizedPaymentState =
  | "paid"
  | "pending"
  | "processing"
  | "expired"
  | "failed"
  | "refunded";

/** Terjemahkan transaction_status + fraud_status Midtrans ke status internal. */
export function normalizeMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): NormalizedPaymentState {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "processing" : "paid";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "deny":
      return "failed";
    case "cancel":
      return "failed";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refunded";
    case "partial_chargeback":
    case "chargeback":
      return "failed";
    default:
      return "pending";
  }
}
