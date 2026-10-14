# Engineering Lab 01 — Backend Engineering Lab

# ShopKart: Customer Authentication Service

**Duration:** 2 Hours  
**Mode:** Individual Lab  
**Total Marks:** 100

---

## The Story

Welcome to **ShopKart**, a fast-growing e-commerce startup.

The frontend team has successfully completed the customer-facing website, but users currently **cannot create accounts or log in**. Your backend engineering team has been assigned the responsibility of building the complete authentication module that will be used across the platform.

Your task is to design secure REST APIs that allow customers to:

- Register
- Log in
- Access their profile
- Log out securely

> **Note:** This is **not** your Social Media project. Reuse the backend concepts you've learned in class and apply them to a completely different product.

---

# What You'll Build

By the end of this lab, ShopKart should have a fully functional authentication backend with:

- Customer Registration API
- Customer Login API
- JWT Authentication
- HttpOnly Cookie Authentication
- Protected Profile API
- Logout API

---

# Technical Constraints

You may use **only** the following technologies:

- Node.js
- Express.js
- MongoDB
- Mongoose
- bcrypt
- jsonwebtoken
- cookie-parser

### Not Allowed

- Passport.js
- Clerk
- Firebase Authentication
- Auth0
- Any authentication framework

---

# Project Structure

Follow the MVC architecture demonstrated in class.

```text
backend/
│
├── controllers/
│   └── customer.controller.js
│
├── models/
│   └── customer.model.js
│
├── routes/
│   └── customer.routes.js
│
├── middlewares/
│   └── auth.middleware.js
│
├── utils/
│   └── generateToken.js
│
├── index.js
└── .env
```

> TAs will expect a similar folder organization during evaluation.

---

# Database Design

Create a **Customer** collection.

| Field | Type | Validation |
|--------|------|------------|
| fullName | String | Required |
| email | String | Required, Unique |
| password | String | Required |
| phone | String | Required |
| createdAt | Date | Automatic |

> **Important:** The password stored inside MongoDB must always be a **bcrypt hash**.

---

# Functional Requirements

## Task 1 — Register a Customer

Create an API that allows a new customer to create an account.

### Endpoint

```http
POST /customers/register
```

### Request Body

```json
{
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "password": "john123",
  "phone": "9876543210"
}
```

### Validation Rules

- All fields are mandatory.
- Email must be unique.
- Password must contain at least **6 characters**.
- Phone number is required.
- Store **only** the bcrypt hash in the database.

### Success Response

```json
{
  "success": true,
  "message": "Customer registered successfully",
  "customer": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "phone": "9876543210"
  }
}
```

### Failure Cases

| Situation | Status Code |
|-----------|-------------|
| Missing field | 400 |
| Email already exists | 409 |
| Password too short | 400 |

---

## Task 2 — Login

Customers should be able to authenticate themselves.

### Endpoint

```http
POST /customers/login
```

### Request Body

```json
{
  "email": "john@gmail.com",
  "password": "john123"
}
```

### Requirements

- Find customer using email.
- Compare password using bcrypt.
- Generate a JWT.
- Store the JWT inside an **HttpOnly cookie**.
- Return customer information (excluding password).

### Success Response

```json
{
  "success": true,
  "message": "Login successful"
}
```

### Failure Cases

| Case | Status Code |
|------|-------------|
| Invalid credentials | 401 |

> Do **not** reveal whether the email or password was incorrect.

---

## Task 3 — My Profile

Return the currently authenticated customer.

### Endpoint

```http
GET /customers/me
```

### Requirements

- Route must be protected.
- Read JWT from cookies.
- Verify the token.
- Find the customer in MongoDB.
- Attach the customer object to `req.user`.

### Success Response

```json
{
  "_id": "...",
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "phone": "9876543210"
}
```

### Failure

If the token is missing or invalid:

**Status:** `401 Unauthorized`

---

## Task 4 — Logout

Implement logout functionality.

### Endpoint

```http
POST /customers/logout
```

### Requirements

- Clear the authentication cookie.
- Return a success response.

### Example Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

# API Summary

| Method | Endpoint | Protected |
|--------|----------|-----------|
| POST | `/customers/register` | ❌ |
| POST | `/customers/login` | ❌ |
| GET | `/customers/me` | ✅ |
| POST | `/customers/logout` | ✅ |

---

# Acceptance Criteria

A student passes the lab only if **all** of the following work correctly:

- Customer registration works.
- Duplicate emails are rejected.
- Passwords are stored as bcrypt hashes.
- Customer login works.
- JWT is generated successfully.
- JWT is stored inside an HttpOnly cookie.
- `/customers/me` is accessible only after authentication.
- Logout clears the authentication cookie.
- Password is never returned in any API response.

---

# TA Evaluation Rubric (100 Marks)

| Category | Marks |
|----------|------:|
| Register API | 15 |
| Login API | 15 |
| JWT + Cookie Authentication | 20 |
| Protected Profile Route | 20 |
| MVC Code Structure | 10 |
| Error Handling | 10 |
| Viva | 10 |
| **Total** | **100** |

---

# TA Viva Questions (Ask Any 3+)

1. Why do we use **bcrypt** instead of encrypting passwords?
2. What information is typically stored inside a JWT payload?
3. Why is the **HttpOnly** flag important for cookies?
4. Why should passwords never be returned to the frontend?
5. What is the purpose of authentication middleware?

---

# Bonus Challenge (+10 Marks)

Implement a **Change Password** API.

### Endpoint

```http
PATCH /customers/change-password
```

### Requirements

- User must be logged in.
- Verify the old password first.
- Hash the new password before saving.
- Return a success response.

---

# Submission Rules

- Individual submission only.
- Do **not** copy code from the Social Media project.
- TAs will evaluate by testing your APIs using **Postman**.
- Viva is compulsory for marks.
- Use AI minimally and understand every line of code you write.

---

## What's Next?

This is **Lab 01** of the ShopKart backend series.

Future labs will gradually extend this project with:

- Product Management APIs
- Shopping Cart
- Wishlist
- Orders
- Payment Integration

Your classroom project remains the **Social Media Application**, while engineering labs will build **ShopKart** independently.
