"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cedis } from "@/lib/format";
import { isValidGhanaPost, regionOf } from "@/lib/ghana";
import { cn } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    blurb: "Verified listing. Free forever.",
  },
  {
    id: "boost",
    name: "Boost",
    price: 99,
    blurb: "Priority in category + 2 km radius, 360° slot, weekly digest.",
  },
  {
    id: "billboard",
    name: "Billboard",
    price: 249,
    blurb: "Top of the corridor feed, produced 360° tour, monthly call.",
  },
] as const;

export function OnboardingForm({
  categories,
  corridors,
  initialPlan,
}: {
  categories: CategoryOption[];
  corridors: CategoryOption[];
  initialPlan: "starter" | "boost" | "billboard";
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    categoryId: categories[0]?.id ?? "food",
    corridorId: corridors[0]?.id ?? "osu",
    description: "",
    hours: "Mon–Sat 08:00–20:00",
    priceBand: "2",
    ghanapost: "",
    phone: "",
    email: "",
    plan: initialPlan,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const gpsValid = isValidGhanaPost(form.ghanapost);
  const region = gpsValid ? regionOf(form.ghanapost) : null;
  const requestedCorridor = corridors.find((item) => item.id === form.corridorId);

  const stepOneValid = form.name.trim().length >= 2 && form.description.trim().length >= 20;
  const stepTwoValid = gpsValid && form.phone.replace(/\D/g, "").length >= 9 && form.email.includes("@");

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceBand: Number(form.priceBand),
        }),
      });
      const data = (await res.json()) as { ok: boolean; redirect?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not submit your listing");
      router.push(data.redirect ?? "/merchant?welcome=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2">
        {["Business", "Location", "Plan"].map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                index < step
                  ? "bg-[#1E6B4F] text-white"
                  : index === step
                    ? "bg-ink-900 text-white"
                    : "bg-ink-100 text-ink-400",
              )}
            >
              {index < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-[11.5px] font-medium",
                index === step ? "text-ink-900" : "text-ink-400",
              )}
            >
              {label}
            </span>
            {index < 2 && <div className="h-px flex-1 bg-ink-100" />}
          </div>
        ))}
      </div>

      <div className="mt-6 min-h-[330px]">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Business name">
              <Input
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Kente & Koffee"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price band">
                <Select value={form.priceBand} onChange={(event) => set("priceBand", event.target.value)}>
                  <option value="1">Budget-friendly</option>
                  <option value="2">Mid-range</option>
                  <option value="3">Premium</option>
                </Select>
              </Field>
            </div>
            <Field label="What should customers know?" hint="Minimum 20 characters — this is your card in the feed.">
              <Textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Single-origin Ghanaian coffee, all-day breakfast and fast wifi on Oxford Street."
              />
            </Field>
            <Field label="Opening hours">
              <Input value={form.hours} onChange={(event) => set("hours", event.target.value)} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Nearest launch area">
              <Select value={form.corridorId} onChange={(event) => set("corridorId", event.target.value)}>
                {corridors.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>{corridor.name}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="GhanaPostGPS digital address"
              hint="Format GA-585-7449. A Seen rep verifies the point on site before your listing goes live."
              error={form.ghanapost.length > 4 && !gpsValid ? "That is not a valid GhanaPostGPS format." : undefined}
            >
              <Input
                value={form.ghanapost}
                onChange={(event) => set("ghanapost", event.target.value.toUpperCase())}
                placeholder="GA-512-3388"
                className="metric tracking-wide"
              />
            </Field>
            {gpsValid && (
              <div className="flex items-start gap-2 rounded-xl bg-[#E7F3EC] p-3 text-[12px] text-[#1E6B4F]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <strong>{region ?? "Region"}</strong> address format accepted. A Seen representative will verify the exact point before publication.
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone (mobile money number)">
                <Input
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  placeholder="024 555 0142"
                />
              </Field>
              <Field label="Email for the weekly digest">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="owner@business.gh"
                />
              </Field>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-ink-100 p-3 text-[11.5px] leading-relaxed text-ink-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
              We never publish your personal phone number — the listing shows a business line you
              confirm during verification.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => set("plan", plan.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  form.plan === plan.id
                    ? "border-ink-900 bg-ink-50/60"
                    : "border-ink-100 hover:border-ink-200",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 place-items-center rounded-full border",
                    form.plan === plan.id ? "border-ink-900 bg-ink-900" : "border-ink-300",
                  )}
                >
                  {form.plan === plan.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-baseline justify-between">
                    <span className="text-[14px] font-semibold text-ink-900">{plan.name}</span>
                    <span className="metric text-[13px] font-semibold text-ink-800">
                      {plan.price === 0 ? "Free" : `${cedis(plan.price)}/mo`}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">{plan.blurb}</span>
                </span>
              </button>
            ))}
            <div className="rounded-xl bg-ink-50 p-3 text-[11.5px] leading-relaxed text-ink-500">
              You are applying as a <strong className="text-ink-800">Founding Merchant</strong> in{" "}
              {requestedCorridor?.name ?? "your selected area"}: your price is locked for 24 months,
              your first month is free, and your listing stays live once verified.
            </div>
            {error && (
              <div className="rounded-xl bg-[#FBEAE5] p-3 text-[12px] font-medium text-[#A8442A]">{error}</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-50 pt-4">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className={cn(
            "text-[12.5px] font-medium text-ink-500 hover:text-ink-800",
            step === 0 && "invisible",
          )}
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          {step < 2 ? (
            <Button
              onClick={() => setStep((value) => value + 1)}
              disabled={step === 0 ? !stepOneValid : !stepTwoValid}
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="sun" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Submitting…" : "Submit for verification"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
