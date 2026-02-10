<p align="center">
  <img src="./assets/logo.png" width="260" alt="Sohag Store logo" />
</p>

<h2 align="center">Sohag Store</h2>
<p align="center">E-commerce API built with NestJS + MongoDB.</p>

---

## Overview

Sohag Store is a NestJS backend API for an e-commerce project. It includes JWT authentication, role-based authorization (admin vs user), user self-service endpoints, and admin user management with pagination/filtering.

**Base URL (local):** `http://localhost:3000/api`  
**API version prefix:** `v1` (e.g. `/api/v1/auth/login`)

## Tech stack

- **Framework:** NestJS
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Bearer token)
- **Security:** bcrypt password hashing
- **Validation:** `class-validator` + global `ValidationPipe`

## Requirements

- **Node.js:** 18+ (recommended)
- **MongoDB:** local instance or Atlas connection string

## Setup

Install dependencies:

```bash
npm ci
```

Create a `.env` file in the project root:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sohag-store
JWT_SECRET=change_me_to_a_long_random_secret
BCRYPT_SALT_ROUNDS=10
```

Run the API:

```bash
# dev (watch)
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

## API quick reference

### Authentication (public)

- **POST** `/api/v1/auth/register`
- **POST** `/api/v1/auth/login` → returns `{ token }`

### User (authenticated)

Send the JWT with:

- `Authorization: Bearer <token>`

Endpoints:

- **GET** `/api/v1/user/me`
- **PATCH** `/api/v1/user/me`
- **DELETE** `/api/v1/user/me` (marks account inactive)

### Admin: user management (admin only)

All routes below require a user with `role = "admin"`:

- **POST** `/api/v1/admin/users`
- **GET** `/api/v1/admin/users` (supports pagination/filtering)
- **GET** `/api/v1/admin/users/:id`
- **PATCH** `/api/v1/admin/users/:id`
- **DELETE** `/api/v1/admin/users/:id`
- **PATCH** `/api/v1/admin/users/inactive/:id`

## Creating the first admin

Admin endpoints are protected by role checks. A simple bootstrap approach:

- Register a normal user via `/api/v1/auth/register`
- In MongoDB, update that user document and set `role` to `"admin"`

## Project scripts

```bash
npm run start
npm run start:dev
npm run start:prod
npm run lint
npm run format
npm run test
npm run test:e2e
```

## Project structure (high level)

- `src/auth/`: auth controller/service, JWT guard, roles/public decorators
- `src/user/`: user self-service endpoints (`/v1/user/me`)
- `src/user-management/`: admin user CRUD + pagination
- `src/common/pagination/`: shared pagination utilities

## License

This repository is currently marked **UNLICENSED** (see `package.json`).

