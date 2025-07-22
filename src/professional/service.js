const pool = require('../config/db');

const Professional = {
  async getAllProfessionals() {
    const result = await pool.query(`SELECT * FROM professionals`);
    return result.rows;
  },

  async getProfessionalById(user_id) {
    const result = await pool.query(`SELECT * FROM professionals WHERE id = $1`, [user_id]);
    return result.rows[0];
  },

  async getAllProfessionalsTypes() {
    const result = await pool.query(`SELECT * FROM professional_types`);
    return result.rows;
  },

    async createAddress(address, city, postal_code, country = 'France', latitude = null, longitude = null) {
    const result = await pool.query(
      `INSERT INTO addresses (address, city, postal_code, country, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [address, city, postal_code, country, latitude, longitude]
    );
    return result.rows[0].id;
  },

  async createProfessional(proData, addressData) {
    // addressData = { adresse, city, postal_code, country?, latitude?, longitude? }
    // proData = { phone, phone2, siret_number, societe_name, professional_types_id, is_verified }

    // 1. Créer l'adresse et récupérer son id
    const address_id = await this.createAddress(
      addressData.address,
      addressData.city,
      addressData.postal_code,
      addressData.country || 'France',
      addressData.latitude || null,
      addressData.longitude || null
    );

    // 2. Créer le professionnel avec l'id d'adresse
    const result = await pool.query(
      `INSERT INTO professionals 
      (phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        proData.phone,
        proData.phone2,
        address_id,
        proData.siret_number,
        proData.societe_name,
        proData.professional_types_id,
        proData.is_verified || false
      ]
    );
    return result.rows[0];
  },

  async updateProfessional(id, phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified) {
    const result = await pool.query(
      `UPDATE professionals SET
         phone = $1,
         phone2 = $2,
         address_id = $3,
         siret_number = $4,
         societe_name = $5,
         professional_types_id = $6,
         is_verified = $7,
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified, id]
    );
    return result.rows[0];
  },

  async deleteProfessional(id) {
    await pool.query(`DELETE FROM professionals WHERE id = $1`, [id]);
    return { message: 'Professionnel supprimé' };
  },
};

module.exports = Professional;
