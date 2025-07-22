const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Notes = {

    async upsertNote({ customer_id, professionals_id, notes }) {
        const result = await pool.query(
            `
            INSERT INTO customerProfessionnal_note (customer_id, professionals_id, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (customer_id, professionals_id)
            DO UPDATE SET notes = $3
            RETURNING *;
            `,
            [customer_id, professionals_id, notes]
        );
        return result.rows[0];
    },

    async  createNote(customerId, professionalId, notes) {
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO customerProfessionnal_note (id, customer_id, professionals_id, notes)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, customerId, professionalId, notes]
        );
        return result.rows[0];
    },

    async getNoteById(id) {
        const result = await pool.query(
            `SELECT * FROM customerProfessionnal_note WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    },


    async getNoteByCustomerAndProfessional(customerId, professionalId) {
        const result = await pool.query(
            `SELECT * FROM customerProfessionnal_note WHERE customer_id = $1 AND professionals_id = $2`,
            [customerId, professionalId]
        );
        return result.rows[0];
    },


    async updateNote(id, notes) {
    const result = await pool.query(
        `UPDATE customerProfessionnal_note SET notes = $1 WHERE id = $2 RETURNING *`,
        [notes, id]
    );
    return result.rows[0];
    },

    async deleteNote(id) {
    const result = await pool.query(
        `DELETE FROM customerProfessionnal_note WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
    },
}
module.exports = Notes;
