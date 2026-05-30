"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Region } from "@/lib/types";
import { CATEGORIES } from "@/lib/catalog";
import { RegionSwitcher } from "./RegionSwitcher";

interface MobileNavProps {
  region: Region;
}

export function MobileNav({ region }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const base = `/${region.segment}`;

  const navLinks = [
    { href: `${base}/shop`, label: "Shop all" },
    ...CATEGORIES.map((cat) => ({
      href: `${base}/shop/${cat.id}`,
      label: cat.label,
    })),
    { href: `${base}/track`, label: "Track order" },
    { href: `${base}/returns`, label: "Returns" },
  ];

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Focus management: move focus into panel on open, restore on close
  useEffect(() => {
    if (open) {
      // Small delay to let the panel animate in before stealing focus
      const t = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 60);
      return () => clearTimeout(t);
    } else {
      buttonRef.current?.focus();
    }
  }, [open]);

  // Lock body scroll while panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Focus trap: keep Tab/Shift+Tab within the panel
  function handlePanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const panel = e.currentTarget;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        ref={buttonRef}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="md:hidden grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2 transition-colors"
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>

      {/* Backdrop + slide-in panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-ink/40 animate-fadeIn"
          />

          {/* Panel */}
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onKeyDown={handlePanelKeyDown}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(320px,85vw)] flex-col bg-paper shadow-xl animate-slideInRight"
          >
            {/* Panel header */}
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="inline-block h-2 w-2 rotate-45 rounded-[2px] bg-tomato mr-1.5" />
                CHOP.
              </span>
              <button
                ref={closeButtonRef}
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2 transition-colors"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Nav links */}
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-4">
              <ul className="flex flex-col">
                {navLinks.map((link, i) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-[44px] items-center px-5 text-[15px] transition-colors hover:bg-paper-2 hover:text-tomato ${
                        i === 0
                          ? "font-semibold text-ink"
                          : "text-ink-soft"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Region switcher pinned to bottom */}
            <div className="border-t border-line px-5 py-5">
              <p className="mb-2.5 text-xs font-medium uppercase tracking-widest text-ink-soft">
                Region
              </p>
              <RegionSwitcher />
            </div>
          </div>
        </>
      )}
    </>
  );
}
