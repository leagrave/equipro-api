// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

// Table des rôles (Role) (admin/client/profesionnel)
Table roles {
    id UUID [primary key]
    role_name VARCHAR(50) [unique, not null]
}

// Table des rôles professionnels (dentiste/marechal/osteo/ecurie)
Table professional_types {
    id UUID [primary key]
    professional_type_name VARCHAR(50) [unique, not null]
}

// Table des professionnels (Professional)
Table professionals {
    id UUID [primary key]
    phone VARCHAR(20)
    phone2 VARCHAR(20)
    address TEXT
    city VARCHAR(100) [not null]
    postal_code VARCHAR(20) [not null]
    siren_number VARCHAR(20) [unique, not null]
    societe_name VARCHAR(50)
    professional_types_id UUID [ref: > professional_types.id]
    is_verified BOOLEAN [default: false]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des utilisateurs (User)
Table users {
    id UUID [primary key]
    email VARCHAR(255) [unique, not null]
    password TEXT
    role_id UUID [ref: > roles.id]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des clients (Client)
Table customers {
    id UUID [primary key]
    users_id UUID [ref: > users.id]
    first_name VARCHAR(100) [not null]
    last_name VARCHAR(100) [not null]
    phone VARCHAR(20)
    phone2 VARCHAR(20)
    role_id UUID [ref: > roles.id]
    address TEXT
    billing_address TEXT
    city VARCHAR(100) [not null]
    postal_code VARCHAR(20) [not null]
    civility VARCHAR(10)
    is_societe BOOLEAN [default: false]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table de liaison entre le client et le professionnel
Table customer_professionnal {
    id UUID [primary key]
    customer_id UUID [ref: > customers.id]
    profesionnel_id UUID [ref: > professionals.id]
    pro_id UUID [ref: > professionals.id]
    last_visit_date TIMESTAMP
    next_visit_date TIMESTAMP
    notes TEXT
}

// Table des écuries (Stable)
Table stables {
    id UUID [primary key]
    name VARCHAR(255) [not null]
    address TEXT [not null]
    city VARCHAR(100) [not null]
    country VARCHAR(100) [not null]
    owner_id UUID [ref: > users.id]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des types d'alimentation (Feed Type)
Table feed_types {
    id UUID [primary key]
    feed_name VARCHAR(100) [unique, not null]
}

// Table des couleurs de chevaux (Horse Color)
Table horse_colors {
    id UUID [primary key]
    color_name VARCHAR(100) [unique, not null]
}

// Table des types d'activité des chevaux (Horse Activity Type)
Table horse_activity_types {
    id UUID [primary key]
    activity_name VARCHAR(100) [unique, not null]
}

// Table des races de chevaux (Horse Breed)
Table horse_breeds {
    id UUID [primary key]
    breed_name VARCHAR(100) [unique, not null]
}

// Table des chevaux (Horse)
Table horses {
    id UUID [primary key]
    name VARCHAR(100) [not null]
    age INTEGER [not null]
    breed_id UUID [ref: > horse_breeds.id]
    stable_id UUID [ref: > stables.id]
    feed_type_id UUID [ref: > feed_types.id]
    color_id UUID [ref: > horse_colors.id]
    activity_type_id UUID [ref: > horse_activity_types.id]
    address TEXT [not null]
    last_visit_date TIMESTAMP
    next_visit_date TIMESTAMP
    notes TEXT
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table de liaison entre chevaux et propriétaires (Horse Owners)
Table horse_owners {
    horse_id UUID [ref: > horses.id]
    owner_id UUID [ref: > users.id]
    primary key(horse_id, owner_id)
}

// Table des statuts d'événement (Event Status)
Table event_statuses {
    id UUID [primary key]
    event_status_name VARCHAR(50) [unique, not null]
}

// Table des états d'événement (Event States)
Table event_states {
    id UUID [primary key]
    event_state_name VARCHAR(50) [unique, not null]
}

// Table des événements (Event)
Table events {
    id UUID [primary key]
    title VARCHAR(255) [not null]
    description TEXT
    event_date TIMESTAMP [not null]
    start_date TIMESTAMP [not null]
    end_date TIMESTAMP [not null]
    start_time TIME [not null]
    end_time TIME [not null]
    address TEXT [not null]
    stable_id UUID [ref: > stables.id]
    status_id UUID [ref: > event_statuses.id]
    states_id UUID [ref: > event_states.id]
    user_id UUID [ref: > users.id]
    horse_id UUID [ref: > horses.id]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des statuts de facture (Invoice Status)
Table invoice_statuses {
    id UUID [primary key]
    invoice_status_name VARCHAR(50) [unique, not null]
}

// Table des types de paiement (Payment Type)
Table payment_types {
    id UUID [primary key]
    payment_type_name VARCHAR(50) [unique, not null]
}

// Table des observations
Table external_observations {
    id UUID [primary key]
    observation_name VARCHAR(255) [unique, not null]
}

Table incisive_observations {
    id UUID [primary key]
    observation_name VARCHAR(255) [unique, not null]
}

Table mucous_observations {
    id UUID [primary key]
    observation_name VARCHAR(255) [unique, not null]
}

Table internal_observations {
    id UUID [primary key]
    observation_name VARCHAR(255) [unique, not null]
}

Table other_observations {
    id UUID [primary key]
    observation_name VARCHAR(255) [unique, not null]
}

// Table des factures (Invoice)
Table invoices {
    id UUID [primary key]
    user_id UUID [ref: > users.id]
    horse_id UUID [ref: > horses.id]
    total_amount DECIMAL(10,2) [not null]
    is_paid BOOLEAN [default: false]
    payment_type_id UUID [ref: > payment_types.id]
    is_company BOOLEAN [default: false]
    billing_address TEXT [not null]
    status_id UUID [ref: > invoice_statuses.id]
    issue_date TIMESTAMP
    next_visit INTEGER [not null]
    due_date TIMESTAMP [not null]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des détails de facture (Invoice Details)
Table invoice_details {
    id UUID [primary key]
    invoice_id UUID [ref: > invoices.id]
    description TEXT
    amount DECIMAL(10,2)
    external_observations UUID[] [ref: > external_observations.id]
    incisive_observations UUID[] [ref: > incisive_observations.id]
    mucous_observations UUID[]  [ref: > mucous_observations.id]
    internal_observations UUID[] [ref: > internal_observations.id]
    other_observations UUID[]  [ref: > other_observations.id]
    external_notes TEXT
    incisive_notes TEXT
    mucous_notes TEXT
    internal_notes TEXT
    other_notes TEXT
    care_observation TEXT
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des factures cheval (Invoice Horse)
Table invoices_Horse {
    id UUID [primary key]
    invoice_id UUID [ref: > invoices.id]
    horse_id UUID [ref: > horses.id]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}

// Table des factures client (Invoice Customer)
Table invoices_Customer {
    id UUID [primary key]
    invoice_id UUID [ref: > invoices.id]
    customer_id UUID [ref: > customers.id]
    created_at TIMESTAMP
    updated_at TIMESTAMP
}


