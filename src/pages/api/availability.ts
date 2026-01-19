import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseYMD, busyEnd, overlaps } from "@/lib/dates";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const bikeId = String(req.query.bikeId || "");
  const start = String(req.query.start || "");
  const end = String(req.query.end || "");
  if (!bikeId || !start || !end) return res.status(400).json({ error: "bikeId,start,end required" });

  const s = parseYMD(start);
  const e = parseYMD(end);
  if (s > e) return res.status(400).json({ error: "start > end" });

  const confirmed = await db.booking.findMany({
    where: { bikeId, status: "CONFIRMED" }
  });

  const busy = confirmed.some(b => overlaps(s, e, b.startDate, busyEnd(b.endDate, b.prepDays)));
  res.json({ available: !busy });
}

