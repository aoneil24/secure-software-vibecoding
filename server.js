const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const ADMIN_TOKEN = "super-secret-admin-token";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataFile = path.join(__dirname, "data", "notes.json");

function getNotes() {
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
}

function saveNotes(notes) {
  fs.writeFileSync(dataFile, JSON.stringify(notes, null, 2));
}

app.get("/api/notes", (req, res) => {
  const notes = getNotes();
  res.json(notes);
});

app.post("/api/notes", (req, res) => {
  const notes = getNotes();

  const newNote = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  };

  notes.push(newNote);
  saveNotes(notes);

  res.json(newNote);
});

app.delete("/api/notes/:id", (req, res) => {
  const token = req.headers["x-admin-token"];

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Invalid admin token" });
  }

  let notes = getNotes();
  notes = notes.filter(note => note.id != req.params.id);
  saveNotes(notes);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});