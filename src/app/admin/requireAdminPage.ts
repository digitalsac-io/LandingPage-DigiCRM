import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";

export async function requireAdminPage() {
  const store = await cookies();
  const user = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/admin/login");
  return user;
}
