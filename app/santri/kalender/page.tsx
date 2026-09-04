import type { Metadata } from "next";
import { CalendarContent } from "@/components/pages/calendar-content";

export const metadata: Metadata = { title: "Kalender akademik" };

export default function KalenderPage() {
  return <CalendarContent />;
}
