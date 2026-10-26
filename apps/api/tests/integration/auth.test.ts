import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { app } from "../../src/app";

describe("Authentication & Session API — Integration Tests", () => {
  let server: http.Server;
  let baseUrl: string;

  const testUser = {
    email: `test_${Date.now()}@codearena.dev`,
    username: `testuser_${Date.now()}`,
    password: "Password123!",
    displayName: "Integration Tester",
  };

  let accessToken: string = "";

  before(async () => {
    // Start server on an ephemeral random free port (port 0)
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /api/health should return ok status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.ok(body.timestamp);
  });

  it("POST /api/auth/register should create a user and return access token without leaking password", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.ok(body.data.refreshToken);
    assert.ok(body.data.user);
    assert.equal(body.data.user.email, testUser.email);
    assert.equal(body.data.user.username, testUser.username);
    assert.equal(body.data.user.displayName, testUser.displayName);
    assert.equal(body.data.user.password, undefined); // Ensure password hash is never exposed
    assert.equal(body.data.user.passwordHash, undefined);
    assert.ok(body.data.user.id);
    assert.equal(typeof body.data.user.rating, "number");

    accessToken = body.data.accessToken;
  });

  it("POST /api/auth/register should reject duplicate username or email with 409 Conflict", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error);
    assert.ok(body.error.toLowerCase().includes("already in use"));
  });

  it("POST /api/auth/login should authenticate user with valid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.equal(body.data.user.username, testUser.username);
  });

  it("POST /api/auth/login should reject invalid credentials with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword999!",
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error);
  });

  it("GET /api/auth/me should reject requests without Authorization header with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  it("GET /api/auth/me should return authenticated user profile with valid Bearer token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, testUser.email);
    assert.equal(body.data.username, testUser.username);
    assert.ok(body.data.id);
  });
});
