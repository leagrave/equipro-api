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

async function getAllAgenda(userId) {
    const result = await pool.query(`
        SELECT 
            u.id AS user_id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.professional,

            -- Téléphones
            CASE 
                WHEN u.professional THEN p.phone
                ELSE c.phone
            END AS phone,

            CASE 
                WHEN u.professional THEN p.phone2
                ELSE c.phone2
            END AS phone2,

            -- Société
            CASE 
                WHEN u.professional THEN p.societe_name
                ELSE c.societe_name
            END AS societe_name,

            CASE 
                WHEN u.professional THEN NULL
                ELSE c.is_societe
            END AS is_societe,

            CASE 
                WHEN u.professional THEN NULL
                ELSE c.societe_name
            END AS societe_name,

            CASE 
                WHEN u.professional THEN NULL
                ELSE c.id
            END AS id,

            -- Adresse principale
            CASE 
                WHEN u.professional THEN ap.id
                ELSE ac.id
            END AS address_id,

            CASE 
                WHEN u.professional THEN ap.address
                ELSE ac.address
            END AS address,

            CASE 
                WHEN u.professional THEN ap.postal_code
                ELSE ac.postal_code
            END AS postal_code,

            CASE 
                WHEN u.professional THEN ap.city
                ELSE ac.city
            END AS city,

            CASE 
                WHEN u.professional THEN ap.country
                ELSE ac.country
            END AS country,

            CASE 
                WHEN u.professional THEN ap.longitude
                ELSE ac.longitude
            END AS longitude,

            CASE 
                WHEN u.professional THEN ap.latitude
                ELSE ac.latitude
            END AS latitude,

            -- Adresse de facturation (clients uniquement)
            bc.id AS billing_id,
            bc.address AS billing_address,
            bc.city AS billing_city,
            bc.postal_code AS billing_postal_code,
            bc.country AS billing_country,
            bc.longitude AS billing_longitude,
            bc.latitude AS billing_latitude,

            -- Chevaux
            h.id AS horse_id,
            h.name AS horse_name,
            h.age AS horse_age,
            h.last_visit_date,
            h.next_visit_date,
            h.notes

        FROM users u
        LEFT JOIN professionals p ON u.id = p.user_id
        LEFT JOIN customers c ON u.id = c.user_id

        -- Adresse principale
        LEFT JOIN addresses ap ON ap.id = p.address_id  -- pour pros
        LEFT JOIN addresses ac ON ac.id = c.address_id  -- pour clients

        -- Adresse de facturation clients
        LEFT JOIN addresses bc ON bc.id = c.billing_address_id

        -- Chevaux
        LEFT JOIN horse_users hu ON u.id = hu.user_id
        LEFT JOIN horses h ON hu.horse_id = h.id

        WHERE u.id != $1
        AND u.id IN (
            SELECT contact_user_id FROM user_agenda WHERE owner_user_id = $1
        )
        ORDER BY u.last_name ASC, u.first_name ASC



    `, [userId]);

    const rows = result.rows;

    // On regroupe les résultats
    const usersMap = new Map();

    for (const row of rows) {
       if (!usersMap.has(row.user_id)) {
        usersMap.set(row.user_id, {
        user_id: row.user_id,
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        professional: row.professional,
        phone: row.phone,
        phone2: row.phone2,
        societe_name: row.societe_name,
        is_societe: row.is_societe,
        addresses: [],
        horses: []
    });
}

    // Ajout de l'adresse principale
    const user = usersMap.get(row.user_id);

    // Adresse principale
    if (row.address) {
        // Vérifier qu’elle n’est pas déjà ajoutée pour éviter doublon (optionnel)
        if (!user.addresses.some(a => a.type === 'main')) {
        user.addresses.push({
            id: row.address_id,
            type: 'main',
            address: row.address,
            postal_Code: row.postal_code,
            city: row.city,
            country: row.country,
            longitude: row.longitude,
            latitude: row.latitude,
        });
        }
    }

    // Adresse de facturation
    if (row.billing_address) {
        if (!user.addresses.some(a => a.type === 'billing')) {
        user.addresses.push({
            id: row.billing_id,
            type: 'billing',
            address: row.billing_address,
            postalCode: row.billing_postal_code,
            city: row.billing_city,
            country: row.billing_country,
            longitude: row.billing_longitude,
            latitude: row.billing_latitude,
        });
        }
    }

        // Ajoute le cheval s’il existe
        if (row.horse_id) {
            usersMap.get(row.user_id).horses.push({
                id: row.horse_id,
                name: row.horse_name,
                age: row.horse_age,
                lastVisitDate: row.last_visit_date,
                nextVisitDate: row.next_visit_date,
                notes: row.notes
            });
        }
    }

    return Array.from(usersMap.values());
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
    getAllAgenda,
    addContactToAgenda,
    removeContactFromAgenda
};
