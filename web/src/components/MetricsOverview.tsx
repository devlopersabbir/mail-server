import React from 'react';
import { Metrics } from '../types';
import { Activity, Send, AlertTriangle, Layers, Eye, Percent } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: Metrics | null;
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, loading }) => {
  const cards = [
    {
      title: 'Total Enqueued',
      value: (metrics?.enqueued_total ?? 0).toLocaleString(),
      icon: Layers,
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'Successfully Sent',
      value: (metrics?.sent_total ?? 0).toLocaleString(),
      icon: Send,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Dispatch Failures',
      value: (metrics?.failed_total ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-amber-500/20 border-rose-500/30 text-rose-400',
    },
    {
      title: 'Opened Emails',
      value: (metrics?.opened_total ?? 0).toLocaleString(),
      icon: Eye,
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Real Open Rate',
      value: `${(metrics?.open_rate_percent ?? 0).toFixed(1)}%`,
      icon: Percent,
      color: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 border bg-gradient-to-br ${card.color} transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {loading ? <span className="animate-pulse text-slate-600">...</span> : card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
