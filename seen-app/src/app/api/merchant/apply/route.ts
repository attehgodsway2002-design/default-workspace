import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, addMerchant, saveDb } from "@/lib/db";
import { resolveUser, sessionFor, setSession } from "@/lib/auth";
import { corridorFromGhanaPost, isValidGhanaPost, regionOf } from "@/lib/ghana";
import { slugify } from "@/lib/utils";
import type { CategoryId, CorridorId } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, supabaseConfigured } from "@/lib/supabase/server";

const Body = z.object({
  name: z.string().min(2).max(80),
  categoryId: z.enum(["food", "beauty", "repair", "health", "fitness", "professional"]),
  corridorId: z.enum(["osu", "east-legon", "kumasi-adum"]),
  description: z.string().min(20).max(600),
  hours: z.string().min(3).max(80),
  priceBand: z.number().int().min(1).max(3),
  ghanapost: z.string().min(8).max(14),
  phone: z.string().min(9).max(20),
  email: z.string().email(),
  plan: z.enum(["starter", "boost", "billboard"]).default("starter"),
});

/** Merchant application: creates a pending listing, a merchant user and a session. */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Some details are missing or invalid. Check the form and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  if (!isValidGhanaPost(input.ghanapost)) {
    return NextResponse.json(
      { ok: false, error: "That GhanaPostGPS address is not valid (expected GA-585-7449)." },
      { status: 400 },
    );
  }

  if (supabaseConfigured()) {
    const authClient = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!authClient || !admin) {
      return NextResponse.json(
        { ok: false, error: "Business applications are not configured on this server." },
        { status: 503 },
      );
    }

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Sign in before applying as a business." }, { status: 401 });
    }
    if (authData.user.email?.toLowerCase() !== input.email.trim().toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Use the verified email address on your Seen account." },
        { status: 403 },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("id")
      .eq("auth_id", authData.user.id)
      .maybeSingle();
    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, error: "Your account profile is not ready. Sign out and sign in again." },
        { status: 503 },
      );
    }

    const { data: corridor, error: corridorError } = await admin
      .from("corridors")
      .select("id")
      .eq("id", input.corridorId)
      .eq("live", true)
      .maybeSingle();
    if (corridorError || !corridor) {
      return NextResponse.json(
        { ok: false, error: "Choose one of the currently supported launch areas." },
        { status: 400 },
      );
    }

    const { data: application, error: applicationError } = await admin
      .from("merchant_applications")
      .insert({
        owner_id: profile.id,
        name: input.name.trim(),
        category_id: input.categoryId,
        requested_corridor_id: input.corridorId,
        description: input.description.trim(),
        ghanapost: input.ghanapost.trim().toUpperCase(),
        phone: input.phone.trim(),
        email: authData.user.email,
        hours: input.hours.trim(),
        price_band: input.priceBand,
        requested_tier: input.plan,
      })
      .select("id, status")
      .single();

    if (applicationError) {
      const duplicate = applicationError.code === "23505";
      return NextResponse.json(
        {
          ok: false,
          error: duplicate
            ? "You already have a business application awaiting review."
            : "We couldn't save your application. Check the setup and try again.",
        },
        { status: duplicate ? 409 : 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      redirect: "/onboarding?submitted=1",
      application: { id: application.id, status: application.status },
      region: regionOf(input.ghanapost),
      plan: input.plan,
    });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Business applications need the Supabase project and database configured." },
      { status: 503 },
    );
  }

  const db = getDb();
  const corridorId: CorridorId =
    corridorFromGhanaPost(input.ghanapost) ?? (input.corridorId as CorridorId);
  const corridor = db.corridors.find((c) => c.id === corridorId) ?? db.corridors[0]!;

  let slug = `${slugify(input.name)}-${corridorId}`;
  if (db.merchants.some((m) => m.slug === slug)) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
  }

  const merchant = addMerchant({
    name: input.name.trim(),
    slug,
    categoryId: input.categoryId as CategoryId,
    corridorId,
    tagline: input.description.slice(0, 90),
    description: input.description,
    ghanapost: input.ghanapost,
    gps: {
      lat: corridor.center.lat + (Math.random() - 0.5) * 0.006,
      lng: corridor.center.lng + (Math.random() - 0.5) * 0.006,
    },
    phone: input.phone,
    email: input.email,
    hours: input.hours,
    priceBand: input.priceBand as 1 | 2 | 3,
    ownerUserId: undefined,
  });

  const user = resolveUser(input.email);
  user.role = "merchant";
  user.merchantId = merchant.id;
  merchant.ownerUserId = user.id;
  saveDb(db);

  await setSession(sessionFor(user));

  return NextResponse.json({
    ok: true,
    redirect: "/merchant?welcome=1",
    merchant: { id: merchant.id, slug: merchant.slug, status: merchant.status },
    region: regionOf(input.ghanapost),
    plan: input.plan,
  });
}
