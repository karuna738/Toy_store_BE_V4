# ToyVerse Backend Service

Production-ready, maintainable, and secure Node.js TypeScript backend for the ToyVerse e-commerce application, integrated with MySQL and Express.js.

---

## 1. Prerequisites

- **Node.js**: v18.x or v20.x LTS (Run `node -v` to verify)
- **npm**: v9.x or v10.x
- **MySQL**: MySQL Server 8.0+ (Local, Docker, or Cloud instance)
- **MySQL Workbench** or MySQL CLI

---

## 2. Installation & Setup

### Step 1: Install Dependencies
Open your terminal in the backend directory (`Toy_store_BE_V4`) and run:

```bash
cd Toy_store_BE_V4
npm install
```

### Step 2: Configure Environment Variables
Copy the `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your local MySQL credentials:

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Security (Set a strong 32+ character key)
JWT_SECRET=your_jwt_secret_key_change_in_production_min_32_characters
JWT_EXPIRES_IN=7d

# MySQL Database Connection
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=toyverse_db
DB_CONNECTION_LIMIT=10
```

---

## 3. How to Import the Database Dump (`toyverse_db_dump.sql`)

The database dump file is located at `database/toyverse_db_dump.sql`. It is self-contained and creates `toyverse_db`, all required tables, foreign keys, indexes, and initial product catalog data safely without destructive statements (`NO DROP/TRUNCATE`).

### Option A: Using MySQL Workbench (GUI)
1. Open **MySQL Workbench** and connect to your local MySQL server.
2. In the top navigation menu, click **Server** &rarr; **Data Import**.
3. Under **Import Options**, select **Import from Self-Contained File**.
4. Browse and select the file: `Toy_store_BE_V4/database/toyverse_db_dump.sql`.
5. Under **Default Target Schema**, leave blank or select `toyverse_db` (the script creates and switches to `toyverse_db` automatically).
6. Click **Start Import** in the bottom-right corner.
7. Refresh the **Schemas** tab in MySQL Workbench. You will see `toyverse_db` with all 6 tables:
   - `users`
   - `products`
   - `product_images`
   - `orders`
   - `order_items`
   - `stock_movements`

### Option B: Using MySQL Command Line
Run the following command in your terminal:

```bash
mysql -u root -p < database/toyverse_db_dump.sql
```

---

## 4. Running the Application

### Development Mode (with hot-reloading):
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### Production Build & Execution:
```bash
npm run build
npm start
```

---

## 5. Running Tests

Run the test suite using Vitest and Supertest:

```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

---

## 6. Interactive API Documentation (Swagger UI)

Interactive OpenAPI 3.0 documentation is available when the server is running:

👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

Features:
- Full list of endpoints, request bodies, query parameters, and responses.
- Test endpoints directly in the browser.
- Authorize requests with JWT tokens via the **Authorize (BearerAuth)** button.

---

## 7. API Endpoint Overview

| Module | Method | Endpoint | Description | Auth |
|---|---|---|---|---|
| **System** | `GET` | `/api/health` | Health and database connectivity check | Public |
| **Auth** | `POST` | `/api/auth/register` | Register customer account | Public |
| **Auth** | `POST` | `/api/auth/login` | Log in and receive JWT token | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile | Customer / Admin |
| **Auth** | `PUT` | `/api/auth/me` | Update phone and delivery address | Customer / Admin |
| **Products** | `GET` | `/api/products` | Catalog search, category filter, sort, pagination | Public |
| **Products** | `GET` | `/api/products/:id` | Get toy product detail & gallery | Public |
| **Products** | `POST` | `/api/products` | Create product with discount and initial stock | Admin |
| **Products** | `PUT` | `/api/products/:id` | Update product fields and stock | Admin |
| **Products** | `DELETE`| `/api/products/:id` | Remove toy product | Admin |
| **Orders** | `POST` | `/api/orders` | Place order (transactional stock deduction) | Customer |
| **Orders** | `GET` | `/api/orders/my-orders` | Fetch customer order history | Customer |
| **Orders** | `PUT` | `/api/orders/:id/cancel` | Cancel pending order & restore stock | Customer |
| **Orders** | `GET` | `/api/orders` | View all customer orders | Admin |
| **Orders** | `PUT` | `/api/orders/:id/status` | Advance status and auto-restock if returned | Admin |
| **Stock** | `GET` | `/api/stock/movements` | Query inventory movement audit ledger | Admin |
| **Stock** | `GET` | `/api/stock/low` | Low-stock alert items (&le; 5 units) | Admin |
| **Stock** | `POST` | `/api/stock/adjust` | Manual inventory adjustment (IN/OUT) | Admin |
| **Dashboard**| `GET` | `/api/dashboard` | Aggregated KPIs and 6-month historical trends | Admin |
| **Upload** | `POST` | `/api/upload` | Multi-image file upload (max 8 files, 5MB each) | Admin |
| **Users** | `GET` | `/api/users` | List registered customer accounts | Admin |
| **Users** | `GET` | `/api/users/:id` | View specific user details | Admin |

---

## 9. Architecture & Design Principles

1. **Transaction Safety**: All inventory modifications during order placement, order status transitions, and manual adjustments execute inside ACID transactions with row-level pessimistic locking (`SELECT ... FOR UPDATE`).
2. **Single-Restock Rule**: The `stock_deducted` boolean flag ensures stock is credited back exactly once when an order is cancelled or marked returned.
3. **Defense in Depth**: Zod request schema validation, Helmet security headers, rate limiting (global + auth), parameterization across all queries, and centralized error masking in production.
"# Toy_store_BE_V4" 
