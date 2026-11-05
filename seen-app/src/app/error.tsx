"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const databaseNotConfigured = error.message.includes(
    "The local JSON store is demo-only",
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#FBFAF7] px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-ink-100 bg-white p-7 shadow-card">
        <AlertTriangle className="h-7 w-7 text-sun-600" aria-hidden />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          Seen · Service status
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900">
          {databaseNotConfigured ? "Live data isn’t connected yet" : "This page hit a problem"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          {databaseNotConfigured
            ? "This deployment is configured to avoid showing fictional preview data, but its production database adapter is not connected yet. No business or customer data was changed."
            : "The page couldn’t load. Please try again; if the issue continues, contact the Seen team."}
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-ink-400">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
          >
            <RotateCw className="h-3.5 w-3.5" /> Try again
          </button>
          <Link
            href="/signin"
            className="inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
