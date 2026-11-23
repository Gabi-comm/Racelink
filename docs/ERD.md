# RaceLink ERD

Database: `racelink_v2` (MySQL 8.4, Amazon RDS). Source of truth: `lib/db/schema.ts`.

```mermaid
erDiagram
    user ||--o{ session : "logs in with"
    user ||--o{ account : "has"
    user ||--o| runner_profiles : "has"
    user ||--o{ events : "organizes"
    user ||--o{ bookings : "makes"
    events ||--o{ bookings : "receives"
    events ||--o{ event_distances : "offers"
    events ||--o{ event_sizes : "offers"
    events ||--o{ event_documents : "has"
    event_distances |o--o{ bookings : "chosen in"
    bookings ||--o{ payment_proofs : "paid with"
    user |o--o{ payment_proofs : "reviews"
    user |o--o{ event_documents : "uploads"
    user |o--o{ race_requests : "reviews"
    events |o--o{ race_requests : "created from"

    user {
        varchar id PK
        varchar name
        varchar email UK
        boolean email_verified
        text image
        varchar role "runner, organizer, admin"
        boolean banned
        text ban_reason
        timestamp ban_expires
        timestamp created_at
        timestamp updated_at
    }

    session {
        varchar id PK
        varchar user_id FK
        varchar token UK
        timestamp expires_at
        text ip_address
        text user_agent
        text impersonated_by
        timestamp created_at
        timestamp updated_at
    }

    account {
        varchar id PK
        varchar user_id FK
        text account_id
        text provider_id
        text password "hashed"
        text access_token
        text refresh_token
        text id_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        timestamp created_at
        timestamp updated_at
    }

    verification {
        varchar id PK
        varchar identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    runner_profiles {
        varchar user_id PK, FK
        varchar phone
        varchar address
        enum gender
        date birthdate
        varchar emergency_name
        varchar emergency_phone
        timestamp updated_at
    }

    events {
        int id PK
        varchar organizer_id FK
        varchar title
        text description
        varchar location
        date event_date
        time start_time
        date registration_closes
        int capacity
        enum status "draft, open, closed, cancelled"
        enum payment_method "gcash, bank"
        varchar payment_bank
        varchar payment_account_name
        varchar payment_account_number
        text payment_instructions
        varchar banner_key "S3 key"
        varchar requested_by
        int request_id
        timestamp created_at
        timestamp updated_at
    }

    event_distances {
        int id PK
        int event_id FK
        varchar label "UK with event_id"
        decimal price
        int slots
    }

    event_sizes {
        int id PK
        int event_id FK
        enum size "UK with event_id"
    }

    event_documents {
        int id PK
        int event_id FK
        varchar uploaded_by FK
        varchar title
        varchar file_key "S3 key"
        timestamp created_at
    }

    bookings {
        int id PK
        varchar user_id FK "UK with event_id"
        int event_id FK
        int distance_id FK
        varchar distance_label
        decimal price
        enum tshirt_size
        enum status "pending, approved, rejected, cancelled"
        int bib_number "UK with event_id"
        boolean attended
        timestamp checked_in_at
        timestamp created_at
        timestamp updated_at
    }

    payment_proofs {
        int id PK
        int booking_id FK
        varchar reviewed_by FK
        varchar file_key "S3 key"
        decimal amount
        varchar reference_no
        enum status "pending, approved, rejected"
        varchar review_note
        timestamp reviewed_at
        timestamp created_at
    }

    race_requests {
        int id PK
        int event_id FK
        varchar reviewed_by FK
        varchar organization
        varchar contact_name
        varchar email
        varchar phone
        varchar race_title
        date proposed_date
        varchar location
        int expected_runners
        varchar distances
        text message
        enum status "pending, approved, rejected"
        varchar review_note
        timestamp reviewed_at
        timestamp created_at
    }
```

## Foreign keys and delete rules

| Column | References | On delete |
| --- | --- | --- |
| `session.user_id` | `user.id` | cascade |
| `account.user_id` | `user.id` | cascade |
| `runner_profiles.user_id` | `user.id` | cascade |
| `events.organizer_id` | `user.id` | restrict |
| `bookings.user_id` | `user.id` | cascade |
| `bookings.event_id` | `events.id` | cascade |
| `bookings.distance_id` | `event_distances.id` | set null |
| `event_distances.event_id` | `events.id` | cascade |
| `event_sizes.event_id` | `events.id` | cascade |
| `event_documents.event_id` | `events.id` | cascade |
| `event_documents.uploaded_by` | `user.id` | set null |
| `payment_proofs.booking_id` | `bookings.id` | cascade |
| `payment_proofs.reviewed_by` | `user.id` | set null |
| `race_requests.reviewed_by` | `user.id` | set null |
| `race_requests.event_id` | `events.id` | set null |

## Unique rules

- `user.email` and `session.token` are unique.
- One booking per runner per race: (`bookings.user_id`, `bookings.event_id`).
- No duplicate bib in a race: (`bookings.event_id`, `bookings.bib_number`).
- No duplicate distance or shirt size in a race: (`event_id`, `label`) and (`event_id`, `size`).

## Legend

- `||--o{` one to many, `||--o|` one to zero-or-one, `|o--o{` optional one to many.
- `PK` primary key, `FK` foreign key, `UK` unique.
- `user`, `session`, `account` and `verification` are managed by Better Auth.
