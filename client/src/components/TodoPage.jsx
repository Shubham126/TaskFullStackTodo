import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = "http://localhost:5000/api";

export default function TodoPage() {
  const { auth, logout } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingTodo, setEditingTodo] = useState(null);
  const [loading, setLoading] = useState(false);

  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${auth?.token}`,
        "Content-Type": "application/json",
      },
    });
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    (async () => {
      try {
        const res = await axiosAuth.get("/todos");
        setTodos(res.data || []);
      } catch (err) {
        console.error("Fetch todos error:", err);
        alert(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch todos"
        );
      }
    })();
  }, [auth?.token, axiosAuth]);

  const getOwnerId = (todo) =>
    todo.userId?._id || todo.createdBy?._id || todo.userId || todo.createdBy;

  const getOwnerRole = (todo) =>
    todo.userId?.role || todo.createdBy?.role || null;

  const canEdit = (todo) => {
    const me = auth?.user;
    if (!me) return false;
    if (me.role === "admin") return true;
    if (me.role === "manager" && getOwnerRole(todo) === "user") return true;
    return String(getOwnerId(todo)) === String(me._id);
  };

  const canDelete = (todo) => {
    const me = auth?.user;
    if (!me) return false;
    if (me.role === "admin") return true;
    return String(getOwnerId(todo)) === String(me._id);
  };

  const resetForm = () => {
    setForm({ title: "", description: "" });
    setEditingTodo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const task = form.title?.trim();
    const description = form.description?.trim();
    if (!task || !description) {
      alert("Title and description are required");
      return;
    }

    try {
      setLoading(true);
      if (editingTodo) {
        const res = await axiosAuth.put(`/todos/${editingTodo._id}`, {
          task,
          description,
        });
        setTodos((prev) =>
          prev.map((t) => (t._id === editingTodo._id ? res.data : t))
        );
      } else {
        const res = await axiosAuth.post("/todos", { task, description });
        setTodos((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error("Save todo error:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save todo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this todo?")) return;
    try {
      await axiosAuth.delete(`/todos/${id}`);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete todo error:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete todo"
      );
    }
  };

  const startEdit = (todo) => {
    setEditingTodo(todo);
    setForm({
      title: todo.task || todo.title || "",
      description: todo.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Todos</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {auth?.user?.name} ({auth?.user?.role})
          </span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Todo title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border p-2 w-full rounded"
        />
        <textarea
          placeholder="Todo description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full rounded"
          rows={4}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
            }`}
          >
            {editingTodo ? "Update Todo" : "Add Todo"}
          </button>
          {editingTodo && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      
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
                <div className="flex items-center gap-3">
                  {canEdit(todo) && (
                    <button
                      onClick={() => startEdit(todo)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete(todo) && (
                    <button
                      onClick={() => handleDelete(todo._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
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
