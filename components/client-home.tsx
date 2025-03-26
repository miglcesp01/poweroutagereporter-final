"use client";

import dynamic from "next/dynamic";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { OutageReport } from "@/components/outage-reporter";

const OutageReporter = dynamic(() => import("@/components/outage-reporter"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-muted flex items-center justify-center">Loading map...</div>,
});

const OutageList = dynamic(() => import("@/components/outage-list"), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-muted flex items-center justify-center">Loading reports...</div>,
});

export default function ClientHome() {
  const [reports, setReports] = useLocalStorage<OutageReport[]>("outage-reports", []);

  return (
    <main className="container mx-auto px-4 py-8 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Report a Power Outage</h2>
          <OutageReporter reports={reports} setReports={setReports} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Outage Reports</h2>
          <OutageList reports={reports} setReports={setReports}/>
        </div>
      </div>
    </main>
  );
}