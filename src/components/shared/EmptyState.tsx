import React from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon = Info, title, description, actionText, onAction }: EmptyStateProps) {
  const { isDark } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-6 text-center rounded-2xl border transition-colors ${
      isDark 
        ? 'bg-slate-900/70 border-slate-800 text-white shadow-inner' 
        : 'bg-slate-50 border-slate-200 text-navy'
    }`}>
      <div className={`p-3.5 rounded-full mb-3.5 border shadow-sm ${
        isDark 
          ? 'bg-slate-800 border-slate-700 text-red-400' 
          : 'bg-red/10 border-red/20 text-red'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={`text-sm font-black uppercase tracking-wider mb-1.5 font-brand-header ${
        isDark ? 'text-white' : 'text-navy'
      }`}>
        {title}
      </h3>
      <p className={`text-xs max-w-md leading-relaxed font-medium ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
