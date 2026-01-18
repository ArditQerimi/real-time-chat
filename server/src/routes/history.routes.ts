import { Router } from 'express';
import {
  getRoomHistory,
  getPrivateMessageHistory,
} from '../controllers/history.controller';

const router = Router();

router.get('/:room', getRoomHistory);
router.get('/pm/:u1/:u2', getPrivateMessageHistory);

export default router;