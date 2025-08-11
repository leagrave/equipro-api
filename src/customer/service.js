const pool = require('../config/db');
const { addContactToAgenda } = require('../agenda/service');
const { upsertNote } = require('../notes/service');

const Customer = {

    async createAddress(address, city, postal_code, country , latitude = null, longitude = null, user_id, horse_id, type) {
      const result = await pool.query(
        `INSERT INTO addresses (address, city, postal_code, country, longitude, latitude, user_id, horse_id, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [address, city, postal_code, country, latitude, longitude, user_id, horse_id, type]
      );
      return result.rows[0].id;
    },

    async createCustomer(customerData, mainAddressData, billingAddressData) {
    // customerData = { user_id, phone, phone2, is_societe }
    // mainAddressData = { adresse, city, postal_code, country?, latitude?, longitude? }
    // billingAddressData = { adresse, city, postal_code, country?, latitude?, longitude? }

    let address_id = null;
    let billing_address_id = null;

    // 1. Créer adresse principale si elle existe
    if (mainAddressData) {
      address_id = await this.createAddress(
        mainAddressData.address,
        mainAddressData.city,
        mainAddressData.postal_code,
        mainAddressData.country || 'France',
        mainAddressData.latitude || null,
        mainAddressData.longitude || null,
        mainAddressData.user_id,
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
        billingAddressData.country || 'France',
        billingAddressData.latitude || null,
        billingAddressData.longitude || null,
        billingAddressData.user_id,
        billingAddressData.horse_id || null,
        billingAddressData.type || 'billing'
      );
    }

    // 3. Créer client avec les ids d'adresse
    const result = await pool.query(
      `INSERT INTO customers 
      (user_id, phone, phone2, address_id, billing_address_id, is_societe, societe_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        customerData.user_id,
        customerData.phone,
        customerData.phone2,
        address_id,
        billing_address_id,
        customerData.is_societe || false,
        customerData.societe_name
      ]
    );

    const createdCustomer = result.rows[0];
    // 4.Créer la liason dans la table agenda
    if (customerData.owner_id && customerData.user_id) {
      await addContactToAgenda(customerData.owner_id, customerData.user_id);
    }

    // 5. Ajouter la note 
    if (customerData.owner_id && createdCustomer.user_id && customerData.notes) {
      await upsertNote({
        customer_id: createdCustomer.user_id,
        professionals_id: customerData.owner_id,
        notes: customerData.notes
      });
    }

    return createdCustomer;
  },

  async getCustomerById(user_id) {
    const result = await pool.query(`SELECT * FROM customers WHERE user_id = $1`, [user_id]);
    return result.rows[0];
  },

  async getAllCustomers() {
    const result = await pool.query(`SELECT * FROM customers`);
    return result.rows;
  },

  // async updateCustomer(phone, phone2,is_societe,user_id) {
  //   const result = await pool.query(
  //     `UPDATE customers SET phone = $1, phone2 = $2, is_societe = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *`,
  //     [phone, phone2, is_societe, user_id]
  //   );
  //   return result.rows[0];
  // },

  async updateCustomer(userId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        firstName,
        lastName,
        email,
        phone,
        phone2,
        isSociete,
        societeName
      } = data;


      const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) throw new Error("Utilisateur non trouvé.");

      // 🟦 Mise à jour de la table users
      const userUpdates = [];
      const userValues = [];
      let uIndex = 1;

      const userFields = { first_name: firstName, last_name: lastName, email };
      for (const [key, value] of Object.entries(userFields)) {
        if (value !== undefined && value !== user[key]) {
          userUpdates.push(`${key} = $${uIndex++}`);
          userValues.push(value);
        }
      }

      if (userUpdates.length > 0) {
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userUpdates.join(', ')}, updated_at = NOW() WHERE id = $${uIndex}`,
          userValues
        );
      }

      // 🟩 Mise à jour ou création du customer
      const custRes = await client.query('SELECT * FROM customers WHERE user_id = $1', [userId]);
      const existing = custRes.rows[0];

      if (existing) {
        const custUpdates = [];
        const custValues = [];
        let cIndex = 1;

        if (phone !== undefined && phone !== existing.phone) {
          custUpdates.push(`phone = $${cIndex++}`);
          custValues.push(phone);
        }

        if (phone2 !== undefined && phone2 !== existing.phone2) {
          custUpdates.push(`phone2 = $${cIndex++}`);
          custValues.push(phone2);
        }

        if (isSociete !== undefined && isSociete !== existing.is_societe) {
          custUpdates.push(`is_societe = $${cIndex++}`);
          custValues.push(isSociete);
        }

        if (societeName !== undefined && societeName !== existing.societe_name) {
          custUpdates.push(`societe_name = $${cIndex++}`);
          custValues.push(societeName);
        }

        if (custUpdates.length > 0) {
          custValues.push(userId);
          await client.query(
            `UPDATE customers SET ${custUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${cIndex}`,
            custValues
          );
        }
      } else {
        await client.query(
          `INSERT INTO customers (user_id, phone, phone2, is_societe, societe_name)
          VALUES ($1, $2, $3, $4, $5)`,
          [userId, phone, phone2, isSociete, societeName]
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Utilisateur et client mis à jour.' };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur updateUserAndCustomer :', err);
      throw err;
    } finally {
      client.release();
    }
  },


  async deleteCustomer(user_id) {
    await pool.query(`DELETE FROM customers WHERE user_id = $1`, [id]);
    return { message: 'Utilisateur supprimé' };
  },

};

module.exports = Customer;
