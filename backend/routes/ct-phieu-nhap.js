const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all goods receipt details for a specific receipt
router.get('/:maPN', async (req, res) => {
    try {
        const { maPN } = req.params;
        const { rows } = await db.query('SELECT * FROM "CT_PHIEU_NHAP" WHERE "MaPN" = $1', [maPN]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a specific goods receipt detail
router.get('/:maPN/:maSP', async (req, res) => {
    try {
        const { maPN, maSP } = req.params;
        const { rows } = await db.query('SELECT * FROM "CT_PHIEU_NHAP" WHERE "MaPN" = $1 AND "MaSP" = $2', [maPN, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt detail not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new goods receipt detail
router.post('/', async (req, res) => {
    try {
        const { MaPN, MaSP, SoLuong, DonGiaNhap, ThanhTien } = req.body;
        if (!MaPN || !MaSP) {
            return res.status(400).send('MaPN and MaSP are required');
        }
        const { rows } = await db.query(
            'INSERT INTO "CT_PHIEU_NHAP" ("MaPN", "MaSP", "SoLuong", "DonGiaNhap", "ThanhTien") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [MaPN, MaSP, SoLuong, DonGiaNhap, ThanhTien]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a specific goods receipt detail
router.put('/:maPN/:maSP', async (req, res) => {
    try {
        const { maPN, maSP } = req.params;
        const { SoLuong, DonGiaNhap, ThanhTien } = req.body;
        const { rows } = await db.query(
            'UPDATE "CT_PHIEU_NHAP" SET "SoLuong" = $1, "DonGiaNhap" = $2, "ThanhTien" = $3 WHERE "MaPN" = $4 AND "MaSP" = $5 RETURNING *',
            [SoLuong, DonGiaNhap, ThanhTien, maPN, maSP]
        );
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt detail not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// DELETE a specific goods receipt detail
router.delete('/:maPN/:maSP', async (req, res) => {
    try {
        const { maPN, maSP } = req.params;
        const { rows } = await db.query('DELETE FROM "CT_PHIEU_NHAP" WHERE "MaPN" = $1 AND "MaSP" = $2 RETURNING *', [maPN, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt detail not found');
        }
        res.status(200).send('Goods receipt detail deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
