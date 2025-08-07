const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Intervention = {
    async createIntervention(data) {
        const {
            user_id,
            horse_id,
            pro_id,
            description,
            external_notes,
            incisive_notes,
            mucous_notes,
            internal_notes,
            other_notes,
            care_observation,
            intervention_date,
            external_observations = [],
            incisive_observations = [],
            mucous_observations = [],
            internal_observations = [],
            other_observations = [],
        } = data;

        const id = uuidv4();
        const interventionDate = intervention_date || new Date();

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO interventions (
                    id, user_id, horse_id, pro_id,
                    description, external_notes, incisive_notes,
                    mucous_notes, internal_notes, other_notes,
                    care_observation, intervention_date
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12
                )`,
                [
                    id, user_id, horse_id, pro_id,
                    description, external_notes, incisive_notes,
                    mucous_notes, internal_notes, other_notes,
                    care_observation, interventionDate
                ]
            );

            const insertObservations = async (table, observations) => {
                const validTables = [
                    'intervention_external_observations',
                    'intervention_incisive_observations',
                    'intervention_mucous_observations',
                    'intervention_internal_observations',
                    'intervention_other_observations'
                ];
                if (!validTables.includes(table)) {
                    throw new Error(`Invalid observation table: ${table}`);
                }

                for (const obsId of observations) {
                    await client.query(
                        `INSERT INTO ${table} (intervention_id, observation_id) VALUES ($1, $2)`,
                        [id, obsId]
                    );
                }
            };

            await insertObservations('intervention_external_observations', external_observations);
            await insertObservations('intervention_incisive_observations', incisive_observations);
            await insertObservations('intervention_mucous_observations', mucous_observations);
            await insertObservations('intervention_internal_observations', internal_observations);
            await insertObservations('intervention_other_observations', other_observations);

            await client.query('COMMIT');
            return { id };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },


async getInterventionByUserId(userId) {
  const res = await pool.query(
    `
    SELECT 
      i.id,
      i.description,
      i.care_observation,
      i.intervention_date,
      i.created_at,
      i.updated_at,
      i.external_notes,
      i.incisive_notes,
      i.mucous_notes,
      i.internal_notes,
      i.other_notes,

      jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'email', p.email
      ) AS professional,

      jsonb_build_object(
        'id', h.id,
        'name', h.name,
        'age', h.age
      ) AS horse,

      -- Liste des utilisateurs liés au cheval
      (
        SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email
        )), '[]')
        FROM horse_users hu
        JOIN users u ON u.id = hu.user_id
        WHERE hu.horse_id = h.id
      ) AS users,

      -- Notes d’observations
      (
        SELECT json_agg(eo.label) FROM intervention_external_observations ieo
        JOIN external_observations eo ON eo.id = ieo.observation_id
        WHERE ieo.intervention_id = i.id
      ) AS external_observations,

      (
        SELECT json_agg(io.label) FROM intervention_internal_observations iio
        JOIN internal_observations io ON io.id = iio.observation_id
        WHERE iio.intervention_id = i.id
      ) AS internal_observations,

      (
        SELECT json_agg(mo.label) FROM intervention_mucous_observations imo
        JOIN mucous_observations mo ON mo.id = imo.observation_id
        WHERE imo.intervention_id = i.id
      ) AS mucous_observations,

      (
        SELECT json_agg(inc.label) FROM intervention_incisive_observations iinc
        JOIN incisive_observations inc ON inc.id = iinc.observation_id
        WHERE iinc.intervention_id = i.id
      ) AS incisive_observations,

      (
        SELECT json_agg(oo.label) FROM intervention_other_observations ioo
        JOIN other_observations oo ON oo.id = ioo.observation_id
        WHERE ioo.intervention_id = i.id
      ) AS other_observations,

      -- Facture liée
      (
        SELECT jsonb_build_object(
          'id', f.id,
          'price', f.price,
          'payment_status', f.payment_status,
          'due_date', f.due_date,
          'payment_date', f.payment_date,
          'created_at', f.created_at
        )
        FROM invoices f
        WHERE f.intervention_id = i.id
        LIMIT 1
      ) AS invoice

    FROM interventions i
    JOIN horses h ON h.id = i.horse_id
    JOIN users p ON p.id = i.professional_id
    WHERE h.id IN (
      SELECT horse_id FROM horse_users WHERE user_id = $1
    )
    ORDER BY i.intervention_date DESC
    `,
    [userId]
  );

  return res.rows;
},



async getInterventionByHorseId (horseId) {
  const interventionsRes = await pool.query(
    `SELECT * FROM interventions WHERE horse_id = $1 ORDER BY intervention_date DESC`,
    [horseId]
  );

  const interventions = interventionsRes.rows;

  const result = [];

  for (const intervention of interventions) {
    const [
      usersRes,
      horseRes,
      invoiceRes,
      externalObsRes,
      incisiveObsRes,
      mucousObsRes,
      internalObsRes,
      otherObsRes
    ] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.professional 
         FROM horse_users hu 
         JOIN users u ON u.id = hu.user_id 
         WHERE hu.horse_id = $1`,
        [intervention.horse_id]
      ),
      pool.query(
        `SELECT id, name, age, stable_id, addresse_id, last_visit_date, next_visit_date, notes 
         FROM horses WHERE id = $1`,
        [intervention.horse_id]
      ),
      pool.query(`SELECT * FROM invoices WHERE intervention_id = $1`, [intervention.id]),
      pool.query(
        `SELECT eo.name 
         FROM intervention_external_observations ieo 
         JOIN external_observations eo ON eo.id = ieo.observation_id 
         WHERE ieo.intervention_id = $1`,
        [intervention.id]
      ),
      pool.query(
        `SELECT io.name 
         FROM intervention_incisive_observations iio 
         JOIN incisive_observations io ON io.id = iio.observation_id 
         WHERE iio.intervention_id = $1`,
        [intervention.id]
      ),
      pool.query(
        `SELECT mo.name 
         FROM intervention_mucous_observations imo 
         JOIN mucous_observations mo ON mo.id = imo.observation_id 
         WHERE imo.intervention_id = $1`,
        [intervention.id]
      ),
      pool.query(
        `SELECT io.name 
         FROM intervention_internal_observations iio 
         JOIN internal_observations io ON io.id = iio.observation_id 
         WHERE iio.intervention_id = $1`,
        [intervention.id]
      ),
      pool.query(
        `SELECT oo.name 
         FROM intervention_other_observations ioo 
         JOIN other_observations oo ON oo.id = ioo.observation_id 
         WHERE ioo.intervention_id = $1`,
        [intervention.id]
      )
    ]);

    result.push({
      id: intervention.id,
      description: intervention.description,
      care_observation: intervention.care_observation,
      intervention_date: intervention.intervention_date,
      created_at: intervention.created_at,
      updated_at: intervention.updated_at,
      users: usersRes.rows,
      horse: horseRes.rows[0] || null,
      professional: usersRes.rows.find(u => u.professional) || null,
      invoice: invoiceRes.rows[0] || null,
      external_notes: intervention.external_notes,
      incisive_notes: intervention.incisive_notes,
      mucous_notes: intervention.mucous_notes,
      internal_notes: intervention.internal_notes,
      other_notes: intervention.other_notes,
      external_observations: externalObsRes.rows.map(row => row.name),
      incisive_observations: incisiveObsRes.rows.map(row => row.name),
      mucous_observations: mucousObsRes.rows.map(row => row.name),
      internal_observations: internalObsRes.rows.map(row => row.name),
      other_observations: otherObsRes.rows.map(row => row.name)
    });
  }

  return result;
},

async getByUserId(userId) {
    const res = await pool.query(
        `SELECT 
            i.*,
            h.name AS horse,
            json_agg(
                json_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name
                )
            ) AS users,
            json_build_object(
                'id', p.id,
                'first_name', p.first_name,
                'last_name', p.last_name
            ) AS professional
        FROM interventions i
        JOIN intervention_users iu ON iu.intervention_id = i.id
        JOIN users u ON u.id = iu.user_id
        JOIN horses h ON h.id = i.horse_id
        JOIN users p ON p.id = i.pro_id
        WHERE iu.user_id = $1
        GROUP BY i.id, h.name, p.id
        ORDER BY i.intervention_date DESC;`,
        [userId]
    );
    //console.log(res.rows);
    return res.rows;
},


async getByHorseId(horseId) {
    const res = await pool.query(
        `SELECT 
            i.*,
            h.name AS horse,
            json_agg(
                json_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name
                )
            ) AS users,
            json_build_object(
                'id', p.id,
                'first_name', p.first_name,
                'last_name', p.last_name
            ) AS professional
        FROM interventions i
        JOIN intervention_users iu ON iu.intervention_id = i.id
        JOIN users u ON u.id = iu.user_id
        JOIN horses h ON h.id = i.horse_id
        JOIN users p ON p.id = i.pro_id
        WHERE i.horse_id = $1
        GROUP BY i.id, h.name, p.id
        ORDER BY i.intervention_date DESC;`,
        [horseId]
    );
    //console.log(res.rows)
    return res.rows;
},


    async getByProId(proId) {
        const res = await pool.query(
            `SELECT * FROM interventions WHERE pro_id = $1 ORDER BY intervention_date DESC`,
            [proId]
        );
        return res.rows;
    },

    async updateIntervention(id, data) {
        const {
            description,
            external_notes,
            incisive_notes,
            mucous_notes,
            internal_notes,
            other_notes,
            care_observation,
            intervention_date
        } = data;

        await pool.query(
            `UPDATE interventions SET
                description = $1,
                external_notes = $2,
                incisive_notes = $3,
                mucous_notes = $4,
                internal_notes = $5,
                other_notes = $6,
                care_observation = $7,
                intervention_date = $8,
                updated_at = NOW()
            WHERE id = $9`,
            [
                description, external_notes, incisive_notes,
                mucous_notes, internal_notes, other_notes,
                care_observation, intervention_date, id
            ]
        );
    },

    async deleteIntervention(id) {
        await pool.query(`DELETE FROM interventions WHERE id = $1`, [id]);
    }
};

module.exports = Intervention;
