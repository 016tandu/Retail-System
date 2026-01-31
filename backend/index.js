require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Import Routes
const sanPhamRoutes = require('./routes/san-pham');
const nhaCungCapRoutes = require('./routes/nha-cung-cap');
const khoRoutes = require('./routes/kho');
const nhanVienRoutes = require('./routes/nhan-vien');
const hoaDonRoutes = require('./routes/hoa-don');
const ctHoaDonRoutes = require('./routes/ct-hoa-don');
const phieuNhapRoutes = require('./routes/phieu-nhap');
const ctPhieuNhapRoutes = require('./routes/ct-phieu-nhap');
const tonKhoRoutes = require('./routes/ton-kho');

// Use Routes
app.use('/san-pham', sanPhamRoutes);
app.use('/nha-cung-cap', nhaCungCapRoutes);
app.use('/kho', khoRoutes);
app.use('/nhan-vien', nhanVienRoutes);
app.use('/hoa-don', hoaDonRoutes);
app.use('/ct-hoa-don', ctHoaDonRoutes);
app.use('/phieu-nhap', phieuNhapRoutes);
app.use('/ct-phieu-nhap', ctPhieuNhapRoutes);
app.use('/ton-kho', tonKhoRoutes);


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
