const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all employees
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "NHAN_VIEN"');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET a single employee by MaNV
router.get('/:maNV', async (req, res) => {
    try {
        const { maNV } = req.params;
        const { rows } = await db.query('SELECT * FROM "NHAN_VIEN" WHERE "MaNV" = $1', [maNV]);
        if (rows.length === 0) {
            return res.status(404).send('Employee not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST a new employee
router.post('/', async (req, res) => {
    try {
        const { MaNV, HoTen, NgaySinh, MaKho } = req.body;
        if (!MaNV) {
            return res.status(400).send('MaNV is required');
        }
        const { rows } = await db.query(
            'INSERT INTO "NHAN_VIEN" ("MaNV", "HoTen", "NgaySinh", "MaKho") VALUES ($1, $2, $3, $4) RETURNING *',
            [MaNV, HoTen, NgaySinh, MaKho]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT (update) an employee
router.put('/:maNV', async (req, res) => {
    try {
        const { maNV } = req.params;
        const { HoTen, NgaySinh, MaKho } = req.body;
        const { rows } = await db.query(
            'UPDATE "NHAN_VIEN" SET "HoTen" = $1, "NgaySinh" = $2, "MaKho" = $3 WHERE "MaNV" = $4 RETURNING *',
            [HoTen, NgaySinh, MaKho, maNV]
        );
        if (rows.length === 0) {
            return res.status(404).send('Employee not found');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE an employee
router.delete('/:maNV', async (req, res) => {
    try {
        const { maNV } = req.params;
        const { rows } = await db.query('DELETE FROM "NHAN_VIEN" WHERE "MaNV" = $1 RETURNING *', [maNV]);
        if (rows.length === 0) {
            return res.status(404).send('Employee not found');
        }
        res.status(200).send(`Employee with MaNV ${maNV} deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
