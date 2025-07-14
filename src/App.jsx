import { BrowserRouter } from "react-router-dom";
import Login from "./auth/Login";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./routes/Route";

function App() {
  return (
    <div>
       <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </div>
  );
}

export default App;
