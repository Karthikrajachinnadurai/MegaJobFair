-- V1: core tables for Module 1 (companies, users, students, attendance, registrations)
-- Owner: Arun. Never edit this file after it has been run; add V2__..., V3__... instead.

CREATE TABLE companies (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL UNIQUE,
    description    VARCHAR(1000),
    roles_offered  VARCHAR(500),
    cabin_no       VARCHAR(50),
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    role           VARCHAR(30)   NOT NULL,
    company_id     BIGINT        REFERENCES companies (id),
    enabled        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_role
        CHECK (role IN ('ADMIN', 'STUDENT', 'GATE_VOLUNTEER', 'COMPANY_VOLUNTEER', 'HR')),
    -- company volunteers and HR must belong to a company; nobody else may
    CONSTRAINT chk_users_company
        CHECK ((role IN ('COMPANY_VOLUNTEER', 'HR')) = (company_id IS NOT NULL))
);

-- Rows are inserted by the Python import (Google Form). user_id is filled at gate check-in.
CREATE TABLE students (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    register_no    VARCHAR(50),
    department     VARCHAR(100),
    study_year     INTEGER,
    phone          VARCHAR(20),
    qr_token       VARCHAR(100)  NOT NULL UNIQUE,
    user_id        BIGINT        UNIQUE REFERENCES users (id),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- One row per student: the UNIQUE on student_id is what makes check-in happen only once.
CREATE TABLE attendance (
    id             BIGSERIAL PRIMARY KEY,
    student_id     BIGINT        NOT NULL UNIQUE REFERENCES students (id),
    scanned_by     BIGINT        REFERENCES users (id),
    checked_in_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE registrations (
    id                BIGSERIAL PRIMARY KEY,
    student_id        BIGINT        NOT NULL REFERENCES students (id),
    company_id        BIGINT        NOT NULL REFERENCES companies (id),
    status            VARCHAR(30)   NOT NULL DEFAULT 'REGISTERED',
    company_qr_token  VARCHAR(100)  NOT NULL UNIQUE,
    registered_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_registrations_student_company UNIQUE (student_id, company_id),
    CONSTRAINT chk_registrations_status
        CHECK (status IN ('REGISTERED', 'WAITING', 'IN_INTERVIEW', 'SELECTED', 'REJECTED'))
);

-- Live waiting counts are "count by company and status", so index exactly that.
CREATE INDEX idx_registrations_company_status ON registrations (company_id, status);
