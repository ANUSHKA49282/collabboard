import React, { useEffect, useState } from "react";
import Login from "./Login";
import TaskChat from "./TaskChat";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const App = () => {
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    status: "todo",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
    file: null,
  });

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const fetchTasks = async () => {
    const res = await axios.get("http://localhost:4000/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      socket.on("taskUpdated", fetchTasks);
      return () => socket.off("taskUpdated", fetchTasks);
    }
  }, [user]);

  const handleAddTask = async () => {
    if (!form.title) return alert("Title required");
    const id = Date.now();
    const data = new FormData();
    data.append("id", id);
    data.append("title", form.title);
    data.append("status", form.status);
    data.append("completed", false);
    data.append("assignedTo", form.assignedTo);
    data.append("priority", form.priority);
    data.append("dueDate", form.dueDate);
    if (form.file) data.append("attachment", form.file);

    await axios.post("http://localhost:4000/tasks", data);
    setForm({
      title: "",
      status: "todo",
      assignedTo: "",
      priority: "Medium",
      dueDate: "",
      file: null,
    });
    socket.emit("updateTask");
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:4000/tasks/${id}`);
    socket.emit("updateTask");
  };

  const handleComplete = async (task) => {
    await axios.put(`http://localhost:4000/tasks/${task.id}`, {
      ...task,
      completed: true,
      status: "done",
    });
    socket.emit("updateTask");
  };

  const renderTasks = (status) => {
    return tasks
      .filter((t) => t.status === status)
      .map((task) => (
        <div key={task.id} className="bg-white p-4 shadow rounded mb-4">
          <div className="flex justify-between">
            <h3
              className={`font-semibold ${
                task.completed ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>
            <span className="text-sm text-gray-600">{task.priority}</span>
          </div>
          <p className="text-sm text-gray-600">
            Assigned to: {task.assignedTo || "—"}
          </p>
          <p className="text-sm text-gray-600">Due: {task.dueDate || "—"}</p>
          {task.attachment && (
            <a
              href={`http://localhost:4000/uploads/${task.attachment}`}
              className="text-blue-500 text-sm underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              📎 Attachment
            </a>
          )}
          <div className="mt-2 flex gap-2">
            {!task.completed && (
              <button
                className="text-green-600 text-sm"
                onClick={() => handleComplete(task)}
              >
                ✅ Complete
              </button>
            )}
            <button
              className="text-red-500 text-sm"
              onClick={() => handleDelete(task.id)}
            >
              🗑️ Delete
            </button>
          </div>
          <TaskChat taskId={task.id} user={user} />
        </div>
      ));
  };

  // If not logged in, show login page
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <nav className="bg-white p-4 mb-6 shadow flex justify-between items-center">
  <div className="flex items-center gap-4">
    <h1 className="text-xl font-bold text-blue-600">CollabBoard 🚀</h1>
    <span className="text-sm text-gray-700">Welcome, {user} 👋</span>
  </div>
  <button
    onClick={logout}
    className="bg-red-500 text-white px-4 py-1 rounded text-sm"
  >
    Logout
  </button>
</nav>


      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">➕ Add New Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            <option value="todo">Todo</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input
            type="text"
            placeholder="Assigned to"
            value={form.assignedTo}
            onChange={(e) =>
              setForm({ ...form, assignedTo: e.target.value })
            }
            className="border px-3 py-2 rounded"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <input
            type="file"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
            className="border px-3 py-2 rounded"
          />
        </div>
        <button
          onClick={handleAddTask}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h2 className="text-lg font-bold mb-2 text-blue-600">📋 Todo</h2>
          {renderTasks("todo")}
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2 text-yellow-600">
            🔧 In Progress
          </h2>
          {renderTasks("inprogress")}
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2 text-green-600">✅ Done</h2>
          {renderTasks("done")}
        </div>
      </div>
    </div>
  );
};

export default App;
