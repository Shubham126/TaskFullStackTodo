// src/components/TodoList.jsx
import { useEffect, useState } from "react";
import API from "../api"; // should be axios instance with baseURL: http://localhost:5000/api

export default function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.get("/todos");
        if (mounted) setTodos(res.data || []);
      } catch (err) {
        console.error("Fetch todos error:", err);
        alert(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load todos"
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4">Todos</h3>
      <div className="space-y-4">
        {todos.map((todo) => {
          const createdAt = todo.createdAt ? new Date(todo.createdAt) : null;
          const titleText = todo.task || todo.title || "Untitled";
          const creator =
            todo.userId?.name ||
            todo.createdBy?.name ||
            todo.userId?.email ||
            todo.createdBy?.email ||
            "Unknown";

          return (
            <div
              key={todo._id}
              className="border rounded p-4 shadow-sm bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold">{titleText}</span>
                  <span className="font-bold">By: {creator}</span>
                  <span>
                    {createdAt
                      ? `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`
                      : ""}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-gray-900 whitespace-pre-line">
                {todo.description}
              </p>
            </div>
          );
        })}
        {todos.length === 0 && (
          <div className="text-center text-gray-500">No todos yet.</div>
        )}
      </div>
    </div>
  );
}
