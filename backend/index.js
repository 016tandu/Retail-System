require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Import Routes
const sanPhamRoutes = require('./routes/san-pham');

// Use Routes
app.use('/san-pham', sanPhamRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('TechStore Backend Server is running!');
});

// Database connection test route
app.get('/db-test', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful!',
      time: rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Database connection failed!',
      error: err.message,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
