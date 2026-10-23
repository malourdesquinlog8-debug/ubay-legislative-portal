import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Multer - accept PDF + IMAGES for News & Members
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF and images
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, true); // allow all for now
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

const db = new Database('lgu_portal.db');

// ===== CREATE ALL TABLES =====
db.exec(`DROP TABLE IF EXISTS legislations`);
db.exec(`
  CREATE TABLE legislations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    number TEXT,
    description TEXT,
    author TEXT,
    status TEXT,
    date_approved TEXT,
    file_path TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'admin'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sb_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    position TEXT,
    bio TEXT,
    committee TEXT,
    photo TEXT,
    facebook TEXT,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS news_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    category TEXT,
    date TEXT,
    location TEXT,
    image TEXT,
    file_path TEXT,
    author TEXT,
    status TEXT DEFAULT 'Published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    status TEXT DEFAULT 'Unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS public_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    comment TEXT,
    legislation_id INTEGER,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    user TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed admin
const existing = db.prepare('SELECT * FROM users WHERE email = ?').get('Albert@lgu.gov.ph') as any;
if (!existing) {
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run('Albert@lgu.gov.ph', 'admin123', 'Albert', 'admin');
}

console.log('✅ All tables ready');

// ===== LOGIN =====
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.password !== password) return res.status(401).json({ message: 'Invalid password' });
    const token = `admin-token-${Date.now()}`;
    res.json({ success: true, token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ===== UPLOAD =====
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
  const filePath = `/uploads/${req.file.filename}`;
  console.log('✅ Uploaded:', filePath);
  res.json({ success: true, filePath, fileName: req.file.filename, url: `http://localhost:${PORT}${filePath}` });
});

// ===== LEGISLATIONS =====
app.get('/api/legislations', (req, res) => {
  res.json(db.prepare('SELECT * FROM legislations ORDER BY created_at DESC').all());
});
app.post('/api/legislations', (req, res) => {
  try {
    const { title, type, number, description, author, status, date_approved, file_path, content } = req.body;
    const result = db.prepare(`INSERT INTO legislations (title, type, number, description, author, status, date_approved, file_path, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title, type, number, description, author, status, date_approved, file_path, content);
    db.prepare('INSERT INTO activity_logs (action, user, details) VALUES (?, ?, ?)').run('Created legislation', 'Albert', title);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/legislations/:id', (req, res) => {
  db.prepare('DELETE FROM legislations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== SB MEMBERS =====
app.get('/api/members', (req, res) => { res.json(db.prepare('SELECT * FROM sb_members ORDER BY created_at DESC').all()); });
app.get('/api/sb-members', (req, res) => { res.json(db.prepare('SELECT * FROM sb_members ORDER BY created_at DESC').all()); });
app.post('/api/members', (req, res) => {
  try {
    const { name, position, bio, committee, photo, facebook, email, phone } = req.body;
    const result = db.prepare(`INSERT INTO sb_members (name, position, bio, committee, photo, facebook, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(name, position, bio, committee, photo, facebook, email, phone);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});
app.post('/api/sb-members', (req, res) => {
  try {
    const { name, position, bio, committee, photo, facebook, email, phone } = req.body;
    const result = db.prepare(`INSERT INTO sb_members (name, position, bio, committee, photo, facebook, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(name, position, bio, committee, photo, facebook, email, phone);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});
app.delete('/api/members/:id', (req, res) => { db.prepare('DELETE FROM sb_members WHERE id = ?').run(req.params.id); res.json({ success: true }); });
app.delete('/api/sb-members/:id', (req, res) => { db.prepare('DELETE FROM sb_members WHERE id = ?').run(req.params.id); res.json({ success: true }); });

// ===== NEWS & EVENTS =====
app.get('/api/news', (req, res) => { res.json(db.prepare('SELECT * FROM news_events ORDER BY created_at DESC').all()); });
app.get('/api/news-events', (req, res) => { res.json(db.prepare('SELECT * FROM news_events ORDER BY created_at DESC').all()); });
app.get('/api/events', (req, res) => { res.json(db.prepare('SELECT * FROM news_events ORDER BY created_at DESC').all()); });
app.post('/api/news', (req, res) => {
  try {
    const { title, content, category, date, location, image, file_path, author, status } = req.body;
    const result = db.prepare(`INSERT INTO news_events (title, content, category, date, location, image, file_path, author, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title, content, category, date, location, image, file_path, author, status || 'Published');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) { console.error(err); res.status(500).json({ message: err.message }); }
});
app.post('/api/news-events', (req, res) => {
  try {
    const { title, content, category, date, location, image, file_path, author, status } = req.body;
    const result = db.prepare(`INSERT INTO news_events (title, content, category, date, location, image, file_path, author, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title, content, category, date, location, image, file_path, author, status || 'Published');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});
app.delete('/api/news/:id', (req, res) => { db.prepare('DELETE FROM news_events WHERE id = ?').run(req.params.id); res.json({ success: true }); });
app.delete('/api/news-events/:id', (req, res) => { db.prepare('DELETE FROM news_events WHERE id = ?').run(req.params.id); res.json({ success: true }); });

// ===== OTHER AREAS =====
app.get('/api/contact-messages', (req, res) => { res.json(db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all()); });
app.get('/api/public-comments', (req, res) => { res.json(db.prepare('SELECT * FROM public_comments ORDER BY created_at DESC').all()); });
app.get('/api/activity-logs', (req, res) => { res.json(db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50').all()); });
app.get('/api/logs', (req, res) => { res.json(db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50').all()); });
app.get('/api/users', (req, res) => { res.json(db.prepare('SELECT id, email, name, role, created_at FROM users').all()); });

// STATS
app.get('/api/stats', (req, res) => {
  const legCount = (db.prepare('SELECT COUNT(*) as c FROM legislations').get() as any).c;
  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM sb_members').get() as any).c;
  const newsCount = (db.prepare('SELECT COUNT(*) as c FROM news_events').get() as any).c;
  res.json({ legislations: legCount, members: memberCount, news: newsCount, total_legislations: legCount });
});
app.get('/api/admin/stats', (req, res) => {
  const legCount = (db.prepare('SELECT COUNT(*) as c FROM legislations').get() as any).c;
  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM sb_members').get() as any).c;
  const newsCount = (db.prepare('SELECT COUNT(*) as c FROM news_events').get() as any).c;
  res.json({ legislations: legCount, members: memberCount, news: newsCount, total_legislations: legCount, sessions: 0, views: 0 });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ All APIs ready: legislations, members, news, etc.`);
  console.log(`🔑 Login: Albert@lgu.gov.ph / admin123`);
});