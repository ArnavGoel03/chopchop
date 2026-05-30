export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AdminLoginForm from "./LoginForm";

/** If already authenticated, skip the login form entirely. */
export default async function AdminLoginPage() {
  const authed = await isAuthed();
  if (authed) redirect("/admin");

  return <AdminLoginForm />;
}
