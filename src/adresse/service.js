const pool = require('../config/db'); 

const AddressService = {

    async createAddress(address, city, postal_code, country , latitude, longitude, user_id, horse_id, type) {

      const result = await pool.query(
        `INSERT INTO addresses (address, city, postal_code, country, longitude, latitude, user_id, horse_id, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [address, city, postal_code, country, latitude, longitude, user_id, horse_id, type]
      );

      const addressId = result.rows[0].id;

          // 2. Vérifier si le user est dans customers
      const customerCheck = await pool.query(
        `SELECT 1 FROM customers WHERE user_id = $1`,
        [user_id]
      );

      if (customerCheck.rowCount > 0) {
        // Mise à jour côté customer
        if (type === 'main') {
          await pool.query(
            `UPDATE customers SET address_id = $1 WHERE user_id = $2`,
            [addressId, user_id]
          );
        } else if (type === 'billing') {
          await pool.query(
            `UPDATE customers SET billing_address_id = $1 WHERE user_id = $2`,
            [addressId, user_id]
          );
        }
      }

      // 3. Vérifier si le user est dans professionals
      const proCheck = await pool.query(
        `SELECT 1 FROM professionals WHERE user_id = $1`,
        [user_id]
      );

      if (proCheck.rowCount > 0) {
        // Un professionnel a toujours une seule adresse (principale)
        await pool.query(
          `UPDATE professionals SET address_id = $1 WHERE user_id = $2`,
          [addressId, user_id]
        );
      }

      return addressId;
    },

    async createAdresses(mainAddressData, billingAddressData) {


    let address_id = null;
    let billing_address_id = null;

    // 1. Créer adresse principale si elle existe
    if (mainAddressData) {
      address_id = await this.createAddress(
        mainAddressData.address,
        mainAddressData.city,
        mainAddressData.postal_code,
        mainAddressData.country,
        mainAddressData.latitude || null,
        mainAddressData.longitude || null,
        mainAddressData.user_id || null,
        mainAddressData.horse_id || null,
        mainAddressData.type || 'main'
      );
    }

    // 2. Créer adresse facturation si elle existe
    if (billingAddressData) {
      billing_address_id = await this.createAddress(
        billingAddressData.address,
        billingAddressData.city,
        billingAddressData.postal_code,
        billingAddressData.country,
        billingAddressData.latitude || null,
        billingAddressData.longitude || null,
        billingAddressData.user_id,
        billingAddressData.horse_id || null,
        billingAddressData.type || 'billing'
      );
    }

    return result.rows[0];
  },

  async getAddressesByAddressId(id) {
    const query = `SELECT * FROM addresses WHERE id = $1 ORDER BY updated_at DESC;`;
    const result = await pool.query(query, [id]);
    return result.rows;
  },

  // async createAddress(data) {
  //   const {
  //     user_id,
  //     horse_id = null,
  //     address,
  //     city,
  //     postal_code,
  //     country,
  //     latitude = null,
  //     longitude = null,
  //   } = data;

  //   const query = `
  //     INSERT INTO addresses (
  //       user_id, horse_id, address, city, postal_code, country, latitude, longitude
  //     )
  //     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  //     RETURNING *;
  //   `;

  //   const values = [user_id, horse_id, address, city, postal_code, country, latitude, longitude];
  //   const result = await pool.query(query, values);
  //   return result.rows[0];
  // },

  async updateAddress(id, data) {
    const {
      address,
      city,
      postal_code,
      country,
      latitude = null,
      longitude = null,
      type,
    } = data;

    const query = `
      UPDATE addresses
      SET address = $1,
          city = $2,
          postal_code = $3,
          country = $4,
          latitude = $5,
          longitude = $6,
          type = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;

    const values = [address, city, postal_code, country, latitude, longitude, type, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteAddress(id) {
    const query = `DELETE FROM addresses WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async getAddressesByUser(userId) {
    const query = `SELECT * FROM addresses WHERE user_id = $1 ORDER BY updated_at DESC;`;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

    async getAddressesByHorse(horseId) {
    const query = `SELECT * FROM addresses WHERE horse_id = $1 ORDER BY updated_at DESC;`;
    const result = await pool.query(query, [horseId]);
    return result.rows;
  },
};

module.exports = AddressService;
