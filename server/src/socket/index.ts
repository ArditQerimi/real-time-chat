import { Server, Socket } from "socket.io";
import CryptoJS from "crypto-js";
import { redis } from "../redis/client";
import { prisma } from "../prismaClient";
import { onlineUsersKey, saveMessage } from "../redis/helpers";

type UserPayload = { id: string; username: string };

interface MessagePayload {
  id: string;
  content: string;
  from: string;
  to?: string;
  room?: string;
  createdAt?: string;
}

const AES_SECRET =
  process.env.ENCRYPTION_SECRET_KEY ?? "MY_ENCRYPTION_SECRET_KEY";

export default function setupSocket(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as UserPayload | undefined;

    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User: ${user.username} (${socket.id})`);

    socket.join(`user:${user.username}`);

    socket.on("join_room", async ({ room }: { room: string }) => {
      try {
        console.log(`${user.username} is joining room: ${room}`);
        const foundedRoom = await prisma.room.findUnique({
          where: { slug: room.toLowerCase() },
        });

        console.log("Found room record:", foundedRoom);
        if (!foundedRoom) {
          socket.emit("error", { message: "Room does not exist" });
          return;
        }

        await redis.sAdd(onlineUsersKey(room), user.username);

        socket.join(room);

        io.to(room).emit("system", `${user.username} joined ${room}`);

        const onlineUsers = await redis.sMembers(onlineUsersKey(room));
        console.log("Online users in room", room, ":", onlineUsers);
        io.to(room).emit("online_users", onlineUsers);
      } catch (err) {
        console.error("join_room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on(
      "join_private",
      async ({ with: targetUsername }: { with: string }) => {
        try {
          if (
            !targetUsername ||
            targetUsername.toLowerCase() === user.username.toLowerCase()
          ) {
            socket.emit("error", { message: "Invalid private chat" });
            return;
          }

          const targetUser = await prisma.user.findUnique({
            where: { username: targetUsername },
            select: { id: true, username: true },
          });

          if (!targetUser) {
            socket.emit("error", { message: "User not found" });
            return;
          }

          const roomKey = `private:${[user.username, targetUser.username].sort().join("-")}`;

          socket.join(roomKey);

          console.log(
            `${user.username} joined private chat with ${targetUser.username}`,
          );
        } catch (err) {
          console.error("join_private error:", err);
          socket.emit("error", { message: "Failed to join private chat" });
        }
      },
    );

    socket.on(
      "typing",
      ({ room, isTyping }: { room: string; isTyping: boolean }) => {
        socket.to(room).emit("typing", {
          username: user.username,
          isTyping,
        });
      },
    );

    socket.on(
      "message",
      async ({ text, room }: { text: string; room: string }) => {
        console.log(`Room message from ${user.username} to room ${room}`);
        console.log("Socket rooms:", Array.from(socket.rooms));
        try {
          if (text?.length === 0) {
            socket.emit("error", { message: "Invalid message content" });
            return;
          }

          const normalizedRoom = room.toLowerCase();
          if (!socket.rooms.has(room)) {
            socket.emit("error", { message: "You must join the room first" });
            return;
          }

          const roomRecord = await prisma.room.findUnique({
            where: { slug: normalizedRoom },
            select: { id: true },
          });

          if (!roomRecord) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          let encryptedContent = CryptoJS.AES.encrypt(
            text,
            AES_SECRET,
          ).toString();

          const savedMessage = await prisma.message.create({
            data: {
              content: encryptedContent,
              roomId: roomRecord.id,
              fromId: user.id,
              createdAt: new Date().toISOString(),
            },
            include: { from: { select: { username: true } } },
          });

          console.log("savedMessage", savedMessage);

          const payload: MessagePayload = {
            id: savedMessage.id,
            content: savedMessage.content,
            from: savedMessage.from?.username ?? "",
            room: normalizedRoom,
            createdAt: savedMessage.createdAt.toISOString(),
          };

          await saveMessage({
            ...payload,
            from: user.username,
            room: normalizedRoom,
            text: encryptedContent,
            ts: savedMessage.createdAt.toISOString(),
          });

          io.to(room).emit("message", payload);
        } catch (err) {
          console.error("Error sending room message:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    socket.on(
      "private_message",
      async ({ text, to }: { text: string; to: string }) => {
        console.log("User:", user);
        console.log(`To user: ${to}`);
        try {
          if (text.length === 0) {
            socket.emit("error", { message: "Invalid message content" });
            return;
          }

          if (to.toLowerCase() === user.username.toLowerCase()) {
            socket.emit("error", {
              message: "Cannot send message to yourself",
            });
            return;
          }

          const receiver = await prisma.user.findUnique({
            where: { username: to },
            select: { id: true, username: true },
          });

          console.log("Receiver user here:", receiver);

          if (!receiver) {
            socket.emit("error", { message: "User not found" });
            return;
          }

          let encryptedContent = CryptoJS.AES.encrypt(
            text,
            AES_SECRET,
          ).toString();

          console.log("FinalContent", encryptedContent);

          const savedMessage = await prisma.message.create({
            data: {
              content: encryptedContent,
              fromId: user.id,
              toId: receiver.id,
              createdAt: new Date(),
            },
            include: { from: { select: { username: true } } },
          });

          const payload: MessagePayload = {
            id: savedMessage.id,
            content: savedMessage.content,
            from: user.username,
            to: receiver.username,
            createdAt: new Date().toISOString(),
          };

          await saveMessage(
            {
              ...payload,
              from: user.username,
              to: receiver.username,
              text: encryptedContent,
              ts: new Date().toISOString(),
              room: "",
            },
            true,
          );
          io.to(`user:${user.username}`).emit("private_message", payload);
          io.to(`user:${receiver.username}`).emit("private_message", payload);
        } catch (err) {
          console.error("Error sending private message:", err);
          socket.emit("error", { message: "Failed to send private message" });
        }
      },
    );

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${user.username} (${socket.id})`);

      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);

      for (const room of rooms) {
        await redis.sRem(onlineUsersKey(room), user.username);

        io.to(room).emit("system", `${user.username} left ${room}`);
        const remaining = await redis.sMembers(onlineUsersKey(room));
        io.to(room).emit("online_users", remaining);
      }
    });
  });
}
