import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import AttendanceDashboard from "./attendance-calendar";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

type Props = { searchParams: Promise<{ period?: string }> };

async function AttendanceContent({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  if (!session) redirect("/");
  return <AttendanceDashboard period={params.period} />;
}

export default function AttendancePage(props: Props) {
  return <Suspense fallback={<DashboardSkeleton />}><AttendanceContent {...props} /></Suspense>;
}
