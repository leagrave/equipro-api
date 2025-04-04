const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async createUser(email, password, role_id) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, role_id) VALUES ($1, $2, $3) RETURNING *`,
      [email, hashedPassword, role_id]
    );
    return result.rows[0];
  },

  async getUserById(id) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(`SELECT * FROM users`);
    return result.rows;
  },

  async updateUser(id, email, password, role_id) {
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const result = await pool.query(
      `UPDATE users SET email = $1, password = $2, role_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [email, hashedPassword, role_id, id]
    );
    return result.rows[0];
  },

  async deleteUser(id) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    return { message: 'Utilisateur supprimé' };
  },

  async comparePassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
};

module.exports = User;
