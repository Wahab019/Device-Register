# Device Register

A lightweight internal tool for logging and tracking customer devices submitted for repair or servicing.

## Stack

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)

No authentication — intended for internal use where all users see the same data.

## Features

- Add a new device record (customer + device details)
- View list of all records
- View, edit, and delete an individual record

## Project Structure

device-register/
├── backend/ # FastAPI app
└── frontend/ # Next.js app


## Getting Started

### 1. Supabase Setup

- Create a project at [supabase.com](https://supabase.com)
- Run the following SQL in the Supabase SQL Editor to create the table:

```sql
create table device_records (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  device_type text not null,
  device_brand text,
  device_model text,
  serial_number text,
  issue_description text not null,
  status text not null default 'pending',
  date_received timestamptz not null default now(),
  date_completed timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- Grab your **Project URL** and **service_role key** from Project Settings → API

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows (Git Bash)
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `backend/.env`:

SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_role_key_here


Run the server:

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

NEXT_PUBLIC_API_URL=http://localhost:8000


Run the dev server:

```bash
npm run dev
```

App runs at `http://localhost:3000`

## API Endpoints

| Method | Endpoint         | Description         |
|--------|------------------|----------------------|
| GET    | /devices         | List all records     |
| GET    | /devices/{id}    | Get a single record  |
| POST   | /devices         | Create a record      |
| PUT    | /devices/{id}    | Update a record      |
| DELETE | /devices/{id}    | Delete a record      |
