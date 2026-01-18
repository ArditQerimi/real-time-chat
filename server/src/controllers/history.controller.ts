import { Request, Response } from "express";
import { getHistory, privateMessageKey, roomKey } from "../redis/helpers";

export const getRoomHistory = async (req: Request, res: Response) => {
  const { room } = req.params;
  const page = Number(req.query.page ?? 0);
  const size = Number(req.query.size ?? 10);

  const key = roomKey(room);

  try {
    const messages = await getHistory(key.toLowerCase(), page, size);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to load history messages" });
  }
};

export const getPrivateMessageHistory = async (req: Request, res: Response) => {
  const { u1, u2 } = req.params;
  const page = Number(req.query.page ?? 0);
  const size = Number(req.query.size ?? 10);

  const key = privateMessageKey(u1, u2);

  try {
    const messages = await getHistory(key, page, size);
    res.json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load private messages history" });
  }
};
