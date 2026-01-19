
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

// ВАЖНО:
// 1) Тут обычно нужно проверить подпись уведомления (Token) по правилам Т-Банка/SDK.
// 2) Я оставляю минимально рабочую логику подтверждения по Status.
// Для продакшена подпись обязательно добавить (в tbank SDK обычно есть проверка).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body;
  const status = String(body?.Status || "");
  const orderId = String(body?.OrderId || "");
  const paymentId = String(body?.PaymentId || "");

  // Успешная оплата (обычно CONFIRMED / AUTHORIZED / CONFIRMED — зависит от схемы)
  const isPaid = ["CONFIRMED", "AUTHORIZED"].includes(status);

  if (!orderId) return res.status(400).json({ error: "No OrderId" });

  if (isPaid) {
    await db.booking.updateMany({
      where: { id: orderId, tbankPaymentId: paymentId },
      data: { status: "CONFIRMED" }
    });
  } else if (["REJECTED", "CANCELED", "REFUNDED"].includes(status)) {
    await db.booking.updateMany({
      where: { id: orderId, tbankPaymentId: paymentId },
      data: { status: "CANCELED" }
    });
  }

  // Т-Банк ожидает “OK”
  res.status(200).send("OK");
}
