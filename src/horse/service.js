const pool = require('../config/db');

const Horse = {
  // 1. Créer une adresse
  async createAddress(address, city, postal_code, country = 'France', latitude = null, longitude = null) {
    const result = await pool.query(
      `INSERT INTO addresses (address, city, postal_code, country, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [address, city, postal_code, country, latitude, longitude]
    );
    return result.rows[0].id;
  },

  // 2. Créer un cheval avec adresse et lien user
  async createHorseWithAddressAndUser(horseData, addressData, userId) {
    const address_id = await this.createAddress(
      addressData.address,
      addressData.city,
      addressData.postal_code,
      addressData.country || 'France',
      addressData.latitude || null,
      addressData.longitude || null
    );

    const result = await pool.query(
      `INSERT INTO horses (
        name, age, breed_id, stable_id, feed_type_id, color_id, activity_type_id,
        address_id, last_visit_date, next_visit_date, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        horseData.name,
        horseData.age,
        horseData.breed_id || null,
        horseData.stable_id || null,
        horseData.feed_type_id || null,
        horseData.color_id || null,
        horseData.activity_type_id || null,
        address_id,
        horseData.last_visit_date || null,
        horseData.next_visit_date || null,
        horseData.notes || null
      ]
    );

    const horse = result.rows[0];

    await pool.query(
      `INSERT INTO horse_users (horse_id, user_id) VALUES ($1, $2)`,
      [horse.id, userId]
    );

    return horse;
  },

  // 3. Récupérer tous les chevaux
  async getAllHorses() {
    const result = await pool.query(`SELECT * FROM horses`);
    return result.rows;
  },

  // 4. Récupérer un cheval par son ID
  async getHorseById(horseId) {
    const result = await pool.query(`SELECT * FROM horses WHERE id = $1`, [horseId]);
    return result.rows[0];
  },

  // 5. Récupérer tous les chevaux d’un user
  async getHorsesByUserId(userId) {
    const result = await pool.query(`
      SELECT h.*
      FROM horses h
      JOIN horse_users hu ON h.id = hu.horse_id
      WHERE hu.user_id = $1
    `, [userId]);
    return result.rows;
  },

  // 6. Supprimer un cheval (et la liaison est supprimée via ON DELETE CASCADE)
  async deleteHorse(horseId) {
    await pool.query(`DELETE FROM horses WHERE id = $1`, [horseId]);
    return { message: 'Cheval supprimé' };
  }
};

module.exports = Horse;
