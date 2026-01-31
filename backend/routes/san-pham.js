const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "SAN_PHAM"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single product by MaSP
router.get('/:maSP', async (req, res) => {
    try {
        const { maSP } = req.params;
        const { rows } = await db.query('SELECT * FROM "SAN_PHAM" WHERE "MaSP" = $1', [maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new product
router.post('/', async (req, res) => {
    try {
        const { MaSP, TenSP, DonViTinh, GiaNiemYet } = req.body;
        if (!MaSP) {
            return res.status(400).send('MaSP is required');
        }
        const { rows } = await db.query(
            'INSERT INTO "SAN_PHAM" ("MaSP", "TenSP", "DonViTinh", "GiaNiemYet") VALUES ($1, $2, $3, $4) RETURNING *',
            [MaSP, TenSP, DonViTinh, GiaNiemYet]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a product
router.put('/:maSP', async (req, res) => {
    try {
        const { maSP } = req.params;
        const { TenSP, DonViTinh, GiaNiemYet } = req.body;
        const { rows } = await db.query(
            'UPDATE "SAN_PHAM" SET "TenSP" = $1, "DonViTinh" = $2, "GiaNiemYet" = $3 WHERE "MaSP" = $4 RETURNING *',
            [TenSP, DonViTinh, GiaNiemYet, maSP]
        );
        if (rows.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE a product
router.delete('/:maSP', async (req, res) => {
    try {
        const { maSP } = req.params;
        const { rows } = await db.query('DELETE FROM "SAN_PHAM" WHERE "MaSP" = $1 RETURNING *', [maSP]);
        if (rows.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).send(`Product with MaSP ${maSP} deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
