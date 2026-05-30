"use client";

import { useState } from "react";
import type { OrderStatus } from "@/lib/types";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "cod_confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function label(s: OrderStatus): string {
  return s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusSelect({
  code,
  current,
}: {
  code: string;
  current: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(next: OrderStatus) {
    setStatus(next);
    setSaved(false);
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d.error as string | undefined) || "Failed to update.");
        setStatus(current); // rollback
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Network error.");
      setStatus(current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        disabled={saving}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-tomato/50 disabled:opacity-60 cursor-pointer"
        aria-label="Order status"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-xs text-ink-soft animate-pulse">Saving…</span>
      )}
      {saved && (
        <span className="text-xs text-mint font-semibold">Saved</span>
      )}
      {error && (
        <span className="text-xs text-tomato font-medium" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
