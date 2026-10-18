import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { UserDashboardSkeleton } from "@/components/ui/page-skeleton";
import UserDashboard from "./dashboard";

async function DashboardContent() {
  const session = await getSteamSession();
  if (!session) redirect("/");
  return <UserDashboard />;
}

export default function PlayerDashboardPage() {
  return <Suspense fallback={<UserDashboardSkeleton />}><DashboardContent /></Suspense>;
}
