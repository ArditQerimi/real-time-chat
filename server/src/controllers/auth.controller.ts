import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";

const JWT_SECRET = process.env.JWT_SECRET || "MY_JWT_SUPER_SECRET_KEY";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
      },
      select: { id: true, username: true, createdAt: true },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("error", err);
    res.status(500).json({ error: "Server error occurred!" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log("username", username);
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "User doesn't exist!" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ error: "Invalid password, try another password!" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
