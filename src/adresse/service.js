const db = require('../config/db'); 

const AddressService = {
  async createAddress(data) {
    const {
      user_id,
      horse_id = null,
      address,
      city,
      postal_code,
      country = 'France',
      latitude = null,
      longitude = null,
    } = data;

    const query = `
      INSERT INTO addresses (
        user_id, horse_id, address, city, postal_code, country, latitude, longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [user_id, horse_id, address, city, postal_code, country, latitude, longitude];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async updateAddress(id, data) {
    const {
      address,
      city,
      postal_code,
      country,
      latitude,
      longitude,
    } = data;

    const query = `
      UPDATE addresses
      SET address = $1,
          city = $2,
          postal_code = $3,
          country = $4,
          latitude = $5,
          longitude = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;

    const values = [address, city, postal_code, country, latitude, longitude, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async deleteAddress(id) {
    const query = `DELETE FROM addresses WHERE id = $1 RETURNING *;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async getAddressesByUser(userId) {
    const query = `SELECT * FROM addresses WHERE user_id = $1 ORDER BY updated_at DESC;`;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

    async getAddressesByHorse(horseId) {
    const query = `SELECT * FROM addresses WHERE horse_id = $1 ORDER BY updated_at DESC;`;
    const result = await db.query(query, [horseId]);
    return result.rows;
  },
};

module.exports = AddressService;
