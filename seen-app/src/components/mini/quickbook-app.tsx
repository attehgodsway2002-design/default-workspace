"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cedis, longDate, timeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00"];
const DAY_MS = 86_400_000;

export interface QuickBookService {
  name: string;
  priceCedis: number;
}

export interface QuickBookMerchant {
  id: string;
  name: string;
  corridor: string;
  categoryName: string;
  rating: number;
  ghanapost: string;
  landmark: string;
  services: QuickBookService[];
}

export interface PriorBooking {
  reference: string;
  service: string;
  priceCedis: number;
  startsAt: string;
  merchantName: string;
}

export interface QuickBookBooking {
  id: string;
  reference: string;
  service: string;
  priceCedis: number;
  startsAt: string;
  status: string;
}

interface Take {
  bps: number;
  cedis: number;
}

interface Confirmation {
  booking: QuickBookBooking;
  merchant: QuickBookMerchant;
  take: Take;
}

interface DaySlots {
  key: string;
  label: string;
  slots: { value: string; label: string }[];
}

function buildSchedule(nowIso: string): DaySlots[] {
  const base = Date.parse(nowIso);
  const cutoff = base + 30 * 60_000;
  const days: DaySlots[] = [];
  for (let offset = 0; offset < 5; offset += 1) {
    const date = new Date(base + offset * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    const slots = TIMES.filter((time) => Date.parse(`${key}T${time}:00.000Z`) > cutoff).map(
      (time) => ({ value: time, label: time }),
    );
    if (slots.length > 0) days.push({ key, label, slots });
  }
  return days;
}

function calendarDataUri(booking: QuickBookBooking, merchant: QuickBookMerchant): string {
  const start = new Date(booking.startsAt);
  const end = new Date(start.getTime() + 45 * 60_000);
  const stamp = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escape = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/[,;]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Seen//QuickBook//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@seen.gh`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${booking.service} at ${merchant.name}`)}`,
    `LOCATION:${escape(`${merchant.landmark}, ${merchant.corridor}, Accra — ${merchant.ghanapost}`)}`,
    `DESCRIPTION:${escape(
      `Booked with QuickBook on Seen. Reference ${booking.reference}. Payment is collected by the partner at the appointment.`,
    )}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export function QuickBookApp({
  appSlug,
  merchants,
  previousBookings,
  nowIso,
}: {
  appSlug: string;
  merchants: QuickBookMerchant[];
  previousBookings: PriorBooking[];
  nowIso: string;
}) {
  const schedule = React.useMemo(() => buildSchedule(nowIso), [nowIso]);
  const router = useRouter();
  const [merchantId, setMerchantId] = React.useState(merchants[0]?.id ?? "");
  const [serviceName, setServiceName] = React.useState(merchants[0]?.services[0]?.name ?? "");
  const [dayKey, setDayKey] = React.useState(schedule[0]?.key ?? "");
  const [time, setTime] = React.useState(schedule[0]?.slots[0]?.value ?? "09:00");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);

  const merchant = merchants.find((item) => item.id === merchantId) ?? merchants[0];
  const services = merchant?.services ?? [];
  const service = services.find((item) => item.name === serviceName) ?? services[0];
  const activeDay = schedule.find((day) => day.key === dayKey) ?? schedule[0];

  function chooseMerchant(nextId: string) {
    setMerchantId(nextId);
    const next = merchants.find((item) => item.id === nextId);
    setServiceName(next?.services[0]?.name ?? "");
  }

  function chooseDay(key: string) {
    setDayKey(key);
    const nextDay = schedule.find((day) => day.key === key);
    if (nextDay) setTime(nextDay.slots[0]?.value ?? time);
  }

  async function confirm() {
    if (!merchant || !service) return;
    setBusy(true);
    setError(null);
    try {
      const startsAt = `${dayKey}T${time}:00.000Z`;
      const res = await fetch("/api/mini/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          miniAppSlug: appSlug,
          merchantId: merchant.id,
          service: service.name,
          priceCedis: service.priceCedis,
          startsAt,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        booking?: QuickBookBooking;
        take?: Take;
      };
      if (!res.ok || !data.ok || !data.booking || !data.take) {
        throw new Error(data.error ?? "The booking could not be completed.");
      }
      setConfirmation({ booking: data.booking, merchant, take: data.take });
      toast("Appointment confirmed", "success");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The booking could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    const { booking, merchant: bookedMerchant, take } = confirmation;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#D7EBDD] bg-[#F4FAF6] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#1E6B4F]" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink-900">Appointment confirmed</h2>
              <p className="mt-0.5 text-[13px] text-ink-500">
                {booking.service} at {bookedMerchant.name}
              </p>
              <div className="metric mt-2 inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 font-mono text-[12px] text-ink-800">
                {booking.reference}
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-2 border-t border-[#D7EBDD] pt-3 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-400">When</dt>
              <dd className="text-right font-medium text-ink-800">
                {longDate(booking.startsAt)} · {timeOfDay(booking.startsAt)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-400">Where</dt>
              <dd className="text-right font-medium text-ink-800">
                {bookedMerchant.landmark}, {bookedMerchant.corridor}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-400">GhanaPostGPS</dt>
              <dd className="metric text-right font-mono text-[12px] text-ink-700">
                {bookedMerchant.ghanapost}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-400">Price</dt>
              <dd className="metric text-right font-semibold text-ink-900">
                {cedis(booking.priceCedis)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-400">Payment</dt>
              <dd className="text-right text-ink-700">Pay {cedis(booking.priceCedis)} at the salon</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-[#D7EBDD] pt-2.5 text-[11px] leading-relaxed text-ink-400">
            QuickBook records the booking and Seen bills the partner its{" "}
            {(take.bps / 100).toFixed(2)}% take ({cedis(take.cedis)}) at month end. No card or wallet
            details are shared with the partner.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={calendarDataUri(booking, bookedMerchant)}
            download={`quickbook-${booking.reference}.ics`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-sm font-medium text-ink-900 hover:border-ink-300"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Add to calendar
          </a>
          <a
            href="#consent"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-50 text-sm font-medium text-ink-800 hover:bg-ink-100"
          >
            Manage consent
          </a>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmation(null)} className="w-full">
          Book another appointment
        </Button>

        {previousBookings.length > 0 && (
          <div className="border-t border-ink-50 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Your appointments with Seen partners
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {previousBookings.slice(0, 4).map((item) => (
                <li
                  key={item.reference}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="min-w-0 truncate text-ink-600">
                    {item.service} · {item.merchantName}
                  </span>
                  <span className="shrink-0 text-ink-400">
                    {longDate(item.startsAt)} · {cedis(item.priceCedis)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Book an appointment</h2>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
          Pick a partner, a service and a time. QuickBook writes the booking to Seen; you pay the
          partner when you arrive.
        </p>
      </div>

      <div>
        <Label htmlFor="qb-merchant">Where</Label>
        <Select
          id="qb-merchant"
          value={merchantId}
          onChange={(event) => chooseMerchant(event.target.value)}
        >
          {merchants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.corridor}
            </option>
          ))}
        </Select>
        {merchant && (
          <p className="mt-1 text-[11px] text-ink-400">
            {merchant.landmark} · {merchant.ghanapost} · {merchant.categoryName}
          </p>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-[12px] font-semibold text-ink-600">Service</span>
        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-3 text-[12px] text-ink-400">
            This partner has not published a service menu yet. Choose another place.
          </p>
        ) : (
          <div className="space-y-1.5">
            {services.map((item) => {
              const active = service?.name === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setServiceName(item.name)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-sun-400 bg-sun-50"
                      : "border-ink-100 bg-white hover:border-ink-200",
                  )}
                >
                  <span className="text-[13px] font-medium text-ink-800">{item.name}</span>
                  <span className="metric shrink-0 text-[13px] text-ink-600">
                    {cedis(item.priceCedis)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-[12px] font-semibold text-ink-600">When</span>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {schedule.map((day) => {
            const active = activeDay?.key === day.key;
            return (
              <button
                key={day.key}
                type="button"
                aria-pressed={active}
                onClick={() => chooseDay(day.key)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-100 bg-white text-ink-600 hover:border-ink-200",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(activeDay?.slots ?? []).map((slot) => {
            const active = time === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTime(slot.value)}
                className={cn(
                  "rounded-xl border py-2.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "border-sun-400 bg-sun-50 text-sun-700"
                    : "border-ink-100 bg-white text-ink-600 hover:border-ink-200",
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">
          Times are Accra local (GMT). Appointments run about 45 minutes.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-[#FBEAE5] px-3 py-2 text-[12px] font-medium text-[#A8442A]"
        >
          {error}
        </p>
      )}

      <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-3">
        <div className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-ink-500">{service?.name ?? "Choose a service"}</span>
          <span className="metric font-semibold text-ink-900">
            {service ? cedis(service.priceCedis) : "—"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">
          Pay {service ? cedis(service.priceCedis) : "the partner"} at the appointment — Seen never
          charges you in QuickBook.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={confirm}
        disabled={busy || !merchant || !service || !dayKey}
      >
        {busy ? "Confirming…" : `Confirm booking${service ? ` · ${cedis(service.priceCedis)}` : ""}`}
      </Button>

      <p className="text-[11px] leading-relaxed text-ink-400">
        Booking with <Badge tone="outline">QuickBook</Badge> writes an appointment against your Seen
        identity and shares your booking history with this partner only.
      </p>

      {previousBookings.length > 0 && (
        <div className="border-t border-ink-50 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Your appointments with Seen partners
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {previousBookings.slice(0, 4).map((item) => (
              <li key={item.reference} className="flex items-baseline justify-between gap-3 text-[12px]">
                <span className="min-w-0 truncate text-ink-600">
                  {item.service} · {item.merchantName}
                </span>
                <span className="shrink-0 text-ink-400">{longDate(item.startsAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
