import React from 'react';
import { ChatMessage } from '../types';
import { StatusCard } from './StatusCard';
import ReactMarkdown from 'react-markdown';
import { Bot, User as UserIcon } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onSuggestionClick
}) => {
  const isAssistant = message.sender === 'assistant';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-slate-100 text-slate-600 text-xs px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <span className="text-base select-none">🌷</span>
        </div>
      )}

      {/* Message Bubble Body */}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isAssistant ? 'order-2' : 'order-1'}`}>
        <div
          className={`p-4 rounded-2xl text-sm sm:text-base leading-relaxed ${
            isAssistant
              ? message.isError
                ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tr-xs'
                : 'bg-white text-slate-800 border border-slate-200/90 shadow-xs rounded-tr-xs'
              : 'bg-teal-600 text-white shadow-xs rounded-tl-xs'
          }`}
        >
          {/* Content with Markdown */}
          <div className="space-y-2 whitespace-pre-line font-['Tajawal']">
            <ReactMarkdown
              components={{
                strong: ({ node, ...props }) => (
                  <strong className={isAssistant ? 'font-bold text-slate-900' : 'font-bold text-white'} {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Optional Status Card */}
          {message.statusInfo && (
            <StatusCard info={message.statusInfo} />
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {message.suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{sug}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[11px] text-slate-400 mt-1 px-1 flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          {new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric', hour12: true }).format(message.timestamp)}
        </div>
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 order-2 mt-1 shadow-2xs">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
