const form = document.getElementById("taskForm");
const responseMsg = document.getElementById("responseMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const task = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    deadline: document.getElementById("deadline").value,
    estimatedHours: parseInt(document.getElementById("estimatedHours").value),
    motivationStyle: document.getElementById("motivationStyle").value
  };

  try {
    const res = await fetch("http://localhost:8080/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });

    if (res.ok) {
      const data = await res.json();
      responseMsg.innerText = `✅ Task Created! ID: ${data.id}`;
      responseMsg.style.color = "green";
      form.reset();
      loadTasks();
    } else {
      responseMsg.innerText = "❌ Failed to create task.";
      responseMsg.style.color = "red";
    }
  } catch (err) {
    responseMsg.innerText = "❌ Error connecting to server.";
    responseMsg.style.color = "red";
  }
});

async function loadTasks() {
  try {
    const res = await fetch("http://localhost:8080/api/tasks");
    const tasks = await res.json();

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    for (const task of tasks) {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task-card";

      taskDiv.innerHTML = `
        <h3>${task.title} 
          <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
        </h3>
        <p>${task.description}</p>
        <p><strong>Deadline:</strong> ${task.deadline}</p>
        <div class="progress-bar">
          <div class="progress" id="progress-${task.id}" style="width: 0%"></div>
        </div>
        <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
        <p><strong>Motivation:</strong> ${task.motivationStyle}</p>
        <button onclick="viewSessions(${task.id})">📆 View Sessions</button>
        <div id="sessions-${task.id}" class="session-container"></div>
      `;

      taskList.appendChild(taskDiv);
    }
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

async function deleteTask(taskId) {
  try {
    const res = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      responseMsg.innerText = "🗑️ Task deleted.";
      responseMsg.style.color = "green";
      loadTasks(); // Refresh the task list
    } else {
      responseMsg.innerText = "❌ Failed to delete task.";
      responseMsg.style.color = "red";
    }
  } catch (err) {
    responseMsg.innerText = "❌ Error deleting task.";
    responseMsg.style.color = "red";
    console.error("Error deleting task:", err);
  }
}

async function viewSessions(taskId) {
  try {
    const [taskRes, sessionsRes] = await Promise.all([
      fetch(`http://localhost:8080/api/tasks/${taskId}`),
      fetch(`http://localhost:8080/api/tasks/${taskId}/sessions`)
    ]);

    if (!taskRes.ok || !sessionsRes.ok) throw new Error("Data fetch error");

    const task = await taskRes.json();
    const sessions = await sessionsRes.json();

    const container = document.getElementById(`sessions-${taskId}`);
    container.innerHTML = ""; // Clear old content

    if (sessions.length === 0) {
      container.innerHTML = "<p>No sessions yet.</p>";
      return;
    }

    const ul = document.createElement("ul");
    let completedCount = 0;

    sessions.forEach(session => {
      const li = document.createElement("li");
      const time = new Date(session.sessionTime).toLocaleString();
      const icon = session.completed ? "✅" : "⏳";
      if (session.completed) completedCount++;

      li.innerHTML = `🕒 ${time} - ${icon} ${session.completed ? "Done" : "Pending"}`;
      ul.appendChild(li);
    });

    container.appendChild(ul);

    // Update progress bar
    const percent = Math.round((completedCount / sessions.length) * 100);
    const progressBar = document.getElementById(`progress-${taskId}`);
    if (progressBar) progressBar.style.width = `${percent}%`;

    // Motivation messages
    const comments = {
      funny: "😂 Remember, you're racing against the clock!",
      strict: "💢 No excuses. Just do it.",
      soft: "🧘 Take your time, but don’t forget the goal!"
    };

    const msg = document.createElement("p");
    msg.className = "reminder-msg";
    msg.textContent = comments[task.motivationStyle] || "";
    container.appendChild(msg);

    // Optional: Play sound
    const audio = document.getElementById("reminderAudio");
    if (audio) audio.play();

  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

// Initial load
loadTasks();