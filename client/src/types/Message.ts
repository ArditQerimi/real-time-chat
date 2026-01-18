export interface Message {
  id: number;
  sender: 'me' | 'them' | 'system';
  text: string;
  timestamp: string;     
  room?: string;
  from?: string;
  to?: string;
  ts?: string;
}