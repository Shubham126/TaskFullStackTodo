import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = "http://localhost:5000/api";

export default function TodoPage() {
  const { auth, logout } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [visible, setVisible] = useState([]); // filtered view
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [form, setForm] = useState({ title: "", description: "", status: "pending" });
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
        const data = res.data || [];
        setTodos(data);
        setVisible(data);
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

  // Debounce searchTerm by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Apply filtering when debouncedTerm or todos change
  useEffect(() => {
    if (!debouncedTerm) {
      setVisible(todos);
      return;
    }
    const term = debouncedTerm;
    const filtered = todos.filter((todo) => {
      const title = (todo.task || todo.title || "").toLowerCase();
      const description = (todo.description || "").toLowerCase();
      const creator =
        (todo.userId?.name ||
          todo.createdBy?.name ||
          todo.userId?.email ||
          todo.createdBy?.email ||
          "").toLowerCase();

      return (
        title.includes(term) ||
        description.includes(term) ||
        creator.includes(term)
      );
    });
    setVisible(filtered);
  }, [debouncedTerm, todos]);

  const toIdString = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val._id) return String(val._id);
    try {
      return String(val);
    } catch {
      return "";
    }
  };

  const getOwnerId = (todo) => todo.userId ?? todo.createdBy;
  const getOwnerRole = (todo) => todo.userId?.role || todo.createdBy?.role || null;

  const isOwnerOf = (todo) =>
    toIdString(getOwnerId(todo)) === toIdString(auth?.user?._id);

  const canEdit = (todo) => {
    const me = auth?.user;
    if (!me) return false;
    if (me.role === "admin") return true;
    if (me.role === "manager") {
      if (isOwnerOf(todo)) return true;
      return getOwnerRole(todo) === "user";
    }
    return isOwnerOf(todo);
  };

  const canDelete = (todo) => {
    const me = auth?.user;
    if (!me) return false;
    if (me.role === "admin") return true;
    return isOwnerOf(todo);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", status: "pending" });
    setEditingTodo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const task = form.title?.trim();
    const description = form.description?.trim();
    const status = form.status;
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
          status,
        });
        setTodos((prev) =>
          prev.map((t) => (t._id === editingTodo._id ? res.data : t))
        );
      } else {
        const res = await axiosAuth.post("/todos", { task, description, status });
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
      status: todo.status || "pending",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold">Your Todos</h2>
        <div className="flex items-center gap-3 px-4 py-2 rounded">
        <input
          type="text"
          value={searchTerm}
          placeholder="Search"
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 w-full rounded"
        />
        </div>
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
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="pending">pending</option>
          <option value="completed">completed</option>
        </select>
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
        {visible.map((todo) => {
          const createdAt = todo.createdAt ? new Date(todo.createdAt) : null;
          const titleText = todo.task || todo.title || "Untitled";
          const creator =
            todo.userId?.name ||
            todo.createdBy?.name ||
            todo.userId?.email ||
            todo.createdBy?.email ||
            "Unknown";

          const showEdit = canEdit(todo);
          const showDelete = canDelete(todo);

          return (
            <div
              key={todo._id}
              className="border rounded p-4 shadow-sm bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold">{titleText}</span>
                  <span className="font-bold">By: {creator}</span>
                  <span
                    className={`font-semibold ${
                      todo.status === "completed" ? "text-green-600" : "text-yellow-700"
                    }`}
                  >
                    Status: {todo.status || "pending"}
                  </span>
                  <span>
                    {createdAt
                      ? `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {showEdit && (
                    <button
                      onClick={() => startEdit(todo)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {showDelete && (
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

        {visible.length === 0 && (
          <div className="text-center text-gray-500">No matching todos.</div>
        )}
      </div>
    </div>
  );
}
