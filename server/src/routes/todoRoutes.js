import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { 
  getTodos, 
  getTodosByUserId, 
  addTodo, 
  updateTodo, 
  deleteTodo 
} from "../controllers/todoController.js";

const router = express.Router();

router.use(protect);

router.get("/", getTodos);

router.get("/user/:userId", authorize("admin", "manager"), getTodosByUserId);

router.post("/", addTodo);

router.put("/:id", updateTodo);

router.delete("/:id", deleteTodo);

export default router;
