export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  typing: boolean;
}