// --------------------
// 1) Imports
// --------------------
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// --------------------
// 2) Database
// --------------------
const DB_PATH = path.resolve(__dirname, "blog.db");
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error("❌ DB Error:", err.message);
  else console.log("✅ DB connected");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// --------------------
// 3) Express setup
// --------------------
const app = express();
const PORT = 8000;
const SECRET_KEY = "your_secret_key";

app.use(cors({
  origin: "http://localhost:3000", // فرانت
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------
// 4) Multer setup for uploads
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/blogs/covers";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --------------------
// 5) Auth middleware
// --------------------
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Unauthenticated" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

// --------------------
// 6) Auth routes
// --------------------
app.get("/api", (req, res) => res.send("Blog API running"));

// Register
app.post("/api/register", (req, res) => {
  const { name, email, password, password_confirmation } = req.body;
  if (!name || !email || !password || !password_confirmation)
    return res.status(422).json({ message: "Validation error" });
  if (password !== password_confirmation)
    return res.status(422).json({ message: "Passwords do not match" });

  const hashedPassword = bcrypt.hashSync(password, 8);
  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword], function (err) {
      if (err) return res.status(400).json({ message: "User already exists" });
      const token = jwt.sign({ id: this.lastID }, SECRET_KEY, { expiresIn: "1h" });
      res.status(201).json({
        status: true,
        message: "User registered",
        data: { user: { id: this.lastID, name, email }, token, token_type: "Bearer" }
      });
    });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(422).json({ message: "Validation error" });

  db.get(`SELECT * FROM users WHERE email=?`, [email], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      status: true,
      message: "Login successful",
      data: { user: { id: user.id, name: user.name, email: user.email }, token, token_type: "Bearer" }
    });
  });
});

// Logout
app.post("/api/logout", authenticate, (req, res) => {
  res.json({ status: true, message: "Logged out" });
});

// Get profile
app.get("/api/me", authenticate, (req, res) => {
  db.get(`SELECT id, name, email FROM users WHERE id=?`, [req.userId], (err, user) => {
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ status: true, data: { user } });
  });
});

// Update profile
app.put("/api/update-profile", authenticate, (req, res) => {
  const { name, email, password, password_confirmation } = req.body;
  db.get(`SELECT * FROM users WHERE id=?`, [req.userId], (err, user) => {
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedName = name || user.name;
    const updatedEmail = email || user.email;
    let updatedPassword = user.password;
    if (password) {
      if (password !== password_confirmation)
        return res.status(422).json({ message: "Passwords do not match" });
      updatedPassword = bcrypt.hashSync(password, 8);
    }

    db.run(`UPDATE users SET name=?, email=?, password=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [updatedName, updatedEmail, updatedPassword, req.userId],
      function (err) {
        if (err) return res.status(400).json({ message: err.message });
        res.json({ status: true, message: "Profile updated", data: { user: { id: req.userId, name: updatedName, email: updatedEmail } } });
      });
  });
});

// --------------------
// 7) Blog routes
// --------------------

// List all blogs
app.get("/api/blogs", (req, res) => {
  db.all(`SELECT p.id, p.title, p.description, p.cover_image, u.name as user_name, p.created_at
          FROM posts p LEFT JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC`, [],
    (err, rows) => {
      if (err) return res.status(400).json({ message: err.message });
      const data = rows.map(r => ({
        id: r.id,
        title: r.title,
        slug: r.title.toLowerCase().replace(/\s+/g, "-"),
        description: r.description,
        cover_image: r.cover_image ? `http://localhost:${PORT}/${r.cover_image}` : null,
        user: { name: r.user_name || "Unknown" },
        created_at: r.created_at
      }));
      res.json({ status: true, message: "Blogs retrieved", data });
    });
});

// List my blogs
app.get("/api/my-blogs", authenticate, (req, res) => {
  db.all(`SELECT p.id, p.title, p.description, p.cover_image, p.created_at, u.name as user_name
          FROM posts p LEFT JOIN users u ON p.user_id=u.id
          WHERE p.user_id=? ORDER BY p.created_at DESC`, [req.userId],
    (err, rows) => {
      if (err) return res.status(400).json({ message: err.message });
      const data = rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        cover_image: r.cover_image ? `http://localhost:${PORT}/${r.cover_image}` : null,
        user: { name: r.user_name || "Unknown" },
        created_at: r.created_at
      }));
      res.json({ status: true, data });
    });
});

// Create blog
app.post("/api/blogs", authenticate, upload.single("cover_image"), (req, res) => {
  const { title, description } = req.body;
  const cover_image = req.file ? req.file.path.replace(/\\/g, "/") : null;
  if (!title || !description) return res.status(422).json({ message: "Validation error" });

  db.run(`INSERT INTO posts (title, description, cover_image, user_id) VALUES (?, ?, ?, ?)`,
    [title, description, cover_image, req.userId],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });
      res.status(201).json({
        status: true,
        message: "Blog created",
        data: {
          id: this.lastID,
          title,
          description,
          cover_image: cover_image ? `http://localhost:${PORT}/${cover_image}` : null,
          user: { name: "You" }
        }
      });
    });
});

// Update blog
app.put("/api/blogs/:id", authenticate, upload.single("cover_image"), (req, res) => {
  const blogId = req.params.id;
  const { title, description } = req.body;

  db.get(`SELECT * FROM posts WHERE id=? AND user_id=?`, [blogId, req.userId], (err, blog) => {
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    const cover_image = req.file ? req.file.path.replace(/\\/g, "/") : blog.cover_image;

    db.run(`UPDATE posts SET title=?, description=?, cover_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [title || blog.title, description || blog.description, cover_image, blogId],
      function (err) {
        if (err) return res.status(400).json({ message: err.message });
        res.json({ status: true, message: "Blog updated" });
      });
  });
});

// Delete blog
app.delete("/api/blogs/:id", authenticate, (req, res) => {
  const blogId = req.params.id;

  db.get(`SELECT * FROM posts WHERE id=? AND user_id=?`, [blogId, req.userId], (err, blog) => {
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    db.run(`DELETE FROM posts WHERE id=?`, [blogId], function (err) {
      if (err) return res.status(400).json({ message: err.message });
      res.json({ status: true, message: "Blog deleted" });
    });
  });
});

// --------------------
// 8) Start server
// --------------------
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}/api`));
