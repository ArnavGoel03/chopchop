/**
 * Root admin layout — intentionally a pass-through with NO auth guard.
 *
 * Auth guarding lives in app/admin/(auth)/layout.tsx so that
 * app/admin/login/page.tsx is reachable without a session (no redirect loop).
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
