"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import type { Merchant } from "@/lib/types";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { initials } from "@/lib/format";
import { isValidGhanaPost, regionOf } from "@/lib/ghana";
import { cn } from "@/lib/utils";
import { actionLink, priceBandLabel } from "./ui";

interface FormState {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  hours: string;
  amenities: string;
  priceBand: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function initialState(merchant: Merchant): FormState {
  return {
    name: merchant.name,
    tagline: merchant.tagline,
    description: merchant.description,
    phone: merchant.phone,
    whatsapp: merchant.whatsapp,
    hours: merchant.hours,
    amenities: merchant.amenities.join(", "),
    priceBand: String(merchant.priceBand),
  };
}

export function StorefrontEditor({
  merchant,
  categoryName,
  corridorName,
  isDemoMerchant,
}: {
  merchant: Merchant;
  categoryName: string;
  corridorName: string;
  isDemoMerchant: boolean;
}) {
  const router = useRouter();
  const initial = initialState(merchant);
  const [form, setForm] = React.useState<FormState>(initial);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const ghanapostValid = isValidGhanaPost(merchant.ghanapost);
  const region = ghanapostValid ? regionOf(merchant.ghanapost) : null;
  const dirty = (Object.keys(initial) as (keyof FormState)[]).some(
    (key) => form[key] !== initial[key],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    try {
      const response = await fetch("/api/merchant/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, priceBand: Number(form.priceBand) }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
        merchant?: {
          name: string;
          tagline: string;
          description: string;
          phone: string;
          whatsapp: string;
          hours: string;
          amenities: string[];
          priceBand: number;
        };
      };
      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) setErrors(payload.fieldErrors);
        toast(payload.error ?? "We couldn't save your storefront. Check the fields and try again.", "error");
        return;
      }
      if (payload.merchant) {
        const saved = payload.merchant;
        setForm({
          name: saved.name,
          tagline: saved.tagline,
          description: saved.description,
          phone: saved.phone,
          whatsapp: saved.whatsapp,
          hours: saved.hours,
          amenities: saved.amenities.join(", "),
          priceBand: String(saved.priceBand),
        });
      }
      setSavedAt(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      );
      toast("Storefront updated — the changes are live on your public listing.", "success");
      router.refresh();
    } catch {
      toast("Network error — your storefront wasn't saved. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  const amenities = form.amenities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const previewName = form.name.trim() || merchant.name;
  const previewTagline = form.tagline.trim() || merchant.tagline;

  return (
    <form
      id="storefront-form"
      onSubmit={onSubmit}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
      noValidate
    >
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Listing details</CardTitle>
                <CardDescription>Write it the way a customer would describe you.</CardDescription>
              </div>
              <Button type="submit" size="sm" disabled={saving || !dirty}>
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Business name" error={errors.name} hint="The headline in search results.">
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={80}
                autoComplete="organization"
                aria-invalid={Boolean(errors.name)}
              />
            </Field>
            <Field label="Tagline" error={errors.tagline} hint="One line, under 140 characters.">
              <Input
                value={form.tagline}
                onChange={(event) => update("tagline", event.target.value)}
                maxLength={140}
                aria-invalid={Boolean(errors.tagline)}
              />
            </Field>
            <Field
              label="Description"
              error={errors.description}
              hint="What you sell, who it's for, what makes the trip worth it."
            >
              <Textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={5}
                maxLength={1200}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone"
                error={errors.phone}
                hint="Used for the tap-to-call button. Ghana mobile format."
              >
                <Input
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
              </Field>
              <Field label="WhatsApp" error={errors.whatsapp} hint="Shown on your listing.">
                <Input
                  value={form.whatsapp}
                  onChange={(event) => update("whatsapp", event.target.value)}
                  inputMode="tel"
                  aria-invalid={Boolean(errors.whatsapp)}
                />
              </Field>
              <Field
                label="Opening hours"
                error={errors.hours}
                hint="Free text, e.g. Mon–Sat 08:00–20:00."
              >
                <Input
                  value={form.hours}
                  onChange={(event) => update("hours", event.target.value)}
                  maxLength={120}
                  aria-invalid={Boolean(errors.hours)}
                />
              </Field>
              <Field label="Price band" error={errors.priceBand} hint="A signal, not a promise.">
                <Select
                  value={form.priceBand}
                  onChange={(event) => update("priceBand", event.target.value)}
                  aria-invalid={Boolean(errors.priceBand)}
                >
                  <option value="1">1 — Budget friendly</option>
                  <option value="2">2 — Mid-range</option>
                  <option value="3">3 — Premium</option>
                </Select>
              </Field>
            </div>
            <Field
              label="Amenities"
              error={errors.amenities}
              hint="Comma separated, up to 12 — e.g. Wifi, Outdoor seating, Card & MoMo"
            >
              <Textarea
                value={form.amenities}
                onChange={(event) => update("amenities", event.target.value)}
                rows={2}
                maxLength={400}
                aria-invalid={Boolean(errors.amenities)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address & verification</CardTitle>
            <CardDescription>
              Your GhanaPostGPS address is set and checked by Seen&apos;s field team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="GhanaPostGPS"
              hint={
                ghanapostValid
                  ? `Valid ${region ?? "Ghana"} digital address — used on your listing and for deliveries.`
                  : "This address doesn't match the GhanaPostGPS format."
              }
            >
              <div className="relative">
                <Input
                  value={merchant.ghanapost}
                  readOnly
                  aria-readonly="true"
                  className="bg-ink-50 pr-9 font-mono"
                />
                {ghanapostValid && (
                  <Check
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E6B4F]"
                    aria-hidden
                  />
                )}
              </div>
            </Field>
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 p-3 text-[12px] text-ink-500">
              <Badge tone={merchant.status === "verified" ? "green" : "gold"}>
                {merchant.status === "verified" ? (
                  <>
                    <BadgeCheck className="h-3 w-3" aria-hidden /> Verified by Seen
                  </>
                ) : (
                  "Verification pending"
                )}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {merchant.landmark}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-400">
              Read-only: the digital address must stay mapped to the physical storefront. Ask your
              Seen rep for a field re-check if something has moved.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div aria-live="polite" className="text-[12px] text-ink-500">
              {saving
                ? "Saving your changes…"
                : savedAt
                  ? `Saved at ${savedAt} — live on your listing.`
                  : dirty
                    ? "You have unsaved changes."
                    : "All changes saved."}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm(initial);
                  setErrors({});
                  toast("Unsaved changes reverted.");
                }}
                disabled={!dirty || saving}
              >
                Reset
              </Button>
              <Button type="submit" size="sm" disabled={saving || !dirty}>
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Search preview</h3>
          <Badge tone="sun">Live</Badge>
        </div>
        <Card className="overflow-hidden">
          <div className="relative h-28 overflow-hidden bg-ink-900">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 22%, rgba(224,165,38,0.45), transparent 55%), radial-gradient(circle at 82% 84%, rgba(30,107,79,0.55), transparent 60%)",
              }}
              aria-hidden
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-2xl font-semibold tracking-[0.25em] text-white/90">
                {initials(previewName)}
              </span>
            </div>
            <div className="absolute left-3 top-3">
              <TierBadge tier={merchant.tier} />
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="min-w-0 truncate text-base font-semibold text-ink-900">
                {previewName}
              </h4>
              {merchant.status === "verified" && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-[#1E6B4F]"
                  aria-label="Verified by Seen"
                />
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
              {previewTagline}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-ink-400">
              <Badge tone="neutral">{categoryName}</Badge>
              <span>·</span>
              <span className="truncate">{corridorName}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-[#E0A526] text-[#E0A526]" aria-hidden />
                {merchant.rating.toFixed(1)} ({merchant.reviewCount})
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              <span className="truncate">{form.hours.trim() || "Hours not set"}</span>
              <span className="shrink-0 font-semibold text-ink-700">
                {priceBandLabel(Number(form.priceBand))}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-ink-400">
              {form.description.trim() || "Add a description so shoppers know what to expect."}
            </p>
            {amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-500"
                  >
                    {amenity}
                  </span>
                ))}
                {amenities.length > 4 && (
                  <span className="px-1 py-0.5 text-[10px] text-ink-400">
                    +{amenities.length - 4} more
                  </span>
                )}
              </div>
            )}
            <div className="mt-3 flex items-center gap-1.5 border-t border-ink-100 pt-2.5 text-[11px] text-ink-400">
              <MapPin className="h-3 w-3" aria-hidden />
              <span className="font-mono">{merchant.ghanapost}</span>
            </div>
          </CardContent>
        </Card>
        <p className="text-[11px] leading-relaxed text-ink-400">
          This card mirrors how you appear in Seen search results. The public listing adds your
          360° tour, reviews and full amenity list.
        </p>
        <Link href={`/business/${merchant.slug}`} className={cn(actionLink("outline", "sm"), "w-full")}>
          Open public listing
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {isDemoMerchant && (
          <p className="rounded-xl border border-ink-100 bg-white p-3 text-[11px] leading-relaxed text-ink-400">
            You&apos;re editing the demo storefront the team uses for reviews. Changes persist in the
            local Seen data store.
          </p>
        )}
      </aside>
    </form>
  );
}
