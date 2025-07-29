
-- Table des types de professions (Pro type) (dentiste/marechal/osteo/ecurie)
CREATE TABLE professional_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_type_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des adresses (Adresses) (Addresses)
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'France',
    latitude VARCHAR(12),
    longitude VARCHAR(13),
    type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- Table des professionnels (Professional)
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    siret_number VARCHAR(14) UNIQUE NOT NULL,
    societe_name VARCHAR(50),
    professional_types_id UUID REFERENCES professional_types(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des utilisateurs (User)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    professional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison entre le user et son agenda (liste de users)
CREATE TABLE user_agenda (
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (owner_user_id, contact_user_id)
);


-- Table des clients (Client)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    is_societe BOOLEAN DEFAULT FALSE,
    societe_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison entre le client et le professionnel
CREATE TABLE customer_professionnal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    professionals_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    last_visit_date TIMESTAMP,
    next_visit_date TIMESTAMP,
    notes TEXT
);

-- Table de notes de liaison entre le client et le professionnel
CREATE TABLE customerProfessionnal_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    professionals_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    notes TEXT
);


-- Table de liaison entre le user et ses/son ecurie (liste d ecuries)
CREATE TABLE user_stable (
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    PRIMARY KEY (owner_user_id, stable_id)
);


-- Table des écuries (Stable)
CREATE TABLE stables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des types d'alimentation (Feed Type)
CREATE TABLE feed_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE horse_feed_types (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    feed_type_id UUID REFERENCES feed_types(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, feed_type_id)
);


-- Table des couleurs de chevaux (Horse Color)
CREATE TABLE horse_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE horse_colors_link (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    color_id UUID REFERENCES horse_colors(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, color_id)
);


-- Table des types d'activité des chevaux (Horse Activity Type)
CREATE TABLE horse_activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE horse_activity_types_link (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    activity_type_id UUID REFERENCES horse_activity_types(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, activity_type_id)
);


-- Table des races de chevaux (Horse Breed)
CREATE TABLE horse_breeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breed_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE horse_breeds_link (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    breed_id UUID REFERENCES horse_breeds(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, breed_id)
);


-- Table des chevaux (Horse)
CREATE TABLE horses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    stable_id UUID REFERENCES stables(id) ON DELETE SET NULL,
    addresse_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    last_visit_date TIMESTAMP,
    next_visit_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison entre chevaux et propriétaires (Horse Users)
CREATE TABLE horse_users (
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (horse_id, user_id)
);

-- Table des statuts d'événement (Event Status)
CREATE TABLE event_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_status_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des etats d'événement (Event States)
CREATE TABLE event_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_state_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des événements (Event)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    stable_id UUID REFERENCES stables(id) ON DELETE SET NULL,
    status_id UUID REFERENCES event_statuses(id) ON DELETE SET NULL,
    states_id UUID REFERENCES event_states(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des statuts de facture (Invoice Status)
CREATE TABLE invoice_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_status_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des types de paiement (Payment Type)
CREATE TABLE payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_type_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des observations
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


-- Table des factures (Invoice)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_type_id UUID REFERENCES payment_types(id) ON DELETE SET NULL,
    is_company BOOLEAN DEFAULT FALSE,
    billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    status_id UUID REFERENCES invoice_statuses(id) ON DELETE SET NULL,
    issue_date TIMESTAMP DEFAULT NOW(),
    next_visit INTEGER NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des détails de facture (Invoice Details)
CREATE TABLE invoice_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
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


-- Table des factures cheval (Invoice Horse)
CREATE TABLE invoices_Horse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- Table des liens des fichiers
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  url_fichier TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison des fichiers des users
CREATE TABLE files_users (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, user_id)
);

