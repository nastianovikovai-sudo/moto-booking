import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const schema = z.object({
    brand: z.string().min(1),
    model: z.string().min(1),
    pricePerDayRub: z.number().int().positive(),
    prepDays: z.number().int().min(0).default(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const bike = await db.bike.create({ data: parsed.data });
  res.json(bike);
}

