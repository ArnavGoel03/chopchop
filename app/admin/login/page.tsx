"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 429
            ? "Too many attempts — wait a few minutes and try again."
            : (data.error as string | undefined) || "Incorrect password.",
        );
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* wordmark */}
        <h1 className="font-display text-3xl font-bold text-ink text-center mb-1">
          CHOP.
        </h1>
        <p className="text-ink-soft text-sm text-center mb-8">Admin dashboard</p>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-2 border border-line rounded-2xl p-8 shadow-sm"
        >
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-tomato/50 disabled:opacity-60 text-sm"
            placeholder="Enter admin password"
          />

          {error && (
            <p className="mt-3 text-xs text-tomato font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-full bg-tomato text-white font-semibold py-3 text-sm hover:bg-tomato/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
