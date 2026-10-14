const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../index');
const Customer = require('../models/customer.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Customer.deleteMany({});
});

describe('ShopKart Backend Authentication API Tests (Lab 01)', () => {
  const sampleCustomer = {
    fullName: 'John Doe',
    email: 'john@gmail.com',
    password: 'john123',
    phone: '9876543210',
  };

  describe('Task 1 — Register Customer (POST /customers/register)', () => {
    it('should register a new customer successfully with 201 status', async () => {
      const res = await request(app)
        .post('/customers/register')
        .send(sampleCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Customer registered successfully');
      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.fullName).toBe(sampleCustomer.fullName);
      expect(res.body.customer.email).toBe(sampleCustomer.email);
      expect(res.body.customer.phone).toBe(sampleCustomer.phone);
      expect(res.body.customer.password).toBeUndefined(); // Password must NEVER be returned

      // Verify bcrypt hash in DB
      const dbCustomer = await Customer.findOne({ email: sampleCustomer.email });
      expect(dbCustomer).toBeDefined();
      expect(dbCustomer.password).not.toBe(sampleCustomer.password);
      expect(dbCustomer.password.startsWith('$2')).toBe(true); // Valid bcrypt hash
    });

    it('should return 400 if any required field is missing', async () => {
      const missingFullName = { email: 'test@gmail.com', password: 'password123', phone: '1234567890' };
      const res = await request(app).post('/customers/register').send(missingFullName);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const missingEmail = { fullName: 'Test', password: 'password123', phone: '1234567890' };
      const res2 = await request(app).post('/customers/register').send(missingEmail);
      expect(res2.status).toBe(400);

      const missingPassword = { fullName: 'Test', email: 'test@gmail.com', phone: '1234567890' };
      const res3 = await request(app).post('/customers/register').send(missingPassword);
      expect(res3.status).toBe(400);

      const missingPhone = { fullName: 'Test', email: 'test@gmail.com', password: 'password123' };
      const res4 = await request(app).post('/customers/register').send(missingPhone);
      expect(res4.status).toBe(400);
    });

    it('should return 400 if password is less than 6 characters', async () => {
      const shortPassCustomer = { ...sampleCustomer, password: '12345' };
      const res = await request(app).post('/customers/register').send(shortPassCustomer);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('6 characters');
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/customers/register').send(sampleCustomer);
      const duplicateRes = await request(app).post('/customers/register').send(sampleCustomer);
      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toBe('Email already exists');
    });
  });

  describe('Task 2 — Login Customer (POST /customers/login)', () => {
    beforeEach(async () => {
      await request(app).post('/customers/register').send(sampleCustomer);
    });

    it('should log in successfully, return 200, and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: sampleCustomer.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');

      // Check cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
      expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/customers/login')
        .send({
          email: 'nonexistent@gmail.com',
          password: 'john123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Task 3 — Protected Profile (GET /customers/me)', () => {
    let authCookie;

    beforeEach(async () => {
      await request(app).post('/customers/register').send(sampleCustomer);
      const loginRes = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: sampleCustomer.password,
        });
      authCookie = loginRes.headers['set-cookie'];
    });

    it('should return customer profile when authenticated via cookie', async () => {
      const res = await request(app)
        .get('/customers/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe(sampleCustomer.fullName);
      expect(res.body.email).toBe(sampleCustomer.email);
      expect(res.body.phone).toBe(sampleCustomer.phone);
      expect(res.body._id).toBeDefined();
      expect(res.body.password).toBeUndefined(); // Crucial: Never return password
    });

    it('should return 401 Unauthorized if no cookie/token provided', async () => {
      const res = await request(app).get('/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 Unauthorized for invalid token', async () => {
      const res = await request(app)
        .get('/customers/me')
        .set('Cookie', ['token=invalid_jwt_token_here; Path=/; HttpOnly']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Task 4 — Logout (POST /customers/logout)', () => {
    let authCookie;

    beforeEach(async () => {
      await request(app).post('/customers/register').send(sampleCustomer);
      const loginRes = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: sampleCustomer.password,
        });
      authCookie = loginRes.headers['set-cookie'];
    });

    it('should clear the authentication cookie and return success', async () => {
      const res = await request(app)
        .post('/customers/logout')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // Verify cookie is cleared (expires in past or token=;)
      expect(cookies.some((c) => c.includes('token=;') || c.toLowerCase().includes('expires='))).toBe(true);
    });
  });

  describe('Bonus Challenge — Change Password (PATCH /customers/change-password)', () => {
    let authCookie;

    beforeEach(async () => {
      await request(app).post('/customers/register').send(sampleCustomer);
      const loginRes = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: sampleCustomer.password,
        });
      authCookie = loginRes.headers['set-cookie'];
    });

    it('should successfully change password and allow login with new password', async () => {
      const changeRes = await request(app)
        .patch('/customers/change-password')
        .set('Cookie', authCookie)
        .send({
          oldPassword: 'john123',
          newPassword: 'newpassword456',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);
      expect(changeRes.body.message).toBe('Password changed successfully');

      // Old password should now fail
      const oldLoginRes = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: 'john123',
        });
      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await request(app)
        .post('/customers/login')
        .send({
          email: sampleCustomer.email,
          password: 'newpassword456',
        });
      expect(newLoginRes.status).toBe(200);
    });

    it('should return 400 if current password is wrong', async () => {
      const res = await request(app)
        .patch('/customers/change-password')
        .set('Cookie', authCookie)
        .send({
          oldPassword: 'wrongcurrentpassword',
          newPassword: 'newpassword456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Incorrect current password');
    });

    it('should return 400 if new password is too short', async () => {
      const res = await request(app)
        .patch('/customers/change-password')
        .set('Cookie', authCookie)
        .send({
          oldPassword: 'john123',
          newPassword: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('6 characters');
    });
  });
});
