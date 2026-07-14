import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loader({ message = 'Loading services...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <RefreshCw className="w-8 h-8 text-red animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 font-mono tracking-wide uppercase">{message}</p>
    </div>
  );
}
