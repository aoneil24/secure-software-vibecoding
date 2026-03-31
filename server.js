const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

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

function isValidTitle(title) {
  if (typeof title !== "string") return false;
  if (title.trim().length === 0 || title.length > 100) return false;
  return /^[a-zA-Z0-9\s.,!?'"\-]+$/.test(title);
}

function isValidAuthor(author) {
  if (typeof author !== "string") return false;
  if (author.trim().length === 0 || author.length > 50) return false;
  return /^[a-zA-Z0-9\s.\-']+$/.test(author);
}

function isValidContent(content) {
  if (typeof content !== "string") return false;
  if (content.trim().length === 0 || content.length > 500) return false;
  return true;
}

app.get("/api/notes", (req, res) => {
  const notes = getNotes();
  res.json(notes);
});

app.post("/api/notes", (req, res) => {
  const { title, author, content } = req.body;

  if (!isValidTitle(title)) {
    return res.status(400).json({
      error: "Invalid title."
    });
  }

  if (!isValidAuthor(author)) {
    return res.status(400).json({
      error: "Invalid author."
    });
  }

  if (!isValidContent(content)) {
    return res.status(400).json({
      error: "Invalid content."
    });
  }

  const notes = getNotes();

  const newNote = {
    id: Date.now(),
    title: title.trim(),
    content: content.trim(),
    author: author.trim()
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