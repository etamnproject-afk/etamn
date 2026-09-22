import React from 'react';
import { TreatmentStatusInfo } from '../types';
import { Clock, CheckCircle2, PackageCheck, AlertCircle, Building } from 'lucide-react';

interface StatusCardProps {
  info: TreatmentStatusInfo;
}

export const StatusCard: React.FC<StatusCardProps> = ({ info }) => {
  const getBadgeConfig = () => {
    switch (info.priority) {
      case 1:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          badge: 'bg-blue-600 text-white',
          icon: <Building className="w-5 h-5 text-blue-600" />,
          label: 'موجود في الـDay Care',
          dotColor: 'bg-blue-500'
        };
      case 2:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          icon: <PackageCheck className="w-5 h-5 text-emerald-600" />,
          label: 'جاري التوصيل للـDay Care',
          dotColor: 'bg-emerald-500'
        };
      case 3:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-600 text-white',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          label: 'جاري التحضير',
          dotColor: 'bg-amber-500'
        };
      case 4:
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-900',
          badge: 'bg-orange-600 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-orange-600" />,
          label: 'في مرحلة الصرف',
          dotColor: 'bg-orange-500'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          badge: 'bg-slate-600 text-white',
          icon: <AlertCircle className="w-5 h-5 text-slate-600" />,
          label: 'تحديث قيد المراجعة',
          dotColor: 'bg-slate-400'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`mt-3 p-4 rounded-xl border ${config.bg} transition-all shadow-xs`}>
      <div className="flex items-center justify-between gap-3 mb-2 border-b border-black/5 pb-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-bold text-sm text-slate-800">بطاقة المتابعة</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${config.badge}`}>
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div>
          <span className="text-slate-500 block mb-0.5">اسم المريض</span>
          <span className="font-bold text-slate-800 text-sm truncate block">{info.patientName}</span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">رقم المستشفى</span>
          <span className="font-mono font-bold text-slate-800 text-sm block" dir="ltr">{info.hospitalNumber}</span>
        </div>
      </div>
    </div>
  );
};
