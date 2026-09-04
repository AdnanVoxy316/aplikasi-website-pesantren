import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  pembayaranSpp,
  paymentWebhookEvents,
  tagihanSpp,
} from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/mayar";
import { logActivity } from "@/lib/activity";

const SUCCESS_EVENT_PATTERN =
  /payment\.received|payment\.success|transaction\.success|transaction\.settlement|invoice\.paid/i;

const FAILURE_EVENT_PATTERN =
  /payment\.expired|payment\.failed|transaction\.expired|transaction\.failed|invoice\.expired/i;

type WebhookBody = {
  event?: { received?: string } | string;
  data?: {
    id?: string;
    status?: boolean | string;
    amount?: number;
    transactionId?: string;
    invoiceId?: string;
    extraData?: Record<string, string>;
    paymentMethod?: string;
    [key: string]: unknown;
  };
};

function extractEventType(body: WebhookBody): string | null {
  if (typeof body.event === "string") return body.event;
  return body.event?.received ?? null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload webhook bukan JSON yang valid." },
      { status: 400 },
    );
  }

  const signature =
    request.headers.get("x-mayar-signature") ??
    request.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { ok: false, error: "Signature webhook tidak valid." },
      { status: 401 },
    );
  }

  const eventType = extractEventType(body);
  const providerEventId = body.data?.id ? String(body.data.id) : null;
  const providerTransactionId =
    body.data?.transactionId ?? body.data?.invoiceId ?? null;
  const extraData = body.data?.extraData;
  const tagihanIdFromExtra = extraData?.tagihanId ?? null;

  let eventId: string | null = null;
  try {
    const [event] = await db
      .insert(paymentWebhookEvents)
      .values({
        provider: "mayar",
        providerEventId,
        providerTransactionId,
        eventType,
        payload: body as unknown as Record<string, unknown>,
        processingStatus: "received",
      })
      .returning({ id: paymentWebhookEvents.id });
    eventId = event.id;
  } catch (error) {
    console.error("Gagal menyimpan webhook event:", error);
    return NextResponse.json({ ok: true, message: "already received" });
  }

  const isSuccess =
    (eventType && SUCCESS_EVENT_PATTERN.test(eventType)) ||
    (body.data?.status === true &&
      typeof eventType === "string" &&
      /payment|transaction|invoice/i.test(eventType));
  const isFailure = eventType ? FAILURE_EVENT_PATTERN.test(eventType) : false;

  if (!isSuccess && !isFailure) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "ignored",
        processedAt: new Date(),
        errorMessage: `Event type tidak dikenali: ${eventType ?? "unknown"}`,
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json({ ok: true, message: "event ignored" });
  }

  let pembayaran: { id: string; status: string; tagihanSppId: string } | null = null;

  if (tagihanIdFromExtra) {
    const [row] = await db
      .select({
        id: pembayaranSpp.id,
        status: pembayaranSpp.status,
        tagihanSppId: pembayaranSpp.tagihanSppId,
      })
      .from(pembayaranSpp)
      .where(
        and(
          eq(pembayaranSpp.tagihanSppId, tagihanIdFromExtra),
          or(eq(pembayaranSpp.status, "pending"), eq(pembayaranSpp.status, "processing")),
        ),
      )
      .orderBy(desc(pembayaranSpp.createdAt))
      .limit(1);
    pembayaran = row ?? null;
  }

  if (!pembayaran && providerTransactionId) {
    const [row] = await db
      .select({
        id: pembayaranSpp.id,
        status: pembayaranSpp.status,
        tagihanSppId: pembayaranSpp.tagihanSppId,
      })
      .from(pembayaranSpp)
      .where(
        or(
          eq(pembayaranSpp.providerTransactionId, providerTransactionId),
          eq(pembayaranSpp.providerInvoiceId, providerTransactionId),
        ),
      )
      .orderBy(desc(pembayaranSpp.createdAt))
      .limit(1);
    pembayaran = row ?? null;
  }

  if (!pembayaran) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "failed",
        processedAt: new Date(),
        errorMessage: "Transaksi pembayaran terkait tidak ditemukan.",
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json(
      { ok: false, error: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }

  if (pembayaran.status === "paid") {
    await db
      .update(paymentWebhookEvents)
      .set({ processingStatus: "processed", processedAt: new Date() })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json({ ok: true, message: "already paid" });
  }

  try {
    if (isSuccess) {
      await db
        .update(pembayaranSpp)
        .set({
          status: "paid",
          paidAt: new Date(),
          nominalDibayar: body.data?.amount ?? null,
          totalDibayar: body.data?.amount ?? null,
          paymentMethod: body.data?.paymentMethod ?? null,
          providerPayload: body.data ?? null,
        })
        .where(eq(pembayaranSpp.id, pembayaran.id));

      await db
        .update(tagihanSpp)
        .set({ status: "paid" })
        .where(
          and(
            eq(tagihanSpp.id, pembayaran.tagihanSppId),
            or(
              eq(tagihanSpp.status, "unpaid"),
              eq(tagihanSpp.status, "pending"),
              eq(tagihanSpp.status, "processing"),
            ),
          ),
        );
    } else {
      const newStatus = eventType?.includes("expired") ? "expired" : "failed";
      await db
        .update(pembayaranSpp)
        .set({ status: newStatus, providerPayload: body.data ?? null })
        .where(eq(pembayaranSpp.id, pembayaran.id));

      await db
        .update(tagihanSpp)
        .set({ status: "unpaid" })
        .where(
          and(
            eq(tagihanSpp.id, pembayaran.tagihanSppId),
            or(
              eq(tagihanSpp.status, "pending"),
              eq(tagihanSpp.status, "processing"),
            ),
          ),
        );
    }

    await db
      .update(paymentWebhookEvents)
      .set({ processingStatus: "processed", processedAt: new Date() })
      .where(eq(paymentWebhookEvents.id, eventId));

    await logActivity({
      aksi: isFailure ? "webhook_payment_failed" : "webhook_payment_paid",
      entitas: "pembayaran_spp",
      entitasId: pembayaran.id,
      detail: { eventType, providerEventId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "failed",
        processedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "unknown error",
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    console.error("Gagal memproses webhook Mayar:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memproses webhook." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method tidak diizinkan." },
    { status: 405 },
  );
}
