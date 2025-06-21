const pool = require('../config/db');

const Customer = {

    async createAddress(adresse, city, postal_code, country = 'France', latitude = null, longitude = null) {
    const result = await pool.query(
      `INSERT INTO addresses (adresse, city, postal_code, country, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [adresse, city, postal_code, country, latitude, longitude]
    );
    return result.rows[0].id;
  },

    async createCustomer(customerData, mainAddressData, billingAddressData) {
    // customerData = { user_id, phone, phone2, is_societe }
    // mainAddressData = { adresse, city, postal_code, country?, latitude?, longitude? }
    // billingAddressData = { adresse, city, postal_code, country?, latitude?, longitude? }

    // 1. Créer adresse principale
    const address_id = await this.createAddress(
      mainAddressData.adresse,
      mainAddressData.city,
      mainAddressData.postal_code,
      mainAddressData.country || 'France',
      mainAddressData.latitude || null,
      mainAddressData.longitude || null
    );

    // 2. Créer adresse facturation
    let billing_address_id = null;
    if (billingAddressData) {
      billing_address_id = await this.createAddress(
        billingAddressData.adresse,
        billingAddressData.city,
        billingAddressData.postal_code,
        billingAddressData.country || 'France',
        billingAddressData.latitude || null,
        billingAddressData.longitude || null
      );
    }

    // 3. Créer client avec les ids d'adresse
    const result = await pool.query(
      `INSERT INTO customers 
      (user_id, phone, phone2, addresse_id, billing_address_id, is_societe)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        customerData.user_id,
        customerData.phone,
        customerData.phone2,
        address_id,
        billing_address_id,
        customerData.is_societe || false
      ]
    );

    return result.rows[0];
  },

  async getCustomerById(user_id) {
    const result = await pool.query(`SELECT * FROM customers WHERE user_id = $1`, [user_id]);
    return result.rows[0];
  },

  async getAllCustomers() {
    const result = await pool.query(`SELECT * FROM customers`);
    return result.rows;
  },

  async updateCustomer(phone, phone2,is_societe,user_id) {
    const result = await pool.query(
      `UPDATE customers SET phone = $1, phone2 = $2, is_societe = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *`,
      [phone, phone2, is_societe, user_id]
    );
    return result.rows[0];
  },

  async deleteCustomer(user_id) {
    await pool.query(`DELETE FROM customers WHERE user_id = $1`, [id]);
    return { message: 'Utilisateur supprimé' };
  },

};

module.exports = Customer;
