// server/server.js

// Load environment variables from .env file FIRST
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express(); // <-- This line is crucial!
const port = process.env.API_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database!');
    connection.release(); // Corrected typo: 'releas8e()' -> 'release()'
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err.message);
    process.exit(1);
  });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// --- User Authentication Routes ---
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or Email already exists.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    if (result.affectedRows === 1) {
      res.status(201).json({ message: 'User registered successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: 'Login successful!',
      user: { id: user.id, username: user.username, email: user.email },
      token: token
    });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// --- Book Management Routes (Updated/Added) ---

// Get all books
app.get('/books', authenticateToken, async (req, res) => {
  const userId = req.user.id; // Get the user's ID from the authenticated request
  try {
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE user_id = ?', // Filter by user_id
      [userId]
    );
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Internal server error fetching books.' });
  }
});

// Add a new book (Updated for 'recommendation' and 'user_id')
app.post('/books', authenticateToken, async (req, res) => {
  const { title, author, recommendation, published_year } = req.body;
  const added_by_user_id = req.user.id; // Get user ID from the token

  if (!title || !author) {
    return res.status(400).json({ message: 'Title and Author are required.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO books (title, author, recommendation, published_year, added_by_user_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, author, recommendation || null, published_year || null, added_by_user_id, added_by_user_id] // Set both added_by_user_id and user_id
    );

    if (result.affectedRows === 1) {
      res.status(201).json({ message: 'Book added successfully!', bookId: result.insertId });
    } else {
      res.status(500).json({ message: 'Failed to add book.' });
    }
  } catch (error) {
    console.error('Error adding book:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Recommendation value already exists.' });
    }
    res.status(500).json({ message: 'Internal server error adding book.' });
  }
});

// Update an existing book (Ensure user can only update their own books)
app.put('/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, recommendation, published_year } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: 'Title and Author are required.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE books SET title = ?, author = ?, recommendation = ?, published_year = ? WHERE id = ? AND user_id = ?',
      [title, author, recommendation || null, published_year || null, id, req.user.id] // Added user_id to WHERE clause
    );

    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Book updated successfully!' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Book not found or unauthorized to update.' });
    } else {
      res.status(500).json({ message: 'Failed to update book.' });
    }
  } catch (error) {
    console.error('Error updating book:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Recommendation value already exists.' });
    }
    res.status(500).json({ message: 'Internal server error updating book.' });
  }
});

// Delete a book by ID (Ensure user can only delete their own books)
app.delete('/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM books WHERE id = ? AND user_id = ?', // Added user_id to WHERE clause
      [id, req.user.id]
    );
    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Book deleted successfully!' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Book not found or unauthorized to delete.' });
    } else {
      res.status(500).json({ message: 'Failed to delete book.' });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Internal server error deleting book.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});





















// server/server.js
{/*
const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based API for async/await
const cors = require('cors'); // For handling Cross-Origin Resource Sharing
const bcrypt = require('bcrypt'); // bcrypt for password hashing

const app = express();
const port = 5000; // The port your backend server will run on

// Middleware
app.use(cors()); // Enable CORS for all routes, allowing your React app to make requests
app.use(express.json()); // Enable Express to parse JSON formatted request bodies

// Database connection configuration
// IMPORTANT: Replace 'YOUR_MYSQL_USER', 'YOUR_MYSQL_PASSWORD' with your actual MySQL credentials
// For XAMPP, the default user is 'root' and password is often empty.
const dbConfig = {
  host: 'localhost', // Your MySQL host (usually localhost for XAMPP)
  user: 'root',      // Your MySQL username
  password: '',      // Your MySQL password (empty by default for XAMPP root)
  database: 'employees', // The database you created in phpMyAdmin
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err.message);
    // Exit the process if database connection fails, as the app won't function
    process.exit(1);
  });

// Register route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // IMPORTANT: In a real-world application, you MUST hash the password
  // using a library like bcrypt. Storing plain text passwords is a security risk.
  // To use bcrypt:
  // 1. npm install bcrypt
  // 2. Uncomment 'const bcrypt = require('bcrypt');' at the top
  // 3. Replace 'password' with 'hashedPassword' in the INSERT query.
 const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  try {
    // Check if user already exists (by username or email)
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or Email already exists.' });
    }

    // Insert new user into the database
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword] // Using plain password for demonstration. REPLACE WITH hashedPassword!
    );

    // Check if the insertion was successful
    if (result.affectedRows === 1) {
      res.status(201).json({ message: 'User registered successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user by email
    const [users] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // IMPORTANT: In a real-world app, you MUST compare the provided password
    // with the HASHED password stored in the database using bcrypt.compare().
    // Example:
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) { return res.status(401).json({ message: 'Invalid email or password.' }); }

    // For this example, we are comparing plain text passwords.
    // This is INSECURE and should NEVER be used in production.
   // if (password !== user.password) {
    //  return res.status(401).json({ message: 'Invalid email or password.' });
    //}

    // If credentials are valid
    // In a real app, you would generate a JWT token here and send it back to the client.
    res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username, email: user.email } });

  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
*/}