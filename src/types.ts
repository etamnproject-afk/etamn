export type MessageSender = 'user' | 'assistant' | 'system';

export interface TreatmentStatusInfo {
  priority: 1 | 2 | 3 | 4 | 5;
  statusTitle: string;
  badgeColor: 'blue' | 'green' | 'amber' | 'orange' | 'slate';
  patientName: string;
  hospitalNumber: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
  statusInfo?: TreatmentStatusInfo;
  suggestions?: string[];
  isError?: boolean;
}

export interface LookupResponse {
  success: boolean;
  found: boolean;
  patientName?: string;
  hospitalNumber?: string;
  statusPriority?: 1 | 2 | 3 | 4 | 5;
  statusTitle?: string;
  statusBadgeColor?: 'blue' | 'green' | 'amber' | 'orange' | 'slate';
  message: string;
  isDuplicate?: boolean;
  error?: string;
}

export interface ConnectionStatusResponse {
  connected: boolean;
  sheetTitle?: string;
  error?: string;
}
