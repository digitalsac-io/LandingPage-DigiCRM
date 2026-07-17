import { requireAdminPage } from "./requireAdminPage";
import { AdminPanels } from "./AdminPanels";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await requireAdminPage();
  return <AdminPanels userEmail={user.email} />;
}
