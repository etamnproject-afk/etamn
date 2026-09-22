import React, { useState, useRef } from 'react';
import { Send, Loader2, Search } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onQuickAction: (action: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onQuickAction,
  inputRef: externalRef
}) => {
  const [inputText, setInputText] = useState('');
  const internalRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalRef || internalRef;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 sticky bottom-0 z-20 shadow-lg">
      <div className="max-w-3xl mx-auto">
        {/* Quick action chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => onQuickAction('🔎 الاستعلام عن رقم تاني')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shrink-0 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-teal-600" />
            <span>رقم مستشفى جديد</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('10110226008789')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 shrink-0 transition-colors cursor-pointer"
          >
            <span>تجربة رقم: 10110226008789</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('22/2188')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 shrink-0 transition-colors cursor-pointer"
          >
            <span>تجربة رقم: 22/2188</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <input
              ref={activeInputRef as any}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رقم المستشفى هنا... (مثال: 10110226008789 أو 22/2188)"
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100 rounded-xl px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl px-5 py-3 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 rotate-180" />
                <span className="hidden sm:inline">إرسال</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-2">
          اطمن يعرض الحالة المسجلة لعلاجك من سجلات المستشفى دون تخمين أو تقديم استشارات طبية.
        </p>
      </div>
    </div>
  );
};
