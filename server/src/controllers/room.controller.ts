import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export const createRoom = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const { name, slug } = req.body;
    const existing = await prisma.room.findUnique({
      where: { slug },
    });

    if (existing) {
      return res.status(409).json({
        error: "This room exists!",
      });
    }

    const room = await prisma.room.create({
      data: {
        name,
        slug: slug,
      },
    });

    return res.status(201).json({
      id: room.id,
      slug: room.slug,
      name: room.name,
    });
  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({ error: "Failed to create room" });
  }
};

export const getAllRooms = async (_req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    });

    return res.json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    return res.status(500).json({ error: "Failed to get rooms" });
  }
};
