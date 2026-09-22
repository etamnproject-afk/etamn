import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, TreatmentStatusInfo, LookupResponse } from './types';
import { Header } from './components/Header';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ChatInput } from './components/ChatInput';
import { EmergencyModal, InfoModal } from './components/Modals';
import { initAuth, googleSignIn, logout, getAccessToken } from './firebase';
import { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `أهلًا بيك في اطمن 🌷
أنا هنا عشان أساعدك تعرف حالة علاجك بسهولة.
ممكن تكتبلي رقم المستشفى عشان أراجع لحضرتك آخر تحديث؟`,
      timestamp: new Date(),
      suggestions: ['10452', 'ما هو دور تطبيق اطمن؟', 'تعليمات الطوارئ']
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [pendingHospitalNumber, setPendingHospitalNumber] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check connection to sheet
  const checkConnection = async (token?: string) => {
    setIsCheckingConnection(true);
    try {
      const headers: Record<string, string> = {};
      const activeToken = token || getAccessToken();
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      const res = await fetch('/api/connection-status', { headers });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setIsConnected(!!data.connected);
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Setup auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        checkConnection(token);
      },
      () => {
        setCurrentUser(null);
        checkConnection();
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        await checkConnection(result.accessToken);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'system',
            text: `تم تسجيل الدخول وربط سجلات المستشفى بحساب: ${result.user.displayName || result.user.email} ✓`,
            timestamp: new Date()
          }
        ]);

        if (pendingHospitalNumber) {
          const numToSearch = pendingHospitalNumber;
          setPendingHospitalNumber(null);
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now() + 1),
              sender: 'assistant',
              text: `أهلًا بحضرتك 🌷\nجاري الآن الاستعلام عن رقم المستشفى (${numToSearch})...`,
              timestamp: new Date()
            }
          ]);
          await performLookup(numToSearch);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now() + 1),
              sender: 'assistant',
              text: `أهلًا بحضرتك 🌷\nأنا جاهز لمراجعة السجلات؛ اكتبلي رقم المستشفى وسأراجع لك آخر حالة مسجلة مباشرة.`,
              timestamp: new Date()
            }
          ]);
          inputRef.current?.focus();
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          isError: true,
          text: `لم نتمكن من إتمام تسجيل الدخول (${err.message || 'خطأ غير معروف'}). يمكنك إعادة المحاولة متى شئت. 🌷`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'system',
          text: 'تم تسجيل الخروج.',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Perform the treatment status check from Google Sheet
  const performLookup = async (hospitalNumber: string) => {
    setIsLoading(true);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/check-status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ hospitalNumber })
      });

      const contentType = res.headers.get('content-type');
      let data: LookupResponse;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = {
          success: false,
          found: false,
          error: 'AUTH_REQUIRED',
          message: 'سجلات المستشفى محمية وتتطلب تسجيل الدخول بحساب Google المعتمد للوصول إلى السجلات.'
        };
      }

      if (data.error === 'AUTH_REQUIRED') {
        setPendingHospitalNumber(hospitalNumber);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: `سجلات المستشفى محمية وتتطلب تصريح وصول من حساب Google. 
من فضلك اضغط على زر **"ربط السجلات"** بالأعلى أو الزر بالأسفل لتسجيل الدخول والاطلاع على حالة علاجك فورًا. 🌷`,
            timestamp: new Date(),
            suggestions: ['🔑 تسجيل الدخول وربط السجلات', '🔎 الاستعلام عن رقم تاني']
          }
        ]);
        return;
      }

      if (data.found && data.patientName && data.statusPriority) {
        setPendingHospitalNumber(null);
        const statusInfo: TreatmentStatusInfo = {
          priority: data.statusPriority,
          statusTitle: data.statusTitle || '',
          badgeColor: data.statusBadgeColor || 'slate',
          patientName: data.patientName,
          hospitalNumber: data.hospitalNumber || hospitalNumber
        };

        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: data.message,
            timestamp: new Date(),
            statusInfo,
            suggestions: ['🔎 الاستعلام عن رقم تاني', '❌ إنهاء المحادثة']
          }
        ]);
      } else {
        // Not found, duplicate, or insufficient data
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: data.message,
            timestamp: new Date(),
            suggestions: ['🔎 الاستعلام عن رقم تاني']
          }
        ]);
      }
    } catch (err: any) {
      console.error('Lookup fetch error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          isError: true,
          text: `واجهنا صعوبة مؤقتة في الوصول إلى بيانات المستشفى. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى. 🌷`,
          timestamp: new Date(),
          suggestions: ['🔎 الاستعلام عن رقم تاني']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Main chat message dispatcher
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);

    // Handle Quick Action: Login request
    if (trimmed.includes('تسجيل الدخول وربط السجلات')) {
      handleLogin();
      return;
    }

    // Handle Quick Action: Info or Emergency
    if (trimmed.includes('ما هو دور تطبيق اطمن') || trimmed.includes('عن تطبيق اطمن')) {
      setIsInfoOpen(true);
      return;
    }
    if (trimmed.includes('تعليمات الطوارئ') || trimmed.includes('طوارئ طبية')) {
      setIsEmergencyOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      // Analyze chat intent (emergency, medical advice, new search, or number)
      const intentRes = await fetch('/api/chat-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: trimmed })
      });
      const intentData = await intentRes.json();

      if (intentData.type === 'EMERGENCY') {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            isError: true,
            text: intentData.message,
            timestamp: new Date(),
            suggestions: ['🚨 عرض تعليمات الطوارئ', '🔎 الاستعلام عن رقم تاني']
          }
        ]);
        return;
      }

      if (intentData.type === 'MEDICAL_QUESTION') {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: intentData.message,
            timestamp: new Date(),
            suggestions: ['🔎 الاستعلام عن رقم تاني']
          }
        ]);
        return;
      }

      if (intentData.type === 'SEARCH_ANOTHER') {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: intentData.message,
            timestamp: new Date()
          }
        ]);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }

      if (intentData.type === 'END_CONVERSATION') {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: intentData.message,
            timestamp: new Date(),
            suggestions: ['🔎 الاستعلام عن رقم تاني']
          }
        ]);
        return;
      }

      if (intentData.type === 'HOSPITAL_NUMBER' && intentData.hospitalNumber) {
        // Run lookup
        await performLookup(intentData.hospitalNumber);
        return;
      }

      // Default conversational reply
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: intentData.message,
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Chat intent error:', err);
      // Fallback to checking if text contains digits
      const digitsMatch = trimmed.match(/\d+/);
      if (digitsMatch) {
        await performLookup(digitsMatch[0]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            text: `أنا هنا لمساعدتك في معرفة حالة علاجك 🌷\nممكن تكتبلي رقم المستشفى المكون من أرقام لمراجعة بياناتك؟`,
            timestamp: new Date()
          }
        ]);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === '🔎 الاستعلام عن رقم تاني') {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'user',
          text: '🔎 الاستعلام عن رقم تاني',
          timestamp: new Date()
        },
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `طبعًا 🌷
اكتبلي رقم المستشفى الجديد وأنا أراجع لحضرتك حالته.`,
          timestamp: new Date()
        }
      ]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return;
    }

    if (suggestion === '❌ إنهاء المحادثة') {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'user',
          text: '❌ إنهاء المحادثة',
          timestamp: new Date()
        },
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `مع السلامة يا فندم. أتمنى لك الشفاء العاجل ودوام الصحة والعافية. أنا هنا دائمًا في أي وقت تحتاج فيه للاطمئنان على علاجك. 🌷`,
          timestamp: new Date(),
          suggestions: ['🔎 الاستعلام عن رقم تاني']
        }
      ]);
      return;
    }

    if (suggestion === 'تسجيل الدخول وربط السجلات' || suggestion === '🔑 تسجيل الدخول وربط السجلات' || suggestion.includes('تسجيل الدخول')) {
      handleLogin();
      return;
    }

    if (suggestion === '🚨 عرض تعليمات الطوارئ' || suggestion === 'تعليمات الطوارئ') {
      setIsEmergencyOpen(true);
      return;
    }

    if (suggestion === 'ما هو دور تطبيق اطمن؟') {
      setIsInfoOpen(true);
      return;
    }

    // Otherwise send as user message
    handleSendMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Tajawal'] text-slate-900" dir="rtl">
      {/* Top Header */}
      <Header
        isConnected={isConnected}
        isCheckingConnection={isCheckingConnection}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />

      {/* Main Chat Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col justify-between">
        <div className="flex-1 space-y-1">
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}

          {/* Chat Loading State */}
          {isLoading && (
            <div className="flex gap-3 my-4 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <span className="text-base select-none">🌷</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-slate-700 text-sm flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                <span>جاري مراجعة سجلات المستشفى للتأكد من آخر تحديث... 🌷</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Bottom Input Area */}
      <ChatInput
        inputRef={inputRef}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onQuickAction={handleSuggestionClick}
      />

      {/* Modals */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
