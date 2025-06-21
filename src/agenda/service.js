const pool = require('../config/db');

async function getAgenda(userId) {
    const result = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.professional 
         FROM user_agenda ua
         JOIN users u ON ua.contact_user_id = u.id
         WHERE ua.owner_user_id = $1`,
        [userId]
    );
    return result.rows;
}

async function addContactToAgenda(ownerId, contactId) {
    const result = await pool.query(
        `INSERT INTO user_agenda (owner_user_id, contact_user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING *`,
        [ownerId, contactId]
    );
    return result.rows[0];
}

async function removeContactFromAgenda(ownerId, contactId) {
    await pool.query(
        `DELETE FROM user_agenda WHERE owner_user_id = $1 AND contact_user_id = $2`,
        [ownerId, contactId]
    );
    return { message: 'Contact removed' };
}

module.exports = {
    getAgenda,
    addContactToAgenda,
    removeContactFromAgenda
};
