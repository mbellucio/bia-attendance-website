import { connection } from "next/server";
import { ChatBubbleLeftRightIcon, UsersIcon } from "@heroicons/react/24/outline";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { AdminOptionCard } from "@/components/ui/layout/admin-option-card";
import { PageHeading } from "@/components/ui/layout/page-heading";

export default async function AdminPanelPage() {
  await connection();
  await requireAdminPage();

  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="admin" isAdmin /></SiteHeader>
    <section className="py-7 sm:py-9">
      <PageHeading eyebrow="Administration" title="Admin Panel" description="Choose an administration area." className="mb-0" />
    </section>
    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Administration options">
      <AdminOptionCard href="/admin-panel/discord-roles" label="Discord" title="Discord roles" description="Synchronize and review the server role catalog." icon={<ChatBubbleLeftRightIcon className="size-7" />} />
      <AdminOptionCard href="/admin-panel/manage-users" label="Administration" title="Manage Users" description="Review accounts and synchronize their Discord roles." icon={<UsersIcon className="size-7" />} />
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}
