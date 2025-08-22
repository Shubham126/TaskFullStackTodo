import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import EmployeeManagement from "./EmployeeManagement";
import TodoList from "./TodoList";

export default function Dashboard() {
  const { auth } = useContext(AuthContext);

  return (
    <div>
      <h2>Welcome {auth?.name} ({auth?.role})</h2>
      {auth?.role === "admin" && <EmployeeManagement />}
      {auth?.role === "manager" && <EmployeeManagement onlyEdit />}
      <TodoList />
    </div>
  );
}
