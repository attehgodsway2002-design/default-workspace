import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import { getDemoMerchant, getMerchantById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * Ghana mobile numbers in the formats merchants actually type:
 * 020 774 1180 · 0207741180 · +233 20 774 1180.
 */
const ghanaPhoneSchema = z
  .string()
  .trim()
  .min(9, "Enter a Ghanaian mobile number, e.g. 020 774 1180.")
  .max(20, "That number is too long.")
  .refine(
    (value) => /^(?:\+?233|0)\d{9}$/.test(value.replace(/[\s().-]/g, "")),
    "Enter a Ghanaian mobile number, e.g. 020 774 1180.",
  );

const amenitiesSchema = z
  .string()
  .trim()
  .max(400, "Keep amenities under 400 characters.")
  .refine(
    (value) => value.split(",").filter((item) => item.trim()).length > 0,
    "Add at least one amenity, separated by commas.",
  )
  .refine(
    (value) => value.split(",").filter((item) => item.trim()).length <= 12,
    "Use at most 12 amenities.",
  );

const profileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep the name under 80 characters."),
  tagline: z
    .string()
    .trim()
    .min(5, "Add a short tagline.")
    .max(140, "Keep the tagline under 140 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters so shoppers know what you offer.")
    .max(1200, "Keep the description under 1200 characters."),
  phone: ghanaPhoneSchema,
  whatsapp: ghanaPhoneSchema,
  hours: z.string().trim().min(3, "Add your opening hours.").max(120, "Keep hours under 120 characters."),
  amenities: amenitiesSchema,
  priceBand: z.coerce.number().int().min(1, "Choose a price band.").max(3, "Choose a price band."),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json(
      { ok: false, error: "Sign in as a merchant to update your storefront." },
      { status: 401 },
    );
  }

  const merchant =
    (session.merchantId ? getMerchantById(session.merchantId) : undefined) ?? getDemoMerchant();
  if (!merchant) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find your merchant account." },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Some details need fixing before we can save.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const amenities = data.amenities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  updateDb((db) => {
    const record = db.merchants.find((item) => item.id === merchant.id);
    if (!record) return;
    record.name = data.name;
    record.tagline = data.tagline;
    record.description = data.description;
    record.phone = data.phone;
    record.whatsapp = data.whatsapp;
    record.hours = data.hours;
    record.amenities = amenities;
    record.priceBand = data.priceBand as 1 | 2 | 3;
  });

  const saved = getDb().merchants.find((item) => item.id === merchant.id);
  return NextResponse.json({
    ok: true,
    merchant: saved
      ? {
          id: saved.id,
          name: saved.name,
          tagline: saved.tagline,
          description: saved.description,
          phone: saved.phone,
          whatsapp: saved.whatsapp,
          hours: saved.hours,
          amenities: saved.amenities,
          priceBand: saved.priceBand,
          ghanapost: saved.ghanapost,
        }
      : null,
  });
}
