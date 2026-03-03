# 🏠 Household Services Marketplace API

A RESTful API for connecting **Clients** who need household services with **Taskers** who provide them. Built with Express.js, TypeScript, and PostgreSQL.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Setup & Installation](#-setup--installation)
- [API Endpoints](#-api-endpoints)
  - [Users](#-users)
  - [Jobs](#-jobs)
  - [Applications](#-applications)
- [Authentication](#-authentication)
- [Application Flow](#-application-flow)
- [ENUMs Reference](#-enums-reference)

---

## 🛠 Tech Stack

| Technology             | Purpose                 |
| ---------------------- | ----------------------- |
| **Node.js**            | Runtime                 |
| **Express 5**          | Web framework           |
| **TypeScript**         | Type safety             |
| **PostgreSQL**         | Database                |
| **pg**                 | PostgreSQL client       |
| **bcrypt**             | Password hashing        |
| **jsonwebtoken**       | JWT authentication      |
| **swagger-autogen**    | Auto-generated API docs |
| **swagger-ui-express** | Swagger UI              |
| **nodemon + ts-node**  | Development auto-reload |
| **dotenv**             | Environment variables   |

---

## 📁 Project Structure

```
📂 Household Services Management/
│
├── 📄 index.ts                    # App entry point — mounts routes, starts server
├── 📄 db.ts                       # PostgreSQL connection pool
├── 📄 swagger.ts                  # Swagger auto-generation config
├── 📄 swagger-output.json         # Auto-generated Swagger spec (do not edit)
├── 📄 .env                        # Environment variables
├── 📄 package.json                # Dependencies & scripts
├── 📄 tsconfig.json               # TypeScript config
├── 📄 nodemon.json                # Nodemon config for auto-reload
│
├── 📂 routes/                     # Route handlers
│   ├── 📄 users.ts                # POST /register, POST /login
│   ├── 📄 jobs.ts                 # GET, POST, PUT, DELETE jobs
│   └── 📄 applications.ts        # POST apply, GET, PUT accept/reject
│
├── 📂 middleware/                 # Express middleware
│   └── 📄 auth.ts                 # JWT authentication & role authorization
│
└── 📂 utils/                     # Shared utilities
    └── 📄 enums.ts                # TypeScript enums (match PostgreSQL ENUMs)
```

---

## 🗄 Database Schema

### ENUMs

```sql
CREATE TYPE job_status         AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE user_role          AS ENUM ('CLIENT', 'TASKER');
CREATE TYPE application_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
```

### Tables

#### `users`

| Column          | Type           | Constraints                 |
| --------------- | -------------- | --------------------------- |
| `id`            | `SERIAL`       | `PRIMARY KEY`               |
| `full_name`     | `VARCHAR(100)` | `NOT NULL`                  |
| `email`         | `VARCHAR(255)` | `UNIQUE NOT NULL`           |
| `password_hash` | `TEXT`         | `NOT NULL`                  |
| `role`          | `user_role`    | `DEFAULT 'CLIENT'`          |
| `created_at`    | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` |

#### `jobs`

| Column        | Type            | Constraints                 |
| ------------- | --------------- | --------------------------- |
| `id`          | `SERIAL`        | `PRIMARY KEY`               |
| `title`       | `VARCHAR(100)`  | `NOT NULL`                  |
| `description` | `VARCHAR(200)`  | `NOT NULL`                  |
| `budget`      | `DECIMAL(10,2)` | `DEFAULT 0.00`              |
| `status`      | `job_status`    | `DEFAULT 'OPEN'`            |
| `client_id`   | `INTEGER`       | `REFERENCES users(id)`      |
| `created_at`  | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP` |

#### `applications`

| Column       | Type                 | Constraints                     |
| ------------ | -------------------- | ------------------------------- |
| `id`         | `SERIAL`             | `PRIMARY KEY`                   |
| `job_id`     | `INTEGER`            | `REFERENCES jobs(id) NOT NULL`  |
| `tasker_id`  | `INTEGER`            | `REFERENCES users(id) NOT NULL` |
| `message`    | `TEXT`               | —                               |
| `status`     | `application_status` | `DEFAULT 'PENDING'`             |
| `created_at` | `TIMESTAMP`          | `DEFAULT CURRENT_TIMESTAMP`     |
|              |                      | `UNIQUE(job_id, tasker_id)`     |

### Entity Relationship

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  users   │       │   jobs   │       │ applications │
│──────────│       │──────────│       │──────────────│
│ id (PK)  │◄──┐   │ id (PK)  │◄──┐   │ id (PK)      │
│ full_name│   │   │ title    │   │   │ job_id (FK)──┘
│ email    │   └───│client_id │   │   │ tasker_id(FK)──► users.id
│ password │       │ status   │   └───│ message      │
│ role     │       │ budget   │       │ status       │
│created_at│       │created_at│       │ created_at   │
└──────────┘       └──────────┘       └──────────────┘
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- pgAdmin 4 (for DB management)

### 1. Clone & Install

```bash
cd "Household Services Management"
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=HouseHold Services Management
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000
JWT_SECRET=your-secret-key-here
```

### 3. Create Database & Tables

Run the following SQL in pgAdmin:

```sql
-- Create ENUMs
CREATE TYPE job_status         AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE user_role          AS ENUM ('CLIENT', 'TASKER');
CREATE TYPE application_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'CLIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    budget DECIMAL(10,2) DEFAULT 0.00,
    status job_status DEFAULT 'OPEN',
    client_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) NOT NULL,
    tasker_id INTEGER REFERENCES users(id) NOT NULL,
    message TEXT,
    status application_status DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, tasker_id)
);
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at **http://localhost:3000** with:

- API at **http://localhost:3000/api/**
- Swagger docs at **http://localhost:3000/api-docs**

### Available Scripts

| Script          | Command              | Description                          |
| --------------- | -------------------- | ------------------------------------ |
| `npm run dev`   | `nodemon index.ts`   | Start with auto-reload (development) |
| `npm run build` | `tsc`                | Compile TypeScript to JavaScript     |
| `npm start`     | `node dist/index.js` | Run compiled production build        |

---

## 📡 API Endpoints

### 👤 Users

#### Register a User

```
POST /api/users/register
```

**Request Body:**

```json
{
  "full_name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "mypassword123",
  "role": "CLIENT"
}
```

**Response** `201 Created`:

```json
{
  "message": "User registered successfully!",
  "data": {
    "id": 1,
    "full_name": "Ahmed Khan",
    "email": "ahmed@example.com",
    "role": "CLIENT",
    "created_at": "2026-02-20T09:00:00.000Z"
  }
}
```

#### Login

```
POST /api/users/login
```

**Request Body:**

```json
{
  "email": "ahmed@example.com",
  "password": "mypassword123"
}
```

**Response** `200 OK`:

```json
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "full_name": "Ahmed Khan",
    "email": "ahmed@example.com",
    "role": "CLIENT"
  }
}
```

---

### 💼 Jobs

#### Get All Jobs

```
GET /api/jobs
```

🔓 **Public** — no authentication required

**Response** `200 OK`:

```json
{
  "message": "Jobs retrieved successfully!",
  "data": [
    {
      "id": 1,
      "title": "Fix Kitchen Plumbing",
      "description": "Kitchen sink is leaking",
      "budget": "150.00",
      "status": "OPEN",
      "client_id": 1,
      "client_name": "Ahmed Khan",
      "created_at": "2026-02-20T09:30:00.000Z"
    }
  ]
}
```

#### Get a Single Job

```
GET /api/jobs/:id
```

🔓 **Public**

#### Get My Posted Jobs (Client Only)

```
GET /api/jobs/my/posted
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role

#### Post a New Job

```
POST /api/jobs
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role

**Request Body:**

```json
{
  "title": "Fix Kitchen Plumbing",
  "description": "Kitchen sink is leaking and needs repair",
  "budget": 150.0,
  "status": "OPEN"
}
```

**Response** `201 Created`:

```json
{
  "message": "Job posted successfully!",
  "data": {
    "id": 1,
    "title": "Fix Kitchen Plumbing",
    "description": "Kitchen sink is leaking and needs repair",
    "budget": "150.00",
    "status": "OPEN",
    "client_id": 1,
    "created_at": "2026-02-20T09:30:00.000Z"
  }
}
```

#### Update a Job

```
PUT /api/jobs/:id
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role (must be job owner)

**Request Body** (all fields optional):

```json
{
  "title": "Updated title",
  "budget": 200.0,
  "status": "CANCELLED"
}
```

#### Delete a Job

```
DELETE /api/jobs/:id
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role (must be job owner)

---

### 📋 Applications

#### Apply to a Job (Tasker Only)

```
POST /api/applications
```

🔒 **Requires:** `Bearer Token` + `TASKER` role

**Request Body:**

```json
{
  "job_id": 1,
  "message": "I have 5 years of plumbing experience and can fix this quickly."
}
```

**Response** `201 Created`:

```json
{
  "message": "Application submitted successfully!",
  "data": {
    "id": 1,
    "job_id": 1,
    "tasker_id": 2,
    "message": "I have 5 years of plumbing experience...",
    "status": "PENDING",
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

#### Get My Applications (Tasker)

```
GET /api/applications/my
```

🔒 **Requires:** `Bearer Token` + `TASKER` role

#### Get Applications for a Job (Client)

```
GET /api/applications/job/:job_id
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role (must own the job)

#### Accept or Reject an Application (Client)

```
PUT /api/applications/:id/status
```

🔒 **Requires:** `Bearer Token` + `CLIENT` role (must own the job)

**Request Body:**

```json
{
  "status": "ACCEPTED"
}
```

> ⚡ When an application is **ACCEPTED**, the job status is automatically updated to **ASSIGNED**.

---

## 🔐 Authentication

This API uses **JWT (JSON Web Tokens)** for authentication.

### How It Works

1. **Register** → `POST /api/users/register`
2. **Login** → `POST /api/users/login` → receive a JWT `token`
3. **Use token** → include in the `Authorization` header for protected routes:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Token Details

- **Algorithm:** HS256
- **Expiry:** 24 hours
- **Payload:** `{ id, email, role }`

### Role-Based Access

| Endpoint                           | CLIENT     | TASKER | Public |
| ---------------------------------- | ---------- | ------ | ------ |
| `GET /api/jobs`                    | ✅         | ✅     | ✅     |
| `GET /api/jobs/:id`                | ✅         | ✅     | ✅     |
| `GET /api/jobs/my/posted`          | ✅         | ❌     | ❌     |
| `POST /api/jobs`                   | ✅         | ❌     | ❌     |
| `PUT /api/jobs/:id`                | ✅ (owner) | ❌     | ❌     |
| `DELETE /api/jobs/:id`             | ✅ (owner) | ❌     | ❌     |
| `POST /api/applications`           | ❌         | ✅     | ❌     |
| `GET /api/applications/my`         | ❌         | ✅     | ❌     |
| `GET /api/applications/job/:id`    | ✅ (owner) | ❌     | ❌     |
| `PUT /api/applications/:id/status` | ✅ (owner) | ❌     | ❌     |

---

## 🔄 Application Flow

```
  CLIENT                                TASKER
    │                                     │
    ├─ 1. Register (role: CLIENT)         ├─ 1. Register (role: TASKER)
    ├─ 2. Login → get token               ├─ 2. Login → get token
    │                                     │
    ├─ 3. POST /api/jobs ──────────────►  │
    │     (creates job, status: OPEN)     ├─ 4. GET /api/jobs
    │                                     │     (browses all OPEN jobs)
    │                                     │
    │  ◄────────────────────────────────  ├─ 5. POST /api/applications
    │                                     │     (applies to a job)
    │                                     │
    ├─ 6. GET /api/applications/job/:id   │
    │     (sees who applied)              │
    │                                     │
    ├─ 7. PUT /api/applications/:id/status│
    │     (ACCEPTED → job → ASSIGNED)  ──►│
    │                                     │
    ├─ 8. Job progresses:                 │
    │     IN_PROGRESS → COMPLETED         │
    └─────────────────────────────────────┘
```

---

## 📊 ENUMs Reference

### `job_status`

| Value         | Description                                |
| ------------- | ------------------------------------------ |
| `OPEN`        | Job is available for taskers to apply      |
| `ASSIGNED`    | A tasker has been accepted for this job    |
| `IN_PROGRESS` | The tasker is currently working on the job |
| `COMPLETED`   | The job has been finished                  |
| `CANCELLED`   | The job has been cancelled by the client   |

### `user_role`

| Value    | Description                                     |
| -------- | ----------------------------------------------- |
| `CLIENT` | Posts jobs, reviews applications, hires taskers |
| `TASKER` | Browses jobs, submits applications              |

### `application_status`

| Value      | Description                                        |
| ---------- | -------------------------------------------------- |
| `PENDING`  | Application submitted, awaiting client review      |
| `ACCEPTED` | Client accepted this tasker (job becomes ASSIGNED) |
| `REJECTED` | Client rejected this application                   |

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "message": "Description of error"
}
```

| Status Code | Meaning                                          |
| ----------- | ------------------------------------------------ |
| `400`       | Bad Request — invalid input or enum value        |
| `401`       | Unauthorized — missing or invalid token          |
| `403`       | Forbidden — wrong role or not the resource owner |
| `404`       | Not Found — resource doesn't exist               |
| `409`       | Conflict — duplicate (email, application)        |
| `500`       | Server Error — internal failure                  |

---

## 📝 License

ISC
