const pool = require('../config/db');

const Soins = {
    // Pour un professionnel : récupérer les rendez-vous d'un client
    async getCustomerVisitByProfessional(professionalId, customerId) {
        const query = `
            SELECT *
            FROM customer_professionnal
            WHERE professionals_id = $1 AND customer_id = $2
        `;
        const values = [professionalId, customerId];
        const { rows } = await pool.query(query, values);
        return rows[0]; 
    },

    // Pour un professionnel : récupérer le dernier rendez-vous avec client
    async getCustomerLastVisitByProfessional(professionalId, customerId) {
        const query = `
            SELECT *
            FROM customer_professionnal
            WHERE professionals_id = $1 AND customer_id = $2
            ORDER BY customer_professionnal.last_visit_date DESC
        `;
        const values = [professionalId, customerId];
        const { rows } = await pool.query(query, values);
        return rows;
    },

    // Pour un professionnel : historique de tous ses clients
    async getAllCustomerVisitsByProfessional(professionalId) {
        const query = `
            SELECT cp.customer_id, u.first_name, u.last_name, cp.last_visit_date, cp.next_visit_date, cp.notes
            FROM customer_professionnal cp
            JOIN customers c ON cp.customer_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE cp.professionals_id = $1
            ORDER BY cp.last_visit_date DESC
        `;
        const { rows } = await pool.query(query, [professionalId]);
        return rows;
    },

    // Pour un client : récupérer les infos d’un professionnel (et les dates)
    async getProfessionalInfoByCustomer(customerId) {
        const query = `
            SELECT p.id AS professionals_id, u.first_name, u.last_name, cp.last_visit_date, cp.next_visit_date
            FROM customer_professionnal cp
            JOIN professionals p ON cp.professionals_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE cp.customer_id = $1
        `;
        const { rows } = await pool.query(query, [customerId]);
        return rows;
    },

    // Pour un client : récupérer le dernier rendez-vous tous professionnels confondus
    async getLastVisitByCustomer(customerId) {
        const query = `
            SELECT cp.last_visit_date, cp.next_visit_date, p.id AS professionals_id, u.first_name, u.last_name
            FROM customer_professionnal cp
            JOIN professionals p ON cp.professionals_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE cp.customer_id = $1
            ORDER BY cp.last_visit_date DESC
            LIMIT 1
        `;
        const { rows } = await pool.query(query, [customerId]);
        return rows[0];
    },
}

module.exports = Soins;