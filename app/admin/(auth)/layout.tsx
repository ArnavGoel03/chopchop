export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { AdminChrome } from "@/components/admin/AdminChrome";

export const metadata = { title: "Admin · CHOP." };

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  if (!authed) redirect("/admin/login");

  return <AdminChrome>{children}</AdminChrome>;
}
