-- Table des rôles (Role) (admin/client/profesionnel)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des rôles (Role) (dentiste/marechal/osteo/ecurie)
CREATE TABLE professional_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_type_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table des professionnels (Professional)
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

-- Table des utilisateurs (User)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des clients (Client)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    users_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    address TEXT,
    billing_address TEXT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    civility VARCHAR(10) CHECK (civility IN ('M.', 'Mme', 'Mlle')),
    is_societe BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison entre le client et le professionnel
CREATE TABLE customer_professionnal (
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    profesionnel_id UUID REFERENCES professionnels(id) ON DELETE CASCADE,
    last_visit_date TIMESTAMP,
    next_visit_date TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (customer_id, profesionnel_id)
);

-- Table des écuries (Stable)
CREATE TABLE stables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des types d'alimentation (Feed Type)
CREATE TABLE feed_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table des couleurs de chevaux (Horse Color)
CREATE TABLE horse_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table des types d'activité des chevaux (Horse Activity Type)
CREATE TABLE horse_activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table des races de chevaux (Horse Breed)
CREATE TABLE horse_breeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breed_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table des chevaux (Horse)
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
    address TEXT NOT NULL,
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
    billing_address TEXT NOT NULL,
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

-- Table des factures client (Invoice Customer)
CREATE TABLE invoices_Horse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


