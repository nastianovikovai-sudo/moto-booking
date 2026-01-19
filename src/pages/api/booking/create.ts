import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { parseYMD, daysInclusive, busyEnd, overlaps } from "@/lib/dates";
import { tbank } from "@/lib/tbank";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const schema = z.object({
    bikeId: z.string().min(1),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    phone: z.string().optional(),
    email: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { bikeId, start, end } = parsed.data;
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (s > e) return res.status(400).json({ error: "start > end" });

  const bike = await db.bike.findUnique({ where: { id: bikeId } });
  if (!bike || !bike.isActive) return res.status(404).json({ error: "Bike not found" });

  const rentDays = daysInclusive(s, e);
  const totalRub = rentDays * bike.pricePerDayRub;
  const payFirstDayRub = bike.pricePerDayRub;

  const appUrl = process.env.APP_URL!;

  const result = await db.$transaction(async (tx) => {
    const confirmed = await tx.booking.findMany({ where: { bikeId, status: "CONFIRMED" } });
    const busy = confirmed.some(b => overlaps(s, e, b.startDate, busyEnd(b.endDate, b.prepDays)));
    if (busy) return { ok: false as const, reason: "BUSY" as const };

    // создаём бронь
    const booking = await tx.booking.create({
      data: {
        bikeId,
        startDate: s,
        endDate: e,
        prepDays: bike.prepDays,
        totalRub,
        payFirstDayRub,
        status: "PENDING_PAYMENT"
      }
    });

    // Init платежа в Т-Банке (сумма в копейках)
    const orderId = booking.id; // удобно: orderId = bookingId
    const init = await tbank.init({
      Amount: payFirstDayRub * 100,
      OrderId: orderId,
      Description: `Бронь мото: ${bike.brand} ${bike.model} (${start}—${end}), оплата 1 суток`,
      SuccessURL: `${appUrl}/success?bookingId=${booking.id}`,
      FailURL: `${appUrl}/fail?bookingId=${booking.id}`,
      NotificationURL: `${appUrl}/api/tbank/notify`
    });

    if (!init?.Success || !init?.PaymentURL || !init?.PaymentId) {
      return { ok: false as const, reason: "PAY_INIT_FAILED" as const };
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { tbankPaymentId: String(init.PaymentId), tbankOrderId: String(orderId) }
    });

    return { ok: true as const, bookingId: booking.id, payUrl: init.PaymentURL };
  });

  if (!result.ok) {
    const code = result.reason === "BUSY" ? 409 : 500;
    return res.status(code).json({ error: result.reason });
  }

  res.json({ bookingId: result.bookingId, payUrl: result.payUrl });
}

