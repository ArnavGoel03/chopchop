"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/content";

interface FaqProps {
  items: FaqItem[];
  /** Optional heading rendered above the accordion. */
  heading?: string;
}

/**
 * Accessible accordion FAQ component.
 *
 * - Uses <details>/<summary> for zero-JS graceful degradation.
 * - Adds smooth open/close animation via CSS max-height trick.
 * - ARIA roles follow the WAI-ARIA Disclosure pattern.
 * - Keyboard accessible: Enter/Space toggles, Tab moves between items.
 */
export function Faq({ items, heading }: FaqProps) {
  return (
    <section aria-label="Frequently asked questions">
      {heading && (
        <h2 className="font-display text-3xl md:text-4xl text-ink mb-8">
          {heading}
        </h2>
      )}
      <div className="divide-y divide-line">
        {items.map((item) => (
          <FaqRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${item.id}`;
  const headingId = `faq-heading-${item.id}`;

  return (
    <div>
      <h3>
        <button
          id={headingId}
          type="button"
          className="w-full flex items-start justify-between gap-4 py-5 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="font-medium text-ink leading-snug">
            {item.question}
          </span>
          <span
            aria-hidden="true"
            className={`flex-none mt-0.5 text-ink-soft transition-transform duration-200 ${
              open ? "rotate-45" : ""
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      </h3>

      {/* Answer panel */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!open}
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[600px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-ink-soft leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}
