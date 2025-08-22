import { useEffect, useState } from "react";
import API from "../api";

export default function EmployeeManagement({ onlyEdit }) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    API.get("/employees").then((res) => setEmployees(res.data));
  }, []);

  return (
    <div>
      <h3>Employees</h3>
      {employees.map((emp) => (
        <div key={emp._id}>{emp.name} - {emp.role}</div>
      ))}
    </div>
  );
}
