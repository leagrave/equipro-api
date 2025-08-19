
const pool = require('../config/db');

const invoice = {
    // Création d'une facture
async createInvoice(data) {
    const {
        user_id,
        horse_id,
        professional_id,
        title,
        number,
        total_amount,
        issue_date,
        due_date,
        is_company,
        is_paid,
        payment_type_id,
        billing_address_id,
        status_id,
    } = data;

    const query = `
        INSERT INTO invoices (
            user_id, horse_id, professional_id, title, number, total_amount,
            issue_date, due_date, is_company, is_paid, payment_type_id, billing_address_id, status_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *;
    `;

    const values = [
        user_id,
        horse_id,
        professional_id,
        title,
        number,
        total_amount,
        issue_date,
        due_date,
        is_company,
        is_paid,
        payment_type_id,
        billing_address_id,
        status_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
},

    // Récupérer factures par pro
    async getInvoicesByProfessional(proId) {
    const result = await pool.query(
        "SELECT * FROM invoices WHERE professional_id = $1 ORDER BY issue_date DESC",
        [proId]
    );
    return result.rows;
    },

    // Récupérer factures par user
    async getInvoicesByUser(userId) {
    const result = await pool.query(
        "SELECT * FROM invoices WHERE user_id = $1 ORDER BY issue_date DESC",
        [userId]
    );
    return result.rows;
    },

    // Récupérer factures par cheval
    async getInvoicesByHorse(horseId) {
    const result = await pool.query(
        "SELECT * FROM invoices WHERE horse_id = $1 ORDER BY issue_date DESC",
        [horseId]
    );
    return result.rows;
    },

}

module.exports = invoice;
