const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all warehouses
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "KHO"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single warehouse by MaKho
router.get('/:maKho', async (req, res) => {
    try {
        const { maKho } = req.params;
        const { rows } = await db.query('SELECT * FROM "KHO" WHERE "MaKho" = $1', [maKho]);
        if (rows.length === 0) {
            return res.status(404).send('Warehouse not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new warehouse
router.post('/', async (req, res) => {
    try {
        const { MaKho, TenKho, KhuVuc } = req.body;
        if (!MaKho) {
            return res.status(400).send('MaKho is required');
        }
        const { rows } = await db.query(
            'INSERT INTO "KHO" ("MaKho", "TenKho", "KhuVuc") VALUES ($1, $2, $3) RETURNING *',
            [MaKho, TenKho, KhuVuc]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a warehouse
router.put('/:maKho', async (req, res) => {
    try {
        const { maKho } = req.params;
        const { TenKho, KhuVuc } = req.body;
        const { rows } = await db.query(
            'UPDATE "KHO" SET "TenKho" = $1, "KhuVuc" = $2 WHERE "MaKho" = $3 RETURNING *',
            [TenKho, KhuVuc, maKho]
        );
        if (rows.length === 0) {
            return res.status(404).send('Warehouse not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE a warehouse
router.delete('/:maKho', async (req, res) => {
    try {
        const { maKho } = req.params;
        const { rows } = await db.query('DELETE FROM "KHO" WHERE "MaKho" = $1 RETURNING *', [maKho]);
        if (rows.length === 0) {
            return res.status(404).send('Warehouse not found');
        }
        res.status(200).send(`Warehouse with MaKho ${maKho} deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
