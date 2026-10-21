import { connection } from "next/server";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/ui/navigation/breadcrumbs";
import { PageHeading } from "@/components/ui/layout/page-heading";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import DiscordRolesPanel from "../panel";

export default async function DiscordRolesPage() {
  await connection();
  await requireAdminPage();

  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="admin" isAdmin /></SiteHeader>
    <div className="pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Admin Panel", href: "/admin-panel" }, { label: "Discord roles" }]} />
      <PageHeading title="Discord roles" description="Synchronize the server roles into the staging catalog." />
    </div>
    <DiscordRolesPanel />
    <SiteFooter variant="member" />
  </SiteShell>;
}
