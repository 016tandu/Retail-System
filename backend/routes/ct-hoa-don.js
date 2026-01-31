const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all invoice details for a specific invoice
router.get('/:maHD', async (req, res) => {
    try {
        const { maHD } = req.params;
        const { rows } = await db.query('SELECT * FROM "CT_HOA_DON" WHERE "MaHD" = $1', [maHD]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a specific invoice detail
router.get('/:maHD/:maSP', async (req, res) => {
    try {
        const { maHD, maSP } = req.params;
        const { rows } = await db.query('SELECT * FROM "CT_HOA_DON" WHERE "MaHD" = $1 AND "MaSP" = $2', [maHD, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Invoice detail not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new invoice detail
router.post('/', async (req, res) => {
    try {
        const { MaHD, MaSP, SoLuong, DonGia, ThanhTien } = req.body;
        if (!MaHD || !MaSP) {
            return res.status(400).send('MaHD and MaSP are required');
        }
        const { rows } = await db.query(
            'INSERT INTO "CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [MaHD, MaSP, SoLuong, DonGia, ThanhTien]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a specific invoice detail
router.put('/:maHD/:maSP', async (req, res) => {
    try {
        const { maHD, maSP } = req.params;
        const { SoLuong, DonGia, ThanhTien } = req.body;
        const { rows } = await db.query(
            'UPDATE "CT_HOA_DON" SET "SoLuong" = $1, "DonGia" = $2, "ThanhTien" = $3 WHERE "MaHD" = $4 AND "MaSP" = $5 RETURNING *',
            [SoLuong, DonGia, ThanhTien, maHD, maSP]
        );
        if (rows.length === 0) {
            return res.status(404).send('Invoice detail not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// DELETE a specific invoice detail
router.delete('/:maHD/:maSP', async (req, res) => {
    try {
        const { maHD, maSP } = req.params;
        const { rows } = await db.query('DELETE FROM "CT_HOA_DON" WHERE "MaHD" = $1 AND "MaSP" = $2 RETURNING *', [maHD, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Invoice detail not found');
        }
        res.status(200).send('Invoice detail deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
