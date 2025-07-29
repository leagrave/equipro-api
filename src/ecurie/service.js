const pool = require('../config/db');

const Horse = {
    async postStables(data) {
    // Vérifier si une écurie existe déjà pour ce user_id
    const checkQuery = `SELECT id FROM stables WHERE user_id = $1 LIMIT 1`;
    const checkResult = await pool.query(checkQuery, [data.user_id]);

    if (checkResult.rowCount > 0) {
        // Une écurie existe déjà pour ce user_id
        throw new Error('Écurie existe déjà pour ce user_id');
    }

    // Si aucune écurie existante, on insère
    const insertQuery = `
        INSERT INTO stables (name, phone, phone2, address_id, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;

    const values = [
        data.name,
        data.phone || null,
        data.phone2 || null,
        data.address_id || null,
        data.user_id,
    ];

    const insertResult = await pool.query(insertQuery, values);

    // Renvoi de l'id de la nouvelle écurie créée
    return insertResult.rows[0];
    },

    async postStablesByUserId(user_id, data) {
        // 1. Chercher écurie existante pour user_id
        const selectQuery = `SELECT * FROM stables WHERE user_id = $1 LIMIT 1`;
        const selectResult = await pool.query(selectQuery, [data.user_id]);

        if (selectResult.rowCount > 0) {
            // Écurie trouvée, on la retourne directement
            return selectResult.rows[0];
        }

        // 2. Pas d'écurie trouvée, on crée une nouvelle
        const insertQuery = `
            INSERT INTO stables (name, phone, phone2, address_id, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, phone, phone2, address_id, user_id
        `;
        const values = [
            data.name,
            data.phone || null,
            data.phone2 || null,
            data.address_id || null,
            data.user_id,
        ];

        const insertResult = await pool.query(insertQuery, values);
        const newStable = insertResult.rows[0];

        // 3. Créer la liaison dans user_stable
        const insertLinkQuery = `
            INSERT INTO user_stable (owner_user_id, stable_id)
            VALUES ($1, $2)
        `;
        await pool.query(insertLinkQuery, [user_id, newStable.id]);

        // 4. Retourner la nouvelle écurie
        return newStable;
    },

    async postUserStableLink(owner_user_id, stable_id) {
        // Vérifier si la liaison existe déjà
        const checkQuery = `
            SELECT 1 FROM user_stable
            WHERE owner_user_id = $1 AND stable_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [owner_user_id, stable_id]);

        if (checkResult.rowCount > 0) {
            // Liaison déjà existante
            throw new Error('Cette liaison entre utilisateur et écurie existe déjà.');
        }

        // Insertion de la liaison
        const insertQuery = `
            INSERT INTO user_stable (owner_user_id, stable_id)
            VALUES ($1, $2)
        `;
        await pool.query(insertQuery, [owner_user_id, stable_id]);

        return { message: 'Liaison créée avec succès' };
        },


    async getStablesByUserId(user_id) {
        const query = `SELECT * FROM stables WHERE user_id = $1 ORDER BY created_at DESC`;
        const { rows } = await pool.query(query, [user_id]);
        return rows;
    },

    async getStablesByOwnerId(owner_user_id) {
    const query = `
        SELECT s.*
        FROM stables s
        INNER JOIN user_stable us ON s.id = us.stable_id
        WHERE us.owner_user_id = $1
    `;

    const { rows } = await pool.query(query, [owner_user_id]);
    return rows;
    },



    async getStableById(id) {
        const query = `SELECT * FROM stables WHERE id = $1`;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
        },

        async updateStable(id, data) {
        const query = `
            UPDATE stables SET
            name = $1,
            phone = $2,
            phone2 = $3,
            address_id = $4,
            user_id = $5,
            updated_at = NOW()
            WHERE id = $6
            RETURNING *;
        `;

        const values = [
            data.name,
            data.phone,
            data.phone2,
            data.address_id,
            data.user_id,
            id,
        ];

        const { rows } = await pool.query(query, values);
        return rows[0];
        },

        async deleteStable(id) {
            // Supprimer d’abord les liaisons dans user_stable
            await pool.query(`DELETE FROM user_stable WHERE stable_id = $1`, [id]);

            // Puis supprimer l’écurie
            await pool.query(`DELETE FROM stables WHERE id = $1`, [id]);
        }
}

module.exports = Horse;
