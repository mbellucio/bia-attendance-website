import { connection } from "next/server";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { Breadcrumbs } from "@/components/ui/navigation/breadcrumbs";
import { PageHeading } from "@/components/ui/layout/page-heading";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import ManageUsersPanel from "./panel";

export default async function ManageUsersPage() {
  await connection();
  await requireAdminPage();
  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="admin" isAdmin /></SiteHeader>
    <div className="pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Admin Panel", href: "/admin-panel" }, { label: "Manage Users" }]} />
      <PageHeading title="Manage Users" description="Review user roles and synchronize Discord memberships manually." />
    </div>
    <ManageUsersPanel />
    <SiteFooter variant="member" />
  </SiteShell>;
}
