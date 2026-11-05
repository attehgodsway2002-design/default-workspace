import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#FBFAF7] px-6">
      <div className="max-w-md text-center">
        <div className="kente-strip mx-auto h-1.5 w-24 rounded-full" />
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.2em] text-ink-400">
          404 · off the corridor
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-ink-900">
          This listing is not on Seen
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
          We only publish businesses a Seen rep has visited and verified. The address you followed
          may have been removed, renamed, or never verified in the first place.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/discover"
            className="inline-flex h-10 items-center rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
          >
            Browse Osu &amp; East Legon
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:border-ink-300"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
