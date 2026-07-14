import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({ icon: Icon = Info, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-slate-50/55 border border-slate-100 rounded-2xl">
      <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
