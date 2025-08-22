import Todo from "../models/Todo.js";
import User from "../models/User.js";

export const getTodos = async (req, res) => {
  try {
    let todos;
    
    if (req.user.role === "admin") {
      todos = await Todo.find().populate("userId", "name email role");
    } else if (req.user.role === "manager") {
      const userTodos = await Todo.find({ userId: req.user._id });
      const userTodosList = await Todo.find({ 
        userId: { $in: await User.find({ role: "user" }).select("_id") }
      }).populate("userId", "name email role");
      
      todos = [...userTodos, ...userTodosList];
    } else {
      todos = await Todo.find({ userId: req.user._id });
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

    const todos = await Todo.find({ userId: req.params.userId }).populate("userId", "name email role");
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos", error: error.message });
  }
};

export const addTodo = async (req, res) => {
  try {
    const { task, description, status, userId } = req.body;

    if (!task) {
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
      task,
      description,
      status: status || "pending",
    });

    const populatedTodo = await Todo.findById(todo._id).populate("userId", "name email role");
    res.status(201).json(populatedTodo);
  } catch (error) {
    res.status(500).json({ message: "Error creating todo", error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    let todo;
    
    if (req.user.role === "admin") {
      todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate("userId", "name email role");
    } else if (req.user.role === "manager") {
      todo = await Todo.findOneAndUpdate(
        { 
          _id: req.params.id,
          $or: [
            { userId: req.user._id },
            { userId: { $in: await User.find({ role: "user" }).select("_id") } }
          ]
        },
        req.body,
        { new: true }
      ).populate("userId", "name email role");
    } else {
      todo = await Todo.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true }
      );
    }

    if (!todo) {
      return res.status(404).json({ message: "Todo not found or not authorized" });
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: "Error updating todo", error: error.message });
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
        userId: req.user._id
      });
    } else {
      todo = await Todo.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });
    }

    if (!todo) {
      return res.status(404).json({ message: "Todo not found or not authorized to delete" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting todo", error: error.message });
  }
};
