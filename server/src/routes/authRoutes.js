import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { 
  register, 
  login, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/users", protect, authorize("admin", "manager"), getAllUsers);
router.get("/users/:id", protect, authorize("admin", "manager"), getUserById);
router.put("/users/:id", protect, authorize("admin", "manager"), updateUser);

router.delete("/users/:id", protect, authorize("admin"), deleteUser);

export default router;
