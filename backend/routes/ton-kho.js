const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all inventory records
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "TON_KHO"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET inventory for a specific warehouse and product
router.get('/:maKho/:maSP', async (req, res) => {
    try {
        const { maKho, maSP } = req.params;
        const { rows } = await db.query('SELECT * FROM "TON_KHO" WHERE "MaKho" = $1 AND "MaSP" = $2', [maKho, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Inventory record not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new inventory record
router.post('/', async (req, res) => {
    try {
        const { MaKho, MaSP, SoLuongTon, LastUpdated } = req.body;
        if (!MaKho || !MaSP) {
            return res.status(400).send('MaKho and MaSP are required');
        }
        const { rows } = await db.query(
            'INSERT INTO "TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") VALUES ($1, $2, $3, $4) RETURNING *',
            [MaKho, MaSP, SoLuongTon, LastUpdated]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) an inventory record
router.put('/:maKho/:maSP', async (req, res) => {
    try {
        const { maKho, maSP } = req.params;
        const { SoLuongTon, LastUpdated } = req.body;
        const { rows } = await db.query(
            'UPDATE "TON_KHO" SET "SoLuongTon" = $1, "LastUpdated" = $2 WHERE "MaKho" = $3 AND "MaSP" = $4 RETURNING *',
            [SoLuongTon, LastUpdated, maKho, maSP]
        );
        if (rows.length === 0) {
            return res.status(404).send('Inventory record not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE an inventory record
router.delete('/:maKho/:maSP', async (req, res) => {
    try {
        const { maKho, maSP } = req.params;
        const { rows } = await db.query('DELETE FROM "TON_KHO" WHERE "MaKho" = $1 AND "MaSP" = $2 RETURNING *', [maKho, maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Inventory record not found');
        }
        res.status(200).send('Inventory record deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
