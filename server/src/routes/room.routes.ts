import { Router } from "express";
import { createRoom, getAllRooms } from "../controllers/room.controller";

const router = Router();

router.get("/", getAllRooms);
router.post("/", createRoom);

export default router;
