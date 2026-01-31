const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all suppliers
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "NHA_CUNG_CAP"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single supplier by MaNCC
router.get('/:maNCC', async (req, res) => {
    try {
        const { maNCC } = req.params;
        const { rows } = await db.query('SELECT * FROM "NHA_CUNG_CAP" WHERE "MaNCC" = $1', [maNCC]);
        if (rows.length === 0) {
            return res.status(404).send('Supplier not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new supplier
router.post('/', async (req, res) => {
    try {
        const { MaNCC, TenNCC, DiaChi, SDT } = req.body;
        if (!MaNCC || !TenNCC) {
            return res.status(400).send('MaNCC and TenNCC are required');
        }
        const { rows } = await db.query(
            'INSERT INTO "NHA_CUNG_CAP" ("MaNCC", "TenNCC", "DiaChi", "SDT") VALUES ($1, $2, $3, $4) RETURNING *',
            [MaNCC, TenNCC, DiaChi, SDT]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) a supplier
router.put('/:maNCC', async (req, res) => {
    try {
        const { maNCC } = req.params;
        const { TenNCC, DiaChi, SDT } = req.body;
        const { rows } = await db.query(
            'UPDATE "NHA_CUNG_CAP" SET "TenNCC" = $1, "DiaChi" = $2, "SDT" = $3 WHERE "MaNCC" = $4 RETURNING *',
            [TenNCC, DiaChi, SDT, maNCC]
        );
        if (rows.length === 0) {
            return res.status(404).send('Supplier not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE a supplier
router.delete('/:maNCC', async (req, res) => {
    try {
        const { maNCC } = req.params;
        const { rows } = await db.query('DELETE FROM "NHA_CUNG_CAP" WHERE "MaNCC" = $1 RETURNING *', [maNCC]);
        if (rows.length === 0) {
            return res.status(404).send('Supplier not found');
        }
        res.status(200).send(`Supplier with MaNCC ${maNCC} deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
