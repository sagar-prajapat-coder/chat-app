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

  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeUserId, setActiveUserId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchUsers = async () => {
    try {
      const res = await Api.get("chat-list");
      setUsers(res?.data?.data || []);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden p-3 m-2 rounded bg-gray-200 text-gray-700 z-50 relative flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 md:static md:translate-x-0 md:block h-[100vh] max-h-[100] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-base md:text-xl font-bold flex items-center gap-2">
            <span className="relative flex items-center justify-center h-8 w-8 rounded-full bg-green-500 border-2 border-white shadow">
              <svg
                className="h-6 w-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
              </svg>
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

        {/* Search and chat list */}
        <nav className="p-4">
          <Search />
          <ul className="space-y-2">
            {users?.map((user) => (
              <li key={user._id} className="flex items-center gap-2">
                <span className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 border-2 border-white shadow text-gray-600 font-semibold">
                  {fistAndLastInitials(user.name) || ""}
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
                  onClick={() => {
                    setActiveUserId(user._id);
                    setIsOpen(false); // Close sidebar on mobile after selection
                  }}
                >
                  {user.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
