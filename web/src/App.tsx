import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { MetricsOverview } from "./components/MetricsOverview";
import { EmailComposer } from "./components/EmailComposer";
import { ConfigurationForm } from "./components/ConfigurationForm";
import { JobTracker } from "./components/JobTracker";
import { fetchHealth, fetchMetrics } from "./services/api";
import { Metrics } from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("composer");
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      await fetchHealth();
      setServerOnline(true);
      const metricsRes = await fetchMetrics();
      if (metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setMetricsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={serverOnline}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Realtime Metrics Banner */}
        <MetricsOverview metrics={metrics} loading={metricsLoading} />

        {/* Tab Content */}
        {activeTab === "composer" && <EmailComposer />}
        {activeTab === "config" && <ConfigurationForm />}
        {activeTab === "tracker" && <JobTracker />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        Mail Engine Pro &copy; {new Date().getFullYear()} &bull; Enterprise
        High-Scale Dispatcher &bull; Go Backend Engine + React Dashboard
      </footer>
    </div>
  );
}

export default App;
