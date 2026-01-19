import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const bikes = await db.bike.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  res.json(bikes);
}

