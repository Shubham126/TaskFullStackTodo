import { useEffect, useState } from "react";
import API from "../api";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");

  useEffect(() => {
    API.get("/todos").then((res) => setTodos(res.data));
  }, []);

  const addTodo = async () => {
    const res = await API.post("/todos", { task });
    setTodos([...todos, res.data]);
    setTask("");
  };

  return (
    <div>
      <h3>My Todos</h3>
      <input value={task} onChange={(e) => setTask(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      {todos.map((t) => (
        <div key={t._id}>
          {t.task} ({t.status})
        </div>
      ))}
    </div>
  );
}
