// src/components/TodoPage.jsx
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const TodoPage = () => {
  const { auth, logout } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });

  // Fetch Todos
  useEffect(() => {
    if (!auth) return;
    axios
      .get("http://localhost:5000/api/todos", {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      .then((res) => setTodos(res.data))
      .catch((err) => console.error(err));
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;

    const res = await axios.post(
      "http://localhost:5000/api/todos",
      form,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    setTodos([...todos, res.data]);
    setForm({ title: "", description: "" });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Your Todos</h2>
      <button
        onClick={logout}
        className="text-black px-3 py-1 rounded"
      >
        Logout
      </button>
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border p-2 w-full"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full"
        />
        <button className="text-black px-3 py-1 rounded">
          Add Todo
        </button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo._id} className="border p-2 mb-2">
            <strong>{todo.title}</strong>
            <p>{todo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoPage;
