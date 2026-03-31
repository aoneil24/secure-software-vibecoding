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
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading notes:", error.message);
    return [];
  }
}

function saveNotes(notes) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(notes, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving notes:", error.message);
    return false;
  }
}

function isValidTitle(title) {
  if (typeof title !== "string") return false;
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  return true;
}

function isValidAuthor(author) {
  if (typeof author !== "string") return false;
  const trimmed = author.trim();
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  return true;
}

function isValidContent(content) {
  if (typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return false;
  return true;
}

app.get("/api/notes", (req, res) => {
  try {
    const notes = getNotes();
    res.json(notes);
  } catch (error) {
    console.error("GET /api/notes failed:", error.message);
    res.status(500).json({ error: "Failed to load notes." });
  }
});

app.post("/api/notes", (req, res) => {
  try {
    const { title, author, content } = req.body;

    if (!isValidTitle(title)) {
      return res.status(400).json({
        error: "Invalid title. Title is required and must be under 100 characters."
      });
    }

    if (!isValidAuthor(author)) {
      return res.status(400).json({
        error: "Invalid author. Author is required and must be under 50 characters."
      });
    }

    if (!isValidContent(content)) {
      return res.status(400).json({
        error: "Invalid content. Content is required and must be under 500 characters."
      });
    }

    const notes = getNotes();

    const newNote = {
      id: Date.now(),
      title: title.trim(),
      author: author.trim(),
      content: content.trim()
    };

    notes.push(newNote);

    const saved = saveNotes(notes);
    if (!saved) {
      return res.status(500).json({ error: "Failed to save note." });
    }

    res.json(newNote);
  } catch (error) {
    console.error("POST /api/notes failed:", error.message);
    res.status(500).json({ error: "Failed to add note." });
  }
});

app.delete("/api/notes/:id", (req, res) => {
  try {
    const token = req.headers["x-admin-token"];

    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: "Invalid admin token" });
    }

    let notes = getNotes();
    notes = notes.filter(note => note.id != req.params.id);

    const saved = saveNotes(notes);
    if (!saved) {
      return res.status(500).json({ error: "Failed to delete note." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notes/:id failed:", error.message);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});