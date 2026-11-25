-- Python-owned tables (Module 3). Owner: Karthik.
-- Safe to run more than once: IF NOT EXISTS.

-- Every Google Form submission, exactly as received, plus our validation result.
CREATE TABLE IF NOT EXISTS form_responses (
    id               BIGSERIAL     PRIMARY KEY,
    submitted_at     TIMESTAMPTZ   NOT NULL,
    email_raw        VARCHAR(255)  NOT NULL DEFAULT '',   -- exactly as the student typed it
    email            VARCHAR(255),                        -- cleaned: trimmed + lowercase
    full_name        VARCHAR(150),
    college_name     VARCHAR(255),
    education        VARCHAR(50),
    subject          VARCHAR(100),
    year_of_passing  INTEGER,
    mobile           VARCHAR(20),
    district         VARCHAR(100),
    status           VARCHAR(20)   NOT NULL,              -- VALID / NEEDS_REVIEW / DUPLICATE
    problems         TEXT,                                -- why it needs review
    student_id       BIGINT        REFERENCES students (id),
    imported_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- One sheet row = one database row, even if the sync runs 1000 times
    CONSTRAINT uq_form_responses_row UNIQUE (submitted_at, email_raw),
    CONSTRAINT chk_form_responses_status CHECK (status IN ('VALID', 'NEEDS_REVIEW', 'DUPLICATE'))
);

CREATE INDEX IF NOT EXISTS idx_form_responses_email ON form_responses (email);


-- Emails Python sends, one row per student per kind of email.
CREATE TABLE IF NOT EXISTS email_jobs (
    id           BIGSERIAL    PRIMARY KEY,
    student_id   BIGINT       NOT NULL REFERENCES students (id),
    kind         VARCHAR(30)  NOT NULL,                   -- QR_PASS (more kinds later)
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING / SENT / FAILED
    attempts     INTEGER      NOT NULL DEFAULT 0,
    last_error   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    sent_at      TIMESTAMPTZ,

    -- The database itself refuses a second QR email job for the same student
    CONSTRAINT uq_email_jobs_student_kind UNIQUE (student_id, kind),
    CONSTRAINT chk_email_jobs_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);