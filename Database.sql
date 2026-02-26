
CREATE TYPE job_status as ENUM('OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE user_role  as ENUM ('CLIENT','TASKER');
CREATE TYPE application_status as ENUM ('PENDING','ACCEPTED','REJECTED');
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
	role user_role DEFAULT 'CLIENT',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS jobs(
	id SERIAL PRIMARY KEY,
	client_id SERIAL REFERENCES users(id),
	title VARCHAR(100) NOT NULL,
	description VARCHAR(200) NOT NULL,
	budget DECIMAL(10,2) DEFAULT 0.00,
	status job_status DEFAULT 'OPEN',
	created_at TIMESTAMP DEFAULT NOW()

);
ALTER TABLE jobs ADD COLUMN client_id INTEGER REFERENCES users(id);
CREATE TABLE IF NOT EXISTS applications(
	id SERIAL PRIMARY KEY,
	job_id SERIAL REFERENCES jobs(id),
	tasker_id SERIAL REFERENCES users(id),
	status application_status DEFAULT 'PENDING',
	created_at TIMESTAMP DEFAULT NOW(),
	UNIQUE(job_id,tasker_id)

);
SELECT * FROM JOBS;