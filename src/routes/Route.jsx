import { Routes, Route } from "react-router-dom";
import Login from "../auth/Login";
import Dashboard from "../Dashboard";
import AuthMiddleware from "../middleware/Auth";
import Signup from "../auth/Signup";
import Message from "../chats/Message";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/sign-up" element={<Signup />} />
      <Route
        path="/conversations"
        element={
          <AuthMiddleware>
            <Message />
          </AuthMiddleware>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AuthMiddleware>
            <Dashboard />
          </AuthMiddleware>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
