import Todo from "../models/Todo.js";
import User from "../models/User.js";

const POPULATE_USER = { path: "userId", select: "name email role" };

export const getTodos = async (req, res) => {
  try {
    let todos = [];
    if (req.user.role === "admin") {
      todos = await Todo.find().populate(POPULATE_USER).sort({ createdAt: -1 });
    } else if (req.user.role === "manager") {
      const own = await Todo.find({ userId: req.user._id }).populate(POPULATE_USER);
      const userIds = await User.find({ role: "user" }).select("_id");
      const usersTodos = await Todo.find({ userId: { $in: userIds } }).populate(POPULATE_USER);
      todos = [...own, ...usersTodos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      todos = await Todo.find({ userId: req.user._id }).populate(POPULATE_USER).sort({ createdAt: -1 });
    }
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos", error: error.message });
  }
};

export const getTodosByUserId = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({ message: "Not authorized to view other users' todos" });
    }
    const todos = await Todo.find({ userId: req.params.userId }).populate(POPULATE_USER).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos", error: error.message });
  }
};

export const addTodo = async (req, res) => {
  try {
    const { task, description, status, userId } = req.body;
    if (!task || !task.trim()) {
      return res.status(400).json({ message: "Task is required" });
    }
    let targetUserId = req.user._id;
    if (userId && (req.user.role === "admin" || req.user.role === "manager")) {
      targetUserId = userId;
    } else if (userId && req.user.role === "user") {
      return res.status(403).json({ message: "Users can only create todos for themselves" });
    }
    const todo = await Todo.create({
      userId: targetUserId,
      task: task.trim(),
      description: (description || "").trim(),
      status: status || "pending",
    });
    const populatedTodo = await Todo.findById(todo._id).populate(POPULATE_USER);
    res.status(201).json(populatedTodo);
  } catch (error) {
    res.status(500).json({ message: "Error creating todo", error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const me = req.user;
    const existing = await Todo.findById(req.params.id).populate(POPULATE_USER);
    if (!existing) return res.status(404).json({ message: "Todo not found" });

    // Ensure both IDs are compared as strings for reliability
    const ownerId = (existing.userId._id || existing.userId).toString();
    const isOwner = ownerId === me._id.toString();
    const isAdmin = me.role === "admin";
    const isManager = me.role === "manager";
    const targetIsUser = existing.userId?.role === "user";
    const allowed = isAdmin || isOwner || (isManager && (isOwner || targetIsUser));

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed to edit this todo" });
    }

    const updates = {};
    if (typeof req.body.task === "string") updates.task = req.body.task.trim();
    if (typeof req.body.description === "string") updates.description = req.body.description.trim();
    if (typeof req.body.status === "string") updates.status = req.body.status;
    const updated = await Todo.findByIdAndUpdate(existing._id, updates, { new: true }).populate(POPULATE_USER);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating todo", error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const me = req.user;
    const existing = await Todo.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Todo not found" });

    // Ensure both IDs are compared as strings for reliability
    const ownerId = (existing.userId._id || existing.userId).toString ? (existing.userId._id || existing.userId).toString() : String(existing.userId._id || existing.userId);
    const isOwner = ownerId === me._id.toString();
    const isAdmin = me.role === "admin";
    const allowed = isAdmin || isOwner;

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed to delete this todo" });
    }
    await existing.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting todo", error: error.message });
  }
};
