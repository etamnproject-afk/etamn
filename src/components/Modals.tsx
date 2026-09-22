import React from 'react';
import { X, ShieldAlert, HeartHandshake, PhoneCall, Info, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-100 text-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-2 bg-rose-50 rounded-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">تعليمات الطوارئ والأعراض الحادة</h3>
            <span className="text-xs text-rose-500">سلامتك أولويتنا القصوى</span>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 mb-4 text-rose-950 text-sm leading-relaxed">
          <p className="font-semibold mb-2">
            لو عندك أعراض شديدة أو حالة طارئة، من فضلك اطلب المساعدة من فريق الرعاية فورًا أو توجّه لقسم الطوارئ في المستشفى دون انتظار.
          </p>
          <p className="text-xs text-rose-800">
            تطبيق <strong>اطمن</strong> يساعدك في معرفة حالة وتحديث العلاج المسجل، ولا يقوم بتقديم تشخيص طبي أو تقييم للأعراض السريرية. 🌷
          </p>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 mb-5">
          <div className="flex items-start gap-2">
            <PhoneCall className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>في حال التواجد بالمستشفى: نبه أقرب ممرض أو طبيب في الاستقبال أو صالة الانتظار.</span>
          </div>
          <div className="flex items-start gap-2">
            <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>طاقم التمريض والصيدلية في المستشفى مخصصون لدعمك ورعايتك على مدار الساعة.</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-sm"
        >
          فهمت ذلك، شكرًا
        </button>
      </div>
    </div>
  );
};

export const InfoModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 text-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-teal-700 mb-4">
          <div className="p-2 bg-teal-50 rounded-xl">
            <Info className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">عن تطبيق "اطمن 🌷"</h3>
            <span className="text-xs text-slate-500">رفيق مريض الأورام خلال مراحل العلاج</span>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            تطبيق <strong>اطمن</strong> صُمم خصيصًا ليمنحك الراحة والاطمئنان خلال فترة انتظار الجرعة، من خلال ربطك المباشر بآخر حالة مسجلة لعلاجك في سجلات المستشفى دون الحاجة للانتظار الطويل أو الاستفسار المتكرر.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-800 text-sm mb-2.5">مراحل رحلة العلاج الموثقة:</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <span><strong>مرحلة الصرف:</strong> مراجعة وتدقيق الملف في الصيدلية الإكلينيكية للتأكد من السلامة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span><strong>مرحلة التحضير:</strong> استلام إذن الصرف وبدء تحضير الجرعة وفق أعلى المعايير المعقمة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span><strong>التوصيل للـ Day Care:</strong> تم الانتهاء من التحضير والتشييك، وجاري توصيله للوحدة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>في الـ Day Care:</strong> العلاج متواجد في الوحدة وجاهز لتسليمه للممرض المسؤول.</span>
              </li>
            </ul>
          </div>

          <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3 text-xs text-teal-950">
            <strong>مبادئنا الأساسية:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 text-teal-900">
              <li>المعلومات مستقاة حصريًا من شيت سجلات المستشفى دون تخمين.</li>
              <li>الحفاظ الكامل على سرية وخصوصية بيانات المريض.</li>
              <li>الامتناع عن إعطاء استشارات طبية أو تشخيصات دوائية.</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-sm"
        >
          حسنًا، فهمت
        </button>
      </div>
    </div>
  );
};
