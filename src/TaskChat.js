import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const TaskChat = ({ taskId, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Join room for this task
    socket.emit("joinRoom", taskId);

    // Listen for incoming messages for this task
    socket.on("chatMessage", (msg) => {
      if (msg.taskId === taskId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // Cleanup on unmount or taskId change
    return () => {
      socket.emit("leaveRoom", taskId);
      socket.off("chatMessage");
      setMessages([]); // reset messages when switching task
    };
  }, [taskId]);

  useEffect(() => {
    // Scroll chat to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "") return;
    const message = {
      taskId,
      user,
      text: input,
      timestamp: new Date().toISOString(),
    };
    // Emit message to server
    socket.emit("chatMessage", message);
    // Add message locally too
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  return (
    <div className="task-chat mt-3 border rounded p-2 bg-gray-50 max-h-48 overflow-auto">
      <div
        className="messages mb-2 text-sm"
        style={{ maxHeight: "150px", overflowY: "auto" }}
      >
        {messages.length === 0 && (
          <p className="text-gray-400 italic">No messages yet.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="mb-1">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border rounded px-2 py-1"
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TaskChat;
