"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logout: true }),
    });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <header className="sticky top-0 z-10 border-b border-line bg-paper-2/80 backdrop-blur-sm">
        <Container>
          <div className="flex items-center justify-between h-14">
            <Link
              href="/admin"
              className="font-display font-bold text-xl text-ink tracking-tight"
            >
              CHOP. <span className="text-ink-soft font-sans font-normal text-sm ml-1">Admin</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-ink-soft hover:text-tomato transition-colors"
            >
              Sign out
            </button>
          </div>
        </Container>
      </header>

      <main className="py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
