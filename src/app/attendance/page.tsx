import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import AttendanceDashboard from "./components/attendance-calendar";
import { DashboardSkeleton } from "@/components/ui/layout/page-skeleton";

type Props = { searchParams: Promise<{ period?: string }> };

async function AttendanceContent({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  if (!session) redirect("/");
  return <AttendanceDashboard period={params.period} />;
}

export default async function AttendancePage(props: Props) {
  await connection();
  return <Suspense fallback={<DashboardSkeleton />}><AttendanceContent {...props} /></Suspense>;
}
