import { NextRequest, NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { pembayaranSpp, paymentWebhookEvents } from "@/db/schema";
import {
  normalizeMidtransStatus,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { prosesStatusPembayaran } from "@/lib/pembayaran";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  merchant_id?: string;
  status_message?: string;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  let body: MidtransNotification;
  try {
    body = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload bukan JSON yang valid." },
      { status: 400 },
    );
  }

  const orderId = typeof body.order_id === "string" ? body.order_id : null;
  const notifikasiInformasional =
    orderId === null || orderId.startsWith("payment_notif_test_");

  const signatureValid = verifyMidtransSignature({
    orderId: body.order_id,
    statusCode: body.status_code,
    grossAmount: body.gross_amount,
    signatureKey: body.signature_key,
  });

  let eventId: string | null = null;
  try {
    const [event] = await db
      .insert(paymentWebhookEvents)
      .values({
        provider: "midtrans",
        providerEventId: body.transaction_id ?? null,
        providerTransactionId: body.order_id ?? null,
        eventType: body.transaction_status ?? null,
        payload: body as unknown as Record<string, unknown>,
        processingStatus: "received",
      })
      .returning({ id: paymentWebhookEvents.id });
    eventId = event.id;
  } catch (error) {
    console.error("Gagal menyimpan webhook Midtrans:", error);
    return NextResponse.json({ ok: true, message: "already received" });
  }

  if (notifikasiInformasional) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "ignored",
        processedAt: new Date(),
        errorMessage: orderId
          ? "Notifikasi uji coba Midtrans (payment_notif_test_) — dibalas 200 agar tes dashboard berhasil."
          : "Notifikasi informasional Midtrans tanpa order_id (mis. account linked/recurring test).",
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json({ ok: true, test: true });
  }

  if (!signatureValid) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "failed",
        processedAt: new Date(),
        errorMessage: "Signature webhook tidak valid.",
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json(
      { ok: false, error: "Signature webhook tidak valid." },
      { status: 401 },
    );
  }

  const [pembayaran] = await db
    .select({ id: pembayaranSpp.id })
    .from(pembayaranSpp)
    .where(
      or(
        eq(pembayaranSpp.providerOrderId, orderId),
        eq(pembayaranSpp.providerTransactionId, orderId),
        eq(pembayaranSpp.providerInvoiceId, orderId),
      ),
    )
    .orderBy(desc(pembayaranSpp.createdAt))
    .limit(1);

  if (!pembayaran) {
    await db
      .update(paymentWebhookEvents)
      .set({
        processingStatus: "failed",
        processedAt: new Date(),
        errorMessage: `Transaksi order_id ${orderId} tidak ditemukan.`,
      })
      .where(eq(paymentWebhookEvents.id, eventId));
    return NextResponse.json(
      { ok: false, error: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }

  const status = normalizeMidtransStatus(
    body.transaction_status ?? "",
    body.fraud_status,
  );

  try {
    await prosesStatusPembayaran({
      pembayaranId: pembayaran.id,
      status,
      amount: body.gross_amount ? Math.round(Number(body.gross_amount)) : null,
      metode: body.payment_type ?? null,
      transactionId: body.transaction_id ?? null,
      payload: body,
      aktorAksi: `webhook_midtrans_${body.transaction_status ?? "unknown"}`,
    });

    await db
      .update(paymentWebhookEvents)
      .set({ processingStatus: "processed", processedAt: new Date() })
      .where(eq(paymentWebhookEvents.id, eventId));

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
    console.error("Gagal memproses webhook Midtrans:", error);
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
