
import Todo from "../models/Todo.js";
import User from "../models/User.js";

const POPULATE_USER = { path: "userId", select: "name email role" };

export const getTodos = async (req, res) => {
  try {
    let todos = [];

    if (req.user.role === "admin") {
      todos = await Todo.find().populate(POPULATE_USER).sort({ createdAt: -1 });
    } else if (req.user.role === "manager") {

      const own = await Todo.find({ userId: req.user._id })
        .populate(POPULATE_USER);

      const userIds = await User.find({ role: "user" }).select("_id");
      const usersTodos = await Todo.find({ userId: { $in: userIds } })
        .populate(POPULATE_USER);

      todos = [...own, ...usersTodos].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else {
      todos = await Todo.find({ userId: req.user._id })
        .populate(POPULATE_USER)
        .sort({ createdAt: -1 });
    }

    res.json(todos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching todos", error: error.message });
  }
};

export const getTodosByUserId = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ message: "Not authorized to view other users' todos" });
    }

    const todos = await Todo.find({ userId: req.params.userId })
      .populate(POPULATE_USER)
      .sort({ createdAt: -1 });

    res.json(todos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching todos", error: error.message });
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
      return res
        .status(403)
        .json({ message: "Users can only create todos for themselves" });
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
    res
      .status(500)
      .json({ message: "Error creating todo", error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    let todo;

    if (req.user.role === "admin") {
      todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).populate(POPULATE_USER);
    } else if (req.user.role === "manager") {
      const userIds = await User.find({ role: "user" }).select("_id");
      todo = await Todo.findOneAndUpdate(
        {
          _id: req.params.id,
          $or: [{ userId: req.user._id }, { userId: { $in: userIds } }],
        },
        req.body,
        { new: true }
      ).populate(POPULATE_USER);
    } else {
      todo = await Todo.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true }
      ).populate(POPULATE_USER);
    }

    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or not authorized" });
    }

    res.json(todo);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating todo", error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    let todo;

    if (req.user.role === "admin") {
      todo = await Todo.findByIdAndDelete(req.params.id);
    } else if (req.user.role === "manager") {

      todo = await Todo.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });
    } else {

      todo = await Todo.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });
    }

    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or not authorized to delete" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting todo", error: error.message });
  }
};
