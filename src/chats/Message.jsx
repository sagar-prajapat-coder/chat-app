import { useLocation, useNavigate } from "react-router-dom";
import { IoMdSend } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import Sidebar from "../layouts/Sidebar";
import Api from "../config/Api";
import socket from "../config/Socket";
import { TypingIndicator } from "../components/TypingIndicator";
import { fistAndLastInitials, formatFileSize } from "../utils/helper.js";
import { BarLoader, SyncLoader } from "react-spinners";
import Webrtc from "../components/Webrtc.jsx";

function Message() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingStatus, setTypingStatus] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);


  // base URL for attachments
  const baseUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.emit("join", userData?._id);
  }, [userData?._id]);


  useEffect(() => {
    if (!location.state?.userId) {
      navigate("/");
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await Api.get(`conversation/${location.state.userId}`);
        const normalized = res.data.data.map((msg) => ({
          ...msg,
          attachments:
            Array.isArray(msg.attachments) && msg.attachments.length > 0
              ? getAttachmentUrl(msg.attachments[0])
              : typeof msg.attachments === "string"
              ? getAttachmentUrl(msg.attachments)
              : null,
        }));
      
        setMessages(normalized.length > 0 ? normalized : []);
        await markMessagesAsSeen();
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [location.state?.userId, navigate, baseUrl]);

  const markMessagesAsSeen = async () => {
    try {
      if (location.state.userId) {
        console.log(
          "Marking messages as seen for user:",
          location.state.userId
        );
        await Api.post("/messages/seen", { userId: location.state.userId });
        socket.emit("messagesSeen", {
          sender: location.state.userId,
          receiver: userData?._id,
        });
      }
    } catch (err) {
      console.error("Failed to mark messages as seen", err);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim() !== "") {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", {
          sender: userData?._id,
          receiver: location.state.userId,
        });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit("stopTyping", {
          sender: userData?._id,
          receiver: location.state.userId,
        });
      }, 1000);
    } else {
      if (isTyping) {
        setIsTyping(false);
        socket.emit("stopTyping", {
          sender: userData?._id,
          receiver: location.state.userId,
        });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    if (file) {
      setAttachment(file);
      setAttachmentPreview(file.name);
    }
  };

  const getAttachmentUrl = (attachment) => {
    if (!attachment) return null;

    // If already a full URL, return as-is
    if (attachment.startsWith("http")) return attachment;

    // Else, prepend baseUrl
    return baseUrl + attachment.replace(/^\/+/, "");
  };
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    try {
      const formData = new FormData();
      formData.append("receiverId", location.state.userId);
      if (input.trim()) formData.append("message", input.trim());
      if (attachment) formData.append("attachments", attachment);

      const res = await Api.post("/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const raw = res.data.data;

      const normalizedMessage = {
        ...raw,
        fromSelf: true,
        attachments:
          Array.isArray(raw.attachments) && raw.attachments.length > 0
            ? getAttachmentUrl(raw.attachments[0])
            : typeof raw.attachments === "string"
            ? getAttachmentUrl(raw.attachments)
            : null,
      };

      console.log(normalizedMessage);
      setMessages((prev) => [...prev, normalizedMessage]);

      // ✅ Emit normalized message, not raw
      socket.emit("sendMessage", normalizedMessage);

      setInput("");
      setAttachment(null);
      setAttachmentPreview(null);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }; 

  useEffect(() => {
    const handleReceiveMessage = async (msg) => {
      if (msg.sender === userData?._id) return;

      const normalized = {
        ...msg,
        attachments:
          Array.isArray(msg.attachments) && msg.attachments.length > 0
            ? getAttachmentUrl(msg.attachments[0])
            : typeof msg.attachments === "string"
            ? getAttachmentUrl(msg.attachments)
            : null,
      };

      setMessages((prev) => [...prev, normalized]);

      if (msg.sender === location.state.userId) {
        try {
          await Api.post("/messages/seen", { userId: msg.sender });
          socket.emit("messagesSeen", {
            sender: msg.sender,
            receiver: userData?._id,
          });
        } catch (err) {
          console.error("Failed to auto-mark as seen", err);
        }
      }
    };

    const handleUpdateSeenStatus = ({ from }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.fromSelf && msg.receiver === from ? { ...msg, seen: true } : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("updateSeenStatus", handleUpdateSeenStatus);
    socket.on("userTyping", ({ from }) => {
      if (from === location.state.userId) setTypingStatus(true);
    });
    socket.on("userStoppedTyping", ({ from }) => {
      if (from === location.state.userId) setTypingStatus(false);
    });
    socket.on("userOnline", (id) => {
      setOnlineUsers((prev) => new Set(prev).add(id));
    });
    socket.on("userOffline", (id) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("updateSeenStatus", handleUpdateSeenStatus);
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [location.state?.userId, userData?._id, baseUrl]);

  return (
    <>
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        <div className="w-full md:w-64">
          <Sidebar user={userData} />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center px-6 py-4 bg-white border-b">
            <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-gray-700 font-semibold">
              {fistAndLastInitials(location.state.userName) || ""}
            </div>


            <div>
              <div className="font-semibold">{location.state.userName}</div>
              <div className="text-xs text-gray-500">
                {onlineUsers.has(location.state.userId) ? "Online" : "Offline"}
              </div>
            </div>
          </div>
            <Webrtc  />
          {
            loading ? (
              <>
              <div className="flex justify-center items-center h-screen">
                    <BarLoader color="#22c55e" height={4} width={150} />
              </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-100">
                  <ul className="space-y-2">
                    {messages.map((msg) => (
                      <li
                        key={msg._id || Math.random()}
                        className={`flex ${
                          msg.fromSelf ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg shadow ${
                            msg.fromSelf
                              ? "bg-green-100 text-right rounded-br-none ml-auto"
                              : "bg-white text-left rounded-bl-none mr-auto"
                          }`}
                        >
                          {msg.attachments &&
                            (/\.(jpg|jpeg|png|gif)$/i.test(msg.attachments) ? (
                              <img
                                src={msg.attachments}
                                alt=""
                                className="max-w-full rounded mb-1"
                              />
                            ) : (
                              <video controls className="max-w-full rounded mb-1">
                                <source src={msg.attachments} />
                              </video>
                            ))}

                          {msg.message && (
                            <div className="text-sm">{msg.message}</div>
                          )}

                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(
                              msg.createdAt || Date.now()
                            ).toLocaleTimeString()}
                            {msg.fromSelf && (
                              <span>
                                {msg.seen ? (
                                  <span className="text-blue-500">✓✓</span>
                                ) : (
                                  <span className="text-gray-500">✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                </div>
              </>
            )
          }

          <TypingIndicator isTyping={typingStatus} />
          {/* Attachment preview */}
          {attachment && (
            <div className="relative w-full max-w-xs rounded overflow-hidden ">
              <div className="p-2 bg-white border-t text-sm">
                <div className="font-medium truncate">{attachment.name}</div>
                <div className="text-gray-500">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setAttachmentPreview(null);
                }}
                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white text-red-600 rounded-full p-1.5 shadow"
                title="Remove"
              >
                &times;
              </button>
            </div>
          )}

          <form
            className="flex items-center px-0 sm:px-6 md:px-6 lg:px-6 py-4 bg-white border-t space-x-2"
            onSubmit={handleSend}
          >
            {/* Hidden file input */}
            <input
              type="file"
              id="fileInput"
              onChange={handleAttachmentChange}
              className="hidden"
            />

            {/* Icon button to trigger file input */}
            <button
              type="button"
              onClick={() => document.getElementById("fileInput").click()}
              className="text-gray-600 hover:text-green-500 p-2"
              title="Attach file"
            >
              {/* You can replace this SVG with any icon library */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12.79V9a7 7 0 00-14 0v6a5 5 0 0010 0V9a3 3 0 00-6 0v5"
                />
              </svg>
            </button>

            <input
              type="text"
              placeholder="Type a message"
              className="w-[64%] sm:flex-1 md:flex-1 lg:flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring"
              value={input}
              onChange={handleInputChange}
            />
             <button
              type="submit"
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
            >
              <IoMdSend size={20} />
            </button>
          </form>
        </main>
      </div>
    </>
  );
}

export default Message;
