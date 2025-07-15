import { Navigate } from "react-router-dom";

function AuthMiddleware({ children }) {
  const userData = JSON.parse(localStorage.getItem("user"));

  if (!userData?.token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AuthMiddleware;
