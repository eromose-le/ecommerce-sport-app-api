import express from "express";
import {
  login,
  logout,
  register,
  activate,
} from "../controllers/auth.controller";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", register);
router.post("/activate", verifyToken, activate);
router.post("/login", login);
router.post("/logout", logout);

export default router;
