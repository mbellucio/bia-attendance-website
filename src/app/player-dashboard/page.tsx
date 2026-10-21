import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { UserDashboardSkeleton } from "@/components/ui/layout/page-skeleton";
import UserDashboard from "./components/dashboard";

async function DashboardContent() {
  const session = await getSteamSession();
  if (!session) redirect("/");
  return <UserDashboard />;
}

export default async function PlayerDashboardPage() {
  await connection();
  return <Suspense fallback={<UserDashboardSkeleton />}><DashboardContent /></Suspense>;
}
