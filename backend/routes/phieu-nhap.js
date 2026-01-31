const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all goods receipts
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "PHIEU_NHAP"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single goods receipt by MaPN
router.get('/:maPN', async (req, res) => {
    try {
        const { maPN } = req.params;
        const { rows } = await db.query('SELECT * FROM "PHIEU_NHAP" WHERE "MaPN" = $1', [maPN]);
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new goods receipt
router.post('/', async (req, res) => {
    try {
        const { MaPN, NgayNhap, MaNCC, MaKho, TongTienNhap } = req.body;
        if (!MaPN || !MaNCC || !MaKho) {
            return res.status(400).send('MaPN, MaNCC, and MaKho are required');
        }
        const { rows } = await db.query(
            'INSERT INTO "PHIEU_NHAP" ("MaPN", "NgayNhap", "MaNCC", "MaKho", "TongTienNhap") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [MaPN, NgayNhap, MaNCC, MaKho, TongTienNhap]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a goods receipt
router.put('/:maPN', async (req, res) => {
    try {
        const { maPN } = req.params;
        const { NgayNhap, MaNCC, MaKho, TongTienNhap } = req.body;
        const { rows } = await db.query(
            'UPDATE "PHIEU_NHAP" SET "NgayNhap" = $1, "MaNCC" = $2, "MaKho" = $3, "TongTienNhap" = $4 WHERE "MaPN" = $5 RETURNING *',
            [NgayNhap, MaNCC, MaKho, TongTienNhap, maPN]
        );
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE a goods receipt
router.delete('/:maPN', async (req, res) => {
    try {
        const { maPN } = req.params;
        // Similar to invoices, we assume cascading delete or separate handling for details
        await db.query('DELETE FROM "CT_PHIEU_NHAP" WHERE "MaPN" = $1', [maPN]);
        const { rows } = await db.query('DELETE FROM "PHIEU_NHAP" WHERE "MaPN" = $1 RETURNING *', [maPN]);
        if (rows.length === 0) {
            return res.status(404).send('Goods receipt not found');
        }
        res.status(200).send(`Goods receipt with MaPN ${maPN} and its details deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
