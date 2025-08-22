import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import TodoPage from "./components/TodoPage";

function AppRoutes() {
  const { auth } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/"
        element={auth ? <Navigate to="/todos" /> : <Login />}
      />
      <Route
        path="/todos"
        element={auth ? <TodoPage /> : <Navigate to="/" />}
      />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
