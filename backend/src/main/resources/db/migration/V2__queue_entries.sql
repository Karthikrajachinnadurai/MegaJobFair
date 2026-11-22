-- V2: waiting-list entries for Module 2 (queue and interview)
-- Owner: Deva. Never edit after it has run; add V3__... instead.

CREATE TABLE queue_entries (
                               id               BIGSERIAL PRIMARY KEY,
                               registration_id  BIGINT       NOT NULL REFERENCES registrations (id),
                               student_id       BIGINT       NOT NULL REFERENCES students (id),
                               company_id       BIGINT       NOT NULL REFERENCES companies (id),
                               state            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
                               scanned_by       BIGINT       REFERENCES users (id),
                               joined_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
                               left_at          TIMESTAMPTZ,
                               CONSTRAINT chk_queue_entries_state CHECK (state IN ('ACTIVE', 'DROPPED', 'DONE'))
);

-- The "one queue at a time" rule, enforced by the database itself:
-- a student can have at most ONE row with state = 'ACTIVE'.
CREATE UNIQUE INDEX uq_queue_one_active_per_student
    ON queue_entries (student_id) WHERE state = 'ACTIVE';

-- The waiting list screen: "active entries of company X, oldest first".
CREATE INDEX idx_queue_company_state_joined
    ON queue_entries (company_id, state, joined_at);