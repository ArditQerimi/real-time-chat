export interface User {
id: string;          
username: string;
rooms: string[];     
}
export interface Message {
id: string;
room: string;
from: string;
text: string;
ts: string;       
encrypted?: boolean;
to?: string;          
}
export interface StoredRoom {
  id: string;
  name: string;
  desc: string;
}