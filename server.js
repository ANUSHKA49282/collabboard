const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Storage config for file uploads
const upload = multer({ dest: "uploads/" });

// In-memory task store
let tasks = [];

// Routes

// GET all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// POST new task with optional file
app.post("/tasks", upload.single("attachment"), (req, res) => {
  const { id, title, status, assignedTo, priority, dueDate } = req.body;
  const completed = req.body.completed === "true";
  const file = req.file?.filename || null;

  tasks.push({
    id,
    title,
    status,
    assignedTo,
    priority,
    dueDate,
    completed,
    attachment: file,
  });

  io.emit("taskUpdated");
  res.sendStatus(200);
});

// DELETE a task
app.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  tasks = tasks.filter((t) => t.id !== id);
  io.emit("taskUpdated");
  res.sendStatus(200);
});

// UPDATE a task (mark as completed or update status)
app.put("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const updatedTask = req.body;
  tasks = tasks.map((task) => (task.id === id ? updatedTask : task));
  io.emit("taskUpdated");
  res.sendStatus(200);
});

// Chat with Socket.IO
io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("joinRoom", (taskId) => {
    socket.join(taskId);
    console.log(`Socket ${socket.id} joined room: ${taskId}`);
  });

  socket.on("leaveRoom", (taskId) => {
    socket.leave(taskId);
    console.log(`Socket ${socket.id} left room: ${taskId}`);
  });

  socket.on("chatMessage", (msg) => {
    socket.to(msg.taskId).emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
