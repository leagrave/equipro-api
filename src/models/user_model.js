const sql = require('../config/db');

const User = {
  async create(email, password, firstName, lastName, phone, phone2, roleId, address, billingAddress, city, postalCode, civility, isCompany, professionalId, notes, lastVisitDate, nextVisitDate) {
    const result = await sql`
      INSERT INTO users (email, password, first_name, last_name, phone, phone2, role_id, address, billing_address, city, postal_code, civility, is_company, professional_id, notes, last_visit_date, next_visit_date)
      VALUES (${email}, ${password}, ${firstName}, ${lastName}, ${phone}, ${phone2}, ${roleId}, ${address}, ${billingAddress}, ${city}, ${postalCode}, ${civility}, ${isCompany}, ${professionalId}, ${notes}, ${lastVisitDate}, ${nextVisitDate})
      RETURNING *;
    `;
    return result[0];
  },

  async getAll() {
    return await sql`SELECT * FROM users`;
  },

  async getByEmail(email) {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0];
  }
};

module.exports = User;
