const pool = require('../config/db');

const Horse = {
  // Créer une adresse
  async createAddress(address, city, postal_code, country, latitude = null, longitude = null, type, user_id, horse_id) {
    const result = await pool.query(
      `INSERT INTO addresses (address, city, postal_code, country, latitude, longitude, type, user_id, horse_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [address, city, postal_code, country, latitude, longitude, type, user_id, horse_id]
    );
    return result.rows[0].id;
  },

  // Créer un cheval avec adresse et lien user (et tables de liaison)
  async createHorseWithAddressAndUser(horseData, addressData, users) {
    console.log("Début création cheval");
    let address_id = null;

    // 1. Créer adresse principale si elle existe
    if (addressData) {
      address_id = await this.createAddress(
        addressData.address,
        addressData.city,
        addressData.postal_code,
        addressData.country || 'France',
        addressData.latitude || null,
        addressData.longitude || null,
        addressData.user_id || null,
        addressData.horse_id || null,
        addressData.type || 'main'
      );
    }

    // 1. Création du cheval de base (sans les liaisons n-n)
    const result = await pool.query(
      `INSERT INTO horses (
        name, age, stable_id, addresse_id, last_visit_date, next_visit_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        horseData.name,
        horseData.age,
        horseData.stable_id || null,
        address_id || null,
        horseData.last_visit_date || null,
        horseData.next_visit_date || null,
        horseData.notes || null
      ]
    );

    const horse = result.rows[0];

    if (address_id) {
      await pool.query(
        `UPDATE addresses SET horse_id = $1 WHERE id = $2`,
        [horse.id, address_id]
      );
    }

    // 2. Insertion dans horse_users
    if (Array.isArray(users) && users.length > 0) {
      for (const id of users) {
        await pool.query(
          `INSERT INTO horse_users (horse_id, user_id) VALUES ($1, $2)`,
          [horse.id, id]
        );
      }
    }
    // 3. Insertion dans les tables de liaison (si données présentes)

   // Breed(s)
    if (Array.isArray(horseData.breed_ids) && horseData.breed_ids.length > 0) {
      for (const breed_id of horseData.breed_ids) {
        await pool.query(
          `INSERT INTO horse_breeds_link (horse_id, breed_id) VALUES ($1, $2)`,
          [horse.id, breed_id]
        );
      }
    }

    // Feed type(s)
    if (Array.isArray(horseData.feed_type_ids) && horseData.feed_type_ids.length > 0) {
      for (const feed_type_id of horseData.feed_type_ids) {
        await pool.query(
          `INSERT INTO horse_feed_types (horse_id, feed_type_id) VALUES ($1, $2)`,
          [horse.id, feed_type_id]
        );
      }
    }

    // Color(s)
    if (Array.isArray(horseData.color_ids) && horseData.color_ids.length > 0) {
      for (const color_id of horseData.color_ids) {
        await pool.query(
          `INSERT INTO horse_colors_link (horse_id, color_id) VALUES ($1, $2)`,
          [horse.id, color_id]
        );
      }
    }

    // Activity type(s)
    if (Array.isArray(horseData.activity_type_ids) && horseData.activity_type_ids.length > 0) {
      for (const activity_type_id of horseData.activity_type_ids) {
        await pool.query(
          `INSERT INTO horse_activity_types_link (horse_id, activity_type_id) VALUES ($1, $2)`,
          [horse.id, activity_type_id]
        );
      }
    }

    return horse;
  },

  async getHorseByIdTest() {
  const result = await pool.query(`SELECT hb.* FROM horse_breeds_link hbl JOIN horse_breeds hb ON hbl.breed_id = hb.id WHERE hbl.horse_id = $1`,['dd2157a5-c20b-4966-93d1-ae09d0c1ffe7'])

  return result.rows[0];
  },

async getFullHorseById(horseId) {
  const result = await pool.query(`
    SELECT 
      h.id AS horse_id,
      h.name,
      h.age,
      h.stable_id,
      h.last_visit_date,
      h.next_visit_date,
      h.notes,
      h.created_at,
      h.updated_at,
      h.addresse_id
    FROM horses h
    WHERE h.id = $1
  `, [horseId]);

  if (result.rows.length === 0) {
    return null;
  }
  const base = result.rows[0];

  // Récupérer les IDs liés
  const breedResult = await pool.query(`SELECT hb.* FROM horse_breeds_link hbl JOIN horse_breeds hb ON hbl.breed_id = hb.id WHERE hbl.horse_id = $1`, [horseId]);
  const breedRows = breedResult.rows;

  const colorResult = await pool.query(`SELECT hc.* FROM horse_colors_link hcl JOIN horse_colors hc ON hcl.color_id = hc.id WHERE hcl.horse_id = $1`, [horseId]);
  const colorRows = colorResult.rows;

  const feedTypeResult = await pool.query(`SELECT ft.* FROM horse_feed_types hft JOIN feed_types ft ON hft.feed_type_id = ft.id WHERE hft.horse_id = $1`, [horseId]);
  const feedTypeRows = feedTypeResult.rows;

  const activityTypeResult = await pool.query(`SELECT hat.* FROM horse_activity_types_link hatl JOIN horse_activity_types hat ON hatl.activity_type_id = hat.id WHERE hatl.horse_id = $1`, [horseId]);
  const activityTypeRows = activityTypeResult.rows;

  const userResult = await pool.query(`
    SELECT u.id AS user_id, u.email, u.first_name, u.last_name, u.professional 
    FROM horse_users hu 
    JOIN users u ON hu.user_id = u.id 
    WHERE hu.horse_id = $1
  `, [horseId]);
  const userRows = userResult.rows;


  const addressResult = await pool.query(`SELECT a.* FROM addresses a WHERE a.id IN (SELECT addresse_id FROM horses WHERE id = $1)`, [horseId]);
  const addressRows = addressResult.rows;

  return {
    id: base.horse_id,
    name: base.name,
    age: base.age,
    stable_id: base.stable_id,
    last_visit_date: base.last_visit_date,
    next_visit_date: base.next_visit_date,
    notes: base.notes,
    breeds: breedRows,         
    colors: colorRows,
    feed_types: feedTypeRows,
    activity_types: activityTypeRows,
    users: userRows,
    address: addressRows
  };
},



  async getAllInfosHorses() {
    const result = await Promise.all([
      pool.query(`SELECT id, breed_name FROM horse_breeds ORDER BY breed_name`),
      pool.query(`SELECT id, color_name FROM horse_colors ORDER BY color_name`),
      pool.query(`SELECT id, feed_name FROM feed_types ORDER BY feed_name`),
      pool.query(`SELECT id, activity_name FROM horse_activity_types ORDER BY activity_name`)
    ]);

    const [breedRows, colorRows, feedRows, activityRows] = result.map(r => r.rows);

    return {
      breeds: breedRows.map(row => ({
        id: row.id,
        name: row.breed_name
      })),
      colors: colorRows.map(row => ({
        id: row.id,
        name: row.color_name
      })),
      feedTypes: feedRows.map(row => ({
        id: row.id,
        name: row.feed_name
      })),
      activityTypes: activityRows.map(row => ({
        id: row.id,
        name: row.activity_name
      }))
    };
  },

  // Récupérer un cheval par son ID
  async getHorseById(horseId) {
    const result = await pool.query(`SELECT * FROM horses WHERE id = $1`, [horseId]);
    return result.rows[0];
  },

  // Récupérer tous les chevaux d’un user
  async getHorsesByUserId(userId) {
    const result = await pool.query(`
      SELECT h.*
      FROM horses h
      JOIN horse_users hu ON h.id = hu.horse_id
      WHERE hu.user_id = $1
    `, [userId]);
    return result.rows;
  },

  // Récupérer tous les chevaux de la liste de users
  async getHorsesByUsersId(userIds) {
    if (Array.isArray(userIds) && userIds.length > 0) {
      const result = await pool.query(`
        SELECT DISTINCT h.*
        FROM horses h
        JOIN horse_users hu ON h.id = hu.horse_id
        WHERE hu.user_id = ANY($1::uuid[])
      `, [userIds]);
      return result.rows;
    } else {
      return [];
    }
  },


  async putHorsesByHorseId(horseId,name,age,stable_id,address_id,last_visit_date,next_visit_date,notes,breed_ids,color_ids,feed_type_ids,activity_type_ids ) {
    const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Mise à jour du cheval
        const updateHorseText = `
          UPDATE horses
          SET name = $1,
              age = $2,
              stable_id = $3,
              addresse_id = $4,
              last_visit_date = $5,
              next_visit_date = $6,
              notes = $7,
              updated_at = NOW()
          WHERE id = $8
          RETURNING *`;
        const updateHorseValues = [name, age, stable_id, address_id, last_visit_date, next_visit_date, notes, horseId];
        const updateResult = await client.query(updateHorseText, updateHorseValues);

        if (updateResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('Cheval non trouvé');
        }

        // 2. Fonction utilitaire pour mise à jour des tables de liaison
        async function updateLinkTable(tableName, horseIdCol, linkCol, ids) {
          await client.query(`DELETE FROM ${tableName} WHERE ${horseIdCol} = $1`, [horseId]);

          if (Array.isArray(ids) && ids.length > 0) {
            // Construire une requête paramétrée
            const params = [horseId, ...ids];
            const valuesStr = ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${horseIdCol}, ${linkCol}) VALUES ${valuesStr}`;
            await client.query(insertQuery, params);
          }
        }

        // 3. Mise à jour des liens
        await updateLinkTable('horse_breeds_link', 'horse_id', 'breed_id', breed_ids);
        await updateLinkTable('horse_colors_link', 'horse_id', 'color_id', color_ids);
        await updateLinkTable('horse_feed_types', 'horse_id', 'feed_type_id', feed_type_ids);
        await updateLinkTable('horse_activity_types_link', 'horse_id', 'activity_type_id', activity_type_ids);

        await client.query('COMMIT');

        return updateResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur mise à jour cheval:', error);
        throw error;
      } finally {
        client.release();
      }
    },

  // Mise à jours de la stable id du cheval
  async putHorseStableByHorseId(horseId, stableId) {
  
      const updateQuery = `
        UPDATE horses
        SET stable_id = $1
        WHERE id = $2
        RETURNING *;
      `;

      const result = await pool.query(updateQuery, [stableId, horseId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Cheval non trouvé' });
      }
    return result.rows[0];
  },
  
  // Mise à jours de la stable id du cheval
  async putHorseNotesByHorseId(horseId, notes) {
  
      const updateQuery = `
        UPDATE horses
        SET notes = $1
        WHERE id = $2
        RETURNING *;
      `;

      const result = await pool.query(updateQuery, [notes, horseId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Cheval non trouvé' });
      }
    return result.rows[0];
  },

  
  async updateUsersForHorse(horseId, userIds) {
    // Transaction pour supprimer puis insérer
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Supprimer les relations existantes pour ce cheval
      await client.query('DELETE FROM horse_users WHERE horse_id = $1', [horseId]);

      // Insérer les nouvelles relations (user_id, horse_id)
      for (const userId of userIds) {
        await client.query(
          'INSERT INTO horse_users (user_id, horse_id) VALUES ($1, $2)',
          [userId, horseId]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },


  // Supprimer un cheval (et la liaison est supprimée via ON DELETE CASCADE)
  async deleteHorse(horseId) {
    await pool.query(`DELETE FROM horse_breeds_link WHERE horse_id = $1`, [horseId]);
    await pool.query(`DELETE FROM horse_colors_link WHERE horse_id = $1`, [horseId]);
    await pool.query(`DELETE FROM horse_feed_types WHERE horse_id = $1`, [horseId]);
    await pool.query(`DELETE FROM horse_activity_types_link WHERE horse_id = $1`, [horseId]);
    await pool.query(`DELETE FROM horse_users WHERE horse_id = $1`, [horseId]);
    await pool.query(`DELETE FROM horses WHERE id = $1`, [horseId]);

    return { message: 'Cheval supprimé' };
  }
};

module.exports = Horse;
