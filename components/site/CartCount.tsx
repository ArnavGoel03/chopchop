"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/store";

/** Hydration-safe cart count badge. */
export function CartCount() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || count === 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-tomato px-1 text-[11px] font-bold text-white">
      {count}
    </span>
  );
}
