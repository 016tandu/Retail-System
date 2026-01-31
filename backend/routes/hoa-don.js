const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all invoices
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "HOA_DON"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single invoice by MaHD
router.get('/:maHD', async (req, res) => {
    try {
        const { maHD } = req.params;
        const { rows } = await db.query('SELECT * FROM "HOA_DON" WHERE "MaHD" = $1', [maHD]);
        if (rows.length === 0) {
            return res.status(404).send('Invoice not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new invoice
router.post('/', async (req, res) => {
    try {
        const { MaHD, NgayLap, MaNV, MaKho, TongTien } = req.body;
        if (!MaHD) {
            return res.status(400).send('MaHD is required');
        }
        const { rows } = await db.query(
            'INSERT INTO "HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [MaHD, NgayLap, MaNV, MaKho, TongTien]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) an invoice
router.put('/:maHD', async (req, res) => {
    try {
        const { maHD } = req.params;
        const { NgayLap, MaNV, MaKho, TongTien } = req.body;
        const { rows } = await db.query(
            'UPDATE "HOA_DON" SET "NgayLap" = $1, "MaNV" = $2, "MaKho" = $3, "TongTien" = $4 WHERE "MaHD" = $5 RETURNING *',
            [NgayLap, MaNV, MaKho, TongTien, maHD]
        );
        if (rows.length === 0) {
            return res.status(404).send('Invoice not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE an invoice
router.delete('/:maHD', async (req, res) => {
    try {
        const { maHD } = req.params;
        // Note: Deleting an invoice might require deleting its details first,
        // depending on foreign key constraints (ON DELETE CASCADE).
        // For simplicity, we assume cascading delete is set up or details are handled separately.
        await db.query('DELETE FROM "CT_HOA_DON" WHERE "MaHD" = $1', [maHD]);
        const { rows } = await db.query('DELETE FROM "HOA_DON" WHERE "MaHD" = $1 RETURNING *', [maHD]);
        if (rows.length === 0) {
            return res.status(404).send('Invoice not found');
        }
        res.status(200).send(`Invoice with MaHD ${maHD} and its details deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
