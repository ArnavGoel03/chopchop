"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "../types";

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (productSlug: string, variantId: string) => void;
  setQty: (productSlug: string, variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
}

const sameLine = (a: CartLine, b: Pick<CartLine, "productSlug" | "variantId">) =>
  a.productSlug === b.productSlug && a.variantId === b.variantId;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => sameLine(l, line));
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                sameLine(l, line)
                  ? { ...l, qty: Math.min(99, l.qty + line.qty) }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty: Math.min(99, line.qty) }] };
        }),
      remove: (productSlug, variantId) =>
        set((s) => ({
          lines: s.lines.filter((l) => !sameLine(l, { productSlug, variantId })),
        })),
      setQty: (productSlug, variantId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) =>
              sameLine(l, { productSlug, variantId })
                ? { ...l, qty: Math.max(0, Math.min(99, qty)) }
                : l,
            )
            .filter((l) => l.qty > 0),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    { name: "chop-cart-v2" },
  ),
);
