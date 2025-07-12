import { useState, useEffect, useRef } from "react";
import Api from "../config/Api";
import { Link } from "react-router-dom";
import socket from "../config/Socket";
import { fistAndLastInitials } from "../utils/helper";

export const Search = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const debounceTimeout = useRef(null);

  const fetchSuggestions = async (searchTerm) => {
    try {
      const res = await Api.get(
        "/user-search?search=" + encodeURIComponent(searchTerm)
      );
      const data = res?.data?.data || [];
      console.log("API response:", data);
      setSuggestions(data);
    } catch (err) {
      console.error("API error:", err);
      setSuggestions([]);
    }
  };

  // Debounce input changes
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

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
      clearTimeout(debounceTimeout.current);
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [query]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowSuggestions(true);
    if (onSearch) onSearch(val);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery("");
    setShowSuggestions(false);
    if (onSearch) onSearch(suggestion.name);
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        className="px-3 py-2 w-52 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 w-52 mt-1 rounded shadow max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => {
            return (
              <div key={s._id || idx} className="flex items-center space-x-2">
                <span className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 border-2 border-white shadow text-gray-600 font-semibold">
                  { fistAndLastInitials(s.name) || ""}
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${
                      onlineUsers.has(s._id) ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </span>
                <Link
                  to="/conversations"
                  state={{ userId: s._id, userName: s.name }}
                  className="block p-2 rounded hover:bg-blue-100 text-gray-700 flex-1"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.name}
                </Link>
              </div>
            );
          })}
        </ul>
      )}
    </div>
  );
};
