import Link from "next/link";
import { ArrowRight, Check, CircleSlash, Sparkles, TrendingUp, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { RoiCalculator } from "@/components/consumer/roi-calculator";
import { Badge } from "@/components/ui/badge";
import { cedis } from "@/lib/format";
import { getCategory, liveCorridors, listCategories, getPlans, slotInventory } from "@/lib/db/public";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plans & pricing",
  description:
    "Seen's merchant plans: Starter free, Boost GH₵99/month, Billboard GH₵249/month. Measured impressions, direction requests and till QR redemptions.",
};

export default async function PricingPage() {
  const plans = getPlans();
  const corridors = liveCorridors();
  const categories = listCategories();
  const food = getCategory("food");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-ink-100 bg-white">
        <div className="container py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
              <Sparkles className="h-3.5 w-3.5 text-sun-500" /> For business owners
            </div>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink-900 sm:text-[42px]">
              Attention in Accra is finite.
              <br />
              Buy the part that matters.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-600">
              Seen only lists businesses we have visited, photographed and mapped. Three
              placements, one dashboard, and a price you can hold us to. No agency retainer, no
              website to maintain, no impressions you cannot see.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px] text-ink-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-[#1E6B4F]" /> Pay with MTN MoMo, Telecel Cash, AT Money
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-[#1E6B4F]" /> Cancel any month
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-[#1E6B4F]" /> 24-month price lock for founding merchants
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPopular = plan.tier === "boost";
            return (
              <div
                key={plan.tier}
                className={
                  isPopular
                    ? "relative rounded-3xl border-2 border-ink-900 bg-white p-6 shadow-lift"
                    : "relative rounded-3xl border border-ink-100 bg-white p-6 shadow-card"
                }
              >
                {isPopular && (
                  <div className="absolute -top-3 left-6 rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                    Most merchants choose this
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-ink-900">{plan.name}</h2>
                  <Badge tone={plan.tier === "billboard" ? "ink" : plan.tier === "boost" ? "sun" : "outline"}>
                    {plan.slotsPerCategory ? `${plan.slotsPerCategory} slots / category` : "Unlimited listings"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="metric text-[34px] font-semibold leading-none text-ink-900">
                    {plan.priceCedis === 0 ? "Free" : cedis(plan.priceCedis)}
                  </span>
                  {plan.priceCedis > 0 && <span className="mb-1 text-[12.5px] text-ink-400">/month</span>}
                </div>
                <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-ink-500">
                  {plan.tier === "starter"
                    ? "A verified listing with your GhanaPostGPS address. The honest on-ramp."
                    : plan.tier === "boost"
                      ? "Priority inside your category and 2 km radius, with the dashboard to prove it."
                      : "Top of the corridor feed, a produced 360° tour and first refusal on mini-app placement."}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-600">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#E7F3EC] text-[#1E6B4F]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.tier === "starter" ? "/onboarding" : `/onboarding?plan=${plan.tier}`}
                  className={
                    isPopular
                      ? "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[13px] font-semibold text-white hover:bg-ink-800"
                      : "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[13px] font-semibold text-ink-900 hover:border-ink-300"
                  }
                >
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container pb-10">
        <RoiCalculator defaultTicket={food?.avgTicketCedis ?? 72} />
      </section>

      <section className="container pb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              Placement availability
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Slots are capped per category per corridor. When a category sells out, the next
              merchant joins a waitlist and the price ladder moves.
            </p>
          </div>
          <Badge tone="gold">Updated today</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {corridors.map((corridor) => {
            const inventory = slotInventory(corridor.id);
            return (
              <div key={corridor.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                <div className="flex items-center justify-between border-b border-ink-50 px-5 py-3">
                  <div>
                    <div className="text-[14px] font-semibold text-ink-900">{corridor.name}</div>
                    <div className="text-[11.5px] text-ink-400">
                      {corridor.targetStorefronts} storefronts in the census · {corridor.city}
                    </div>
                  </div>
                  <Badge tone="green">Live</Badge>
                </div>
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-ink-50 text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                      <th className="px-5 py-2 font-semibold">Category</th>
                      <th className="px-2 py-2 font-semibold">Billboard</th>
                      <th className="px-2 py-2 font-semibold">Boost</th>
                      <th className="px-5 py-2 text-right font-semibold">Waitlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {inventory.map(({ category, billboards, boosts }) => {
                      const bbSold = billboards.filter((s) => s.status === "sold").length;
                      const boSold = boosts.filter((s) => s.status === "sold").length;
                      const waitlist = [...billboards, ...boosts].reduce((sum, s) => sum + s.waitlist, 0);
                      return (
                        <tr key={category.id}>
                          <td className="px-5 py-2.5 text-ink-700">{category.name}</td>
                          <td className="px-2 py-2.5">
                            <span className="metric text-ink-800">{bbSold}/{billboards.length}</span>
                            <span className="ml-1 text-[10.5px] text-ink-400">sold</span>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="metric text-ink-800">{boSold}/{boosts.length}</span>
                            <span className="ml-1 text-[10.5px] text-ink-400">sold</span>
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            {waitlist > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sun-700">
                                <Users className="h-3 w-3" /> {waitlist}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-ink-300">
                                <CircleSlash className="h-3 w-3" /> none
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11.5px] text-ink-400">
          {categories.length} categories · 3 Billboard and 8 Boost slots per category per corridor ·
          waitlists are real: see them in the{" "}
          <Link href="/admin/slots" className="font-medium text-ink-600 underline decoration-ink-200 underline-offset-2">
            ops console
          </Link>
          .
        </p>
      </section>

      <section className="container pb-12">
        <div className="grid gap-6 rounded-3xl bg-ink-900 p-7 text-white lg:grid-cols-[1fr_1.15fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E0A526]">
              <TrendingUp className="h-3.5 w-3.5" /> The alternatives, priced honestly
            </div>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.015em]">
              What GH₵99 replaces
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              A website starts at GH₵10,000 from a published Accra agency rate card, with
              GH₵500–750/month maintenance. It is a brochure. Seen is the demand.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#E0A526] px-4 text-[13px] font-semibold text-ink-950 hover:bg-[#EBB53F]"
            >
              Claim your free listing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {[
              ["Agency website + maintenance", "GH₵10,000 + GH₵500–750/mo", "No demand, no attribution"],
              ["Instagram boost of GH₵300", "GH₵300/spike", "Reach without local intent"],
              ["Google Maps listing", "Free", "No control, no reporting, often stale"],
              ["Seen Boost", "GH₵99/mo", "Ranked placement + measured footfall"],
              ["Seen Billboard", "GH₵249/mo", "Top of corridor + 360° tour + monthly call"],
            ].map(([name, cost, note], index) => (
              <div
                key={name}
                className={
                  index >= 3
                    ? "grid grid-cols-[1.1fr_0.9fr_1.2fr] gap-2 border-t border-white/10 bg-white/[0.06] px-4 py-3 text-[12px]"
                    : "grid grid-cols-[1.1fr_0.9fr_1.2fr] gap-2 border-t border-white/10 px-4 py-3 text-[12px]"
                }
              >
                <span className={index >= 3 ? "font-semibold text-white" : "text-white/70"}>{name}</span>
                <span className="metric text-white/80">{cost}</span>
                <span className="text-white/50">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">Questions merchants ask</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            [
              "Is the free listing really free?",
              "Yes. Starter never expires and includes your verified listing, GhanaPostGPS address, three photos, hours and directions. Paid placement changes rank — nothing else.",
            ],
            [
              "What if I do not get customers?",
              "You see the same dashboard we do. If a Boost or Billboard cannot show enough direction requests and QR redemptions to justify the price, we will tell you and cancel it. Revenue we cannot defend is churn we have bought.",
            ],
            [
              "How do I pay?",
              "Paystack mobile money: MTN MoMo, Telecel Cash or AT Money. Cards work too. Billing is monthly, cancel any time; founding merchants keep their 2026 price for 24 months.",
            ],
            [
              "Who else is in my category?",
              "Three Billboard slots and eight Boost slots per category per corridor, first come. The availability table above is live.",
            ],
            [
              "Do you guarantee placement?",
              "Paid placement is guaranteed while your subscription is active. Ranking inside a tier uses quality score — rating, reviews, photos, 360° and verification — so a poorly reviewed merchant can sit below a better free listing.",
            ],
            [
              "What about my GhanaPostGPS address?",
              "A Seen rep verifies the digital address on site. Customers get the code and a pin that opens Google Maps — the pin is what stops the direction calls.",
            ],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-ink-100 bg-white p-5">
              <div className="text-[14px] font-semibold text-ink-900">{question}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
