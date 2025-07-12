import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Api from "../config/Api";
import socket from "../config/Socket";
import { Search } from "../components/Search";
import { fistAndLastInitials } from "../utils/helper";

function Sidebar() {
  const userData = JSON.parse(localStorage.getItem("user"))?.data.name;
  const location = useLocation();

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const [users, setUsers] = useState([]);
  const fetchUsers = async () => {
    try {
      const res = await Api.get("chat-list");
      const data = await res?.data?.data;
      setUsers(data);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // track user online offline
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    socket.on("userOnline", (userId) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    socket.on("userOffline", (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, []);

  const [activeUserId, setActiveUserId] = useState(null);

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="text-xl font-bold flex items-center gap-2">
          <span className="relative flex items-center justify-center h-8 w-8 rounded-full bg-green-500 border-2 border-white shadow">
            <svg
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
            </svg>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
          </span>
          {userData}
        </div>
        <div
          className="cursor-pointer p-2 rounded hover:bg-gray-100"
          onClick={handleLogout}
        >
          <svg
            className="w-6 h-6 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
            />
          </svg>
        </div>
      </div>
      <nav className="p-4">
        <Search />
        <ul className="space-y-2">
          {users?.map((user, idx) => {
            return (
              <li key={idx} className="flex items-center gap-2">
                <span className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 border-2 border-white shadow text-gray-600 font-semibold">
                 { fistAndLastInitials(user.name) || ""}
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${
                      onlineUsers.has(user._id) ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </span>
                <Link
                  to="/conversations"
                  state={{ userId: user._id, userName: user.name }}
                  className={`block p-2 rounded hover:bg-blue-100 text-gray-700 flex-1 ${
                    activeUserId === user._id ||
                    location.state?.userId === user._id
                      ? "bg-blue-200 font-semibold"
                      : ""
                  }`}
                  onClick={() => setActiveUserId(user._id)}
                >
                  {user.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
export default Sidebar;
