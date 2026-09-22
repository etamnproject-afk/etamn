import React from 'react';
import { HeartPulse } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 shadow-xs">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm shadow-teal-500/20 shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                اطمن 🌷
              </h1>
              <span className="text-[11px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60">
                مرضى الأورام
              </span>
            </div>
            <p className="text-xs text-slate-500">
              معرفة حالة علاجك بسهولة ووضوح
            </p>
          </div>
        </div>

        {/* Live connected status */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>متصل بالسجلات</span>
        </div>
      </div>
    </header>
  );
};
