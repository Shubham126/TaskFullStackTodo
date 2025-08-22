import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "../controllers/employeeController.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin"), getEmployees);
router.post("/", authorize("admin", "manager"), addEmployee);
router.put("/:id", authorize("admin", "manager"), updateEmployee);
router.delete("/:id", authorize("admin"), deleteEmployee);

export default router;
