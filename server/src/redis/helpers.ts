import { redis } from "./client";
import { Message, StoredRoom } from "../interfaces";

////////// Notes:
// roomKey functioon generates Redis key for a chat room

// priVateMessageKey function generates Redis key for private messages between two users,
// and this generates a key that is alphabetically sorted key like 'private:Elon:Mark' for users 'Elon' and 'Mark'.

export const roomKey = (roomId: string): string => `room:${roomId}`;

export const privateMessageKey = (a: string, b: string): string =>
  `private:${[a, b].sort().join(":")}`;

export const privateRoomKey = (a: string, b: string) =>
  ["private", a, b].sort().join(":");

const chatRoomsKey = "chat:rooms";

export const onlineUsersKey = (room: string) => `online_users:${room}`;

// this function generates key based on whether the message is private or in a room

const generateMessageKey = (
  message: Message,
  isPrivateMessage?: boolean,
): string => {
  if (!message.to && isPrivateMessage)
    throw new Error("Private message missing recipient");

  if (message.to) {
    return privateMessageKey(message.from, message.to);
  }
  return roomKey(message.room);
};

// this stores a message in Redis list, and get only 200 most recent messages

export async function saveMessage(
  message: Message,
  isPrivateMessage?: boolean,
): Promise<void> {

  const key = generateMessageKey(message, isPrivateMessage);

  await redis
    .multi()
    .lPush(key, JSON.stringify(message))
    .lTrim(key, 0, 199)
    .exec();
}

// returns array of history messsages from redis

export async function getHistory(
  key: string,
  page: number = 0,
  pageSize: number = 10,
): Promise<Message[]> {
  const start = page * pageSize;
  const end = start + pageSize - 1;
  const messages = await redis.lRange(key, start, end);
  const convertedTOJSON = messages.map((json) => JSON.parse(json) as Message);
  const reversedMessages = convertedTOJSON.reverse();
  // this return based on most recent messages first
  return reversedMessages;
}
