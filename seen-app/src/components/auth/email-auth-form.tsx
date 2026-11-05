"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function EmailAuthForm({
  mode,
  nextPath,
  accountType = "consumer",
}: {
  mode: "signin" | "signup";
  nextPath: string;
  accountType?: "consumer" | "business";
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Email sign-in is not configured. Add the Supabase project URL and anon key.");
      setPending(false);
      return;
    }

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: isSignup,
        ...(isSignup ? { data: { account_type: accountType } } : {}),
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setMessage("Check your email for a secure sign-in link. You can close this page after opening it.");
    }
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-[12px] font-semibold text-ink-700">
            Email address
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border border-ink-200 px-3 text-[14px] text-ink-900 outline-none focus:border-sun-500 focus:ring-2 focus:ring-sun-100"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sun-500 px-4 text-[13px] font-semibold text-white hover:bg-sun-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {pending ? "Sending link…" : isSignup ? "Create account" : "Email me a sign-in link"}
        </button>
      </form>
      {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-[12px] text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-[12px] text-red-800">{error}</p>}
      <p className="mt-4 text-center text-[12px] text-ink-500">
        {isSignup ? "Already have an account?" : "New to Seen?"}{" "}
        <Link
          href={isSignup ? `/signin?next=${encodeURIComponent(nextPath)}` : `/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-ink-800 underline underline-offset-2"
        >
          {isSignup ? "Sign in" : "Create account"}
          <ArrowRight className="ml-1 inline h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
