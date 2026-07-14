import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isDestructive ? 'bg-red/10 text-red' : 'bg-navy/10 text-navy'}`}>
            {isDestructive ? <AlertCircle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs cursor-pointer ${
              isDestructive ? 'bg-red hover:bg-red/90' : 'bg-navy hover:bg-navy/95'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
