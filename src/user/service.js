const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require("uuid");
const admin = require('../config/firebase');

const User = {
  async createUser(email, password, first_name, last_name, professional) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const uid = uuidv4();
    const cleanUid = uid.replace(/-/g, '');

    const result = await pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, professional) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cleanUid, email, hashedPassword, first_name, last_name, professional]
    );

    // crée le user dans firebase
    this.syncUserWithFirebase(cleanUid,email,password,first_name,"")


    return result.rows[0];
  },

  // Fonction appelée après inscription côté PostgreSQL
  async syncUserWithFirebase(uid, email, password, displayName, photoURL) {
  
    try {
      // 1. Créer un utilisateur Firebase Auth (si pas déjà présent)
      const userData= {
        uid,
        email,
        password,
        displayName,
      };
  
      // Ajouter photoURL seulement si c'est une URL valide
      if (photoURL && isValidUrl(photoURL)) {
        userData.photoURL = photoURL;
      }
  
      const userRecord = await admin.auth().createUser(userData);
  
      // 2. Ajouter ce user à Firestore pour la messagerie
      await admin.firestore().collection('users').doc(uid).set({
        uid,
        email,
        displayName,
        photoURL: photoURL || "",
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        fcmToken: "", // à mettre à jour depuis Flutter
      });
  
      console.log("Utilisateur Firebase créé :", email);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log("Utilisateur déjà existant dans Firebase Auth");
      } else {
        console.error("Erreur lors de la création Firebase :", error);
      }
    }
  },
  

  async getUserById(id) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async getUserProById(id) {
    const result = await pool.query(`
      SELECT 
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.professional,
      u.password,

      -- Professional info
      p.id AS professional_id,
      p.phone,
      p.phone2,
      p.siret_number,
      p.societe_name,
      p.is_verified,

      -- Professional type
      pt.id AS professional_type_id,
      pt.professional_type_name,

      -- Address
      a.id AS address_id,
      a.address,
      a.city,
      a.postal_code,
      a.country,
      a.latitude,
      a.longitude,
      a.type

    FROM users u
    LEFT JOIN professionals p ON u.id = p.user_id
    LEFT JOIN professional_types pt ON p.professional_types_id = pt.id
    LEFT JOIN addresses a ON p.address_id = a.id
    WHERE u.id = $1
    AND u.professional = true;
    `, [id]);

     const row = result.rows[0];

    
    if (!row) return null;

      // Construction manuelle de l'objet structuré
      return {
        id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        professional: row.professional,
        password: row.password,
        is_societe: true, 
        is_verified: row.is_verified,
        societe_name: row.societe_name,
        siret_number: row.siret_number,
        phone: row.phone,
        phone2: row.phone2,
        last_visit_date: null,
        next_visit_date: null,
        notes: "",
        professional_type_id: row.professional_type_id,
        professional_type_name: row.professional_type_name,
        addresses: row.address_id ? [
          {
            id: row.address_id,
            address: row.address,
            city: row.city,
            postal_code: row.postal_code,
            country: row.country,
            latitude: row.latitude,
            longitude: row.longitude,
            type: row.type
          }
        ] : [],
        horses: []
      };
},

  

  async getAllUsers() {
    const result = await pool.query(`SELECT * FROM users`);
    return result.rows;
  },

  async updateUser(email, password, role_id, id) {
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
  },

  async checkEmailExists(email) {
    const { rows } = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return rows.length > 0;
  },



  /**
   * Ajoute ou met à jour une adresse en fonction de la présence d’un idAddress
   */
  async upsertAddress(client, userId, addressData) {
    const { idAddress, address, city, postalCode, country, type } = addressData;

    if (idAddress !== undefined && idAddress !== null) {
      const checkRes = await client.query(
        'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
        [idAddress, userId]
      );
      if (checkRes.rows.length === 0) {
        throw new Error(`Adresse avec id ${idAddress} non trouvée pour cet utilisateur.`);
      }

      await client.query(
        `UPDATE addresses SET address = $1, city = $2, postal_code = $3, country = $4, updated_at = NOW()
        WHERE id = $5`,
        [address, city, postalCode , country, idAddress]
      );
      return idAddress;
    } else {
      const insertRes = await client.query(
        `INSERT INTO addresses (user_id, address, city, postal_code, country, type)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, address, city, postalCode, country , type]
      );
      return insertRes.rows[0].id;
    }
  },

  /**
   * Met à jour un utilisateur et ses rôles/adresses associés
   */
  async updateUserAndRole(userId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        firstname,
        lastname,
        email,
        password,
        phone,
        phone2,
        siretNumber,
        societeName,
        isSociete,
        role,
        idProfessional,
        addresses = []
      } = data;

 

      const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) throw new Error("Utilisateur non trouvé.");

      // Mise à jour des champs utilisateur
      const updates = [];
      const values = [];
      let index = 1;

      const fields = { firstname, lastname, email };
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== user[key]) {
          updates.push(`${key} = $${index++}`);
          values.push(value);
        }
      }

      if (password) {
        const samePassword = await bcrypt.compare(password, user.password);
        if (!samePassword) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updates.push(`password = $${index++}`);
          values.push(hashedPassword);
        }
      }

      if (updates.length > 0) {
        values.push(userId);
        await client.query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${index}`,
          values
        );
      }

      // Gestion des adresses (main et billing)
      const mainAddress = addresses.find(a => a.type === 'main');
      const billingAddress = addresses.find(a => a.type === 'billing');

      const addressId = mainAddress ? await this.upsertAddress(client, userId, mainAddress) : null;
      const billingId = billingAddress ? await this.upsertAddress(client, userId, billingAddress) : null;

      if (role === 'professionnel') {
        const proRes = await client.query('SELECT * FROM professionals WHERE user_id = $1', [userId]);
        const existing = proRes.rows[0];
        //const addressId = await this.upsertAddress(client, userId, mainAddress); 

        if (existing) {
          const updates = [];
          const values = [];
          let i = 1;

          if (siretNumber !== undefined && siretNumber !== existing.siretNumber) {
            updates.push(`siret_number = $${i++}`);
            values.push(siretNumber);
          }
          if (phone !== undefined && phone !== existing.phone) {
            updates.push(`phone = $${i++}`);
            values.push(phone);
          }
          if (phone2 !== undefined && phone2 !== existing.phone2) {
            updates.push(`phone2 = $${i++}`);
            values.push(phone2);
          }
          if (societeName !== undefined && societeName !== existing.societeName) {
            updates.push(`societe_name = $${i++}`);
            values.push(societeName);
          }
          if (existing.address_id !== addressId) {
            updates.push(`address_id = $${i++}`);
            values.push(addressId);
          }
          if (idProfessional !== undefined && idProfessional !== existing.idProfessional) {
            updates.push(`professional_types_id = $${i++}`);
            values.push(idProfessional);
          }
          if (updates.length > 0) {
            values.push(userId);
            await client.query(
              `UPDATE professionals SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${i}`,
              values
            );
          }
        } else {
          await client.query(
            `INSERT INTO professionals (user_id, siret_number, phone, phone2, societe_name, professional_types_id, is_verified, address_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, siretNumber, phone, phone2, societeName, idProfessional,false, addressId]
          );
        }
      }

      if (role === 'particulier') {
        const custRes = await client.query('SELECT * FROM customers WHERE user_id = $1', [userId]);
        const existing = custRes.rows[0];
        const addressId = await this.upsertAddress(client, userId, mainAddress);
        //const billingId = billingAddress ? await upsertAddress(client, userId, billingAddress) : null;

        if (existing) {
          const updates = [];
          const values = [];
          let i = 1;

          if (phone !== undefined && phone !== existing.phone) {
            updates.push(`phone = $${i++}`);
            values.push(phone);
          }
          if (phone2 !== undefined && phone2 !== existing.phone2) {
            updates.push(`phone2 = $${i++}`);
            values.push(phone2);
          }
          if (societeName !== undefined && societeName !== existing.societeName) {
            updates.push(`societe_name = $${i++}`);
            values.push(societeName);
          }
          if (existing.address_id !== addressId) {
            updates.push(`address_id = $${i++}`);
            values.push(addressId);
          }

          if (billingId && existing.billing_address_id !== billingId) {
            updates.push(`billing_address_id = $${i++}`);
            values.push(billingId);
          }

          if (updates.length > 0) {
            values.push(userId);
            const whereIndex = values.length;
            await client.query(
              `UPDATE customers SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${whereIndex}`,
              values
            );
          }
        } else {
          await client.query(
            `INSERT INTO customers (user_id, phone, phone2, is_societe, address_id, billing_address_id, societe_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, phone, phone2, isSociete, addressId, billingId, societeName]
          );
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Utilisateur mis à jour avec succès.' };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur updateUserAndRole :', err);
      throw err;
    } finally {
      client.release();
    }
  },


}

module.exports = User;
