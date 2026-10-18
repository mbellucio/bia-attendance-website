import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import PlayerDashboard from "@/app/player-dashboard";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

type AttendancePageProps = { searchParams: Promise<{ period?: string }> };

async function AttendanceContent({ searchParams }: AttendancePageProps) {
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  if (!session) redirect("/");
  return <PlayerDashboard steamId={session.steamId} period={params.period} />;
}

export default function AttendancePage(props: AttendancePageProps) {
  return <Suspense fallback={<DashboardSkeleton />}><AttendanceContent searchParams={props.searchParams} /></Suspense>;
}