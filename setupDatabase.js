require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Pour PostgreSQL Neon
});

// Liste des tables à créer
const createTables = `


CREATE TABLE professional_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_type_name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address TEXT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    siren_number VARCHAR(20) UNIQUE NOT NULL,
    societe_name VARCHAR(50),
    professional_types_id UUID REFERENCES professional_types(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    professional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_agenda (
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (owner_user_id, contact_user_id)
);


CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    users_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address TEXT,
    billing_address TEXT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    civility VARCHAR(10) CHECK (civility IN ('M.', 'Mme', 'Mlle')),
    is_societe BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE customer_professionnal (
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    profesionnel_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    pro_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    last_visit_date TIMESTAMP,
    next_visit_date TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (customer_id, profesionnel_id)
);


CREATE TABLE stables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE feed_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_name VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE horse_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_name VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE horse_activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE horse_breeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breed_name VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE horses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    breed_id UUID REFERENCES horse_breeds(id) ON DELETE SET NULL,
    stable_id UUID REFERENCES stables(id) ON DELETE SET NULL,
    feed_type_id UUID REFERENCES feed_types(id) ON DELETE SET NULL,
    color_id UUID REFERENCES horse_colors(id) ON DELETE SET NULL,
    activity_type_id UUID REFERENCES horse_activity_types(id) ON DELETE SET NULL,
    address TEXT NOT NULL,
    last_visit_date TIMESTAMP,
    next_visit_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE horse_owners (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, owner_id)
);


CREATE TABLE event_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_status_name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE event_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_state_name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    address TEXT NOT NULL,
    stable_id UUID REFERENCES stables(id) ON DELETE SET NULL,
    status_id UUID REFERENCES event_statuses(id) ON DELETE SET NULL,
    states_id UUID REFERENCES event_states(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE invoice_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_status_name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_type_name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE external_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE incisive_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE mucous_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE internal_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE other_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_name VARCHAR(255) UNIQUE NOT NULL
);



CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_type_id UUID REFERENCES payment_types(id) ON DELETE SET NULL,
    is_company BOOLEAN DEFAULT FALSE,
    billing_address TEXT NOT NULL,
    status_id UUID REFERENCES invoice_statuses(id) ON DELETE SET NULL,
    issue_date TIMESTAMP DEFAULT NOW(),
    next_visit INTEGER NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoice_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
    amount DECIMAL(10,2),
    external_observations UUID[], 
    incisive_observations UUID[], 
    mucous_observations UUID[],  
    internal_observations UUID[],
    other_observations UUID[],  
    external_notes TEXT,
    incisive_notes TEXT,
    mucous_notes TEXT,
    internal_notes TEXT,
    other_notes TEXT,
    care_observation TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE invoices_Horse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


`;

async function setupDatabase() {
  try {
    await client.connect();
    console.log("Connexion à PostgreSQL réussie");

    await client.query(createTables);
    console.log("Tables créées avec succès");

  } catch (err) {
    console.error("Erreur lors de l'exécution du script:", err);
  } finally {
    await client.end();
    console.log("Connexion fermée");
  }
}

setupDatabase();
