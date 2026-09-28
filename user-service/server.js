/**
 * User Microservice - CampusConnect
 * Lab 6: Docker & Microservices
 * Port: 3001
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

app.use(cors());
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Seed data
const defaultUsers = [
  { id: 101, name: "Alice Smith", email: "alice@campus.edu", role: "student" },
  { id: 102, name: "Bob Jones", email: "bob@campus.edu", role: "student" },
  { id: 103, name: "Charlie Brown", email: "charlie@campus.edu", role: "faculty" }
];

// Initialize database file
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

function readUsers() {
  try {
    initDB();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users:', err.message);
    return [];
  }
}

function writeUsers(users) {
  initDB();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

initDB();

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'UP',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /users - Retrieve all users
app.get('/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// GET /users/:id - Retrieve user by ID
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const users = readUsers();
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({
      error: 'User Not Found',
      message: `User with id ${id} does not exist.`
    });
  }
  res.json(user);
});

// POST /users - Create new user
app.post('/users', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Both name and email are required fields.'
    });
  }

  const users = readUsers();
  const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 101;
  const newUser = {
    id: nextId,
    name,
    email,
    role: role || 'student',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json(newUser);
});

// PUT /users/:id - Update existing user
app.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, role } = req.body;
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'User Not Found',
      message: `User with id ${id} does not exist.`
    });
  }

  users[index] = {
    ...users[index],
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    updatedAt: new Date().toISOString()
  };

  writeUsers(users);
  res.json(users[index]);
});

// DELETE /users/:id - Delete user
app.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'User Not Found',
      message: `User with id ${id} does not exist.`
    });
  }

  const deletedUser = users.splice(index, 1)[0];
  writeUsers(users);
  res.json({
    message: `User with id ${id} deleted successfully.`,
    user: deletedUser
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[User Service] running on port ${PORT}`);
});
