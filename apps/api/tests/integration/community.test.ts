import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { app } from "../../src/app";
import prisma from "../../src/lib/prisma";

describe("Community, Comments & Solutions API — Integration Tests", () => {
  let server: http.Server;
  let baseUrl: string;
  let token: string = "";
  let problemId: string = "";
  let rootCommentId: string = "";
  let replyCommentId: string = "";
  let solutionId: string = "";

  before(async () => {
    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Create a unique test user for authentication
    const userRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `community_${Date.now()}@test.com`,
        username: `comm_user_${Date.now()}`,
        password: "Password123!",
        displayName: "Community Tester",
      }),
    });
    const userData = await userRes.json();
    token = userData.data.accessToken;

    // Get an existing seeded problem (e.g. Two Sum)
    const problem = await prisma.problem.findFirst();
    assert.ok(problem, "At least one problem should exist in the database");
    problemId = problem.id;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /api/community/editorial/:problemId should return editorial content and hints", async () => {
    const res = await fetch(`${baseUrl}/api/community/editorial/${problemId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.hints));
  });

  it("POST /api/community/comments should post a root discussion comment", async () => {
    const res = await fetch(`${baseUrl}/api/community/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problemId,
        content: "What is the optimal hash map time complexity?",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.content, "What is the optimal hash map time complexity?");
    assert.equal(body.data.parentId, null);
    assert.ok(body.data.id);
    rootCommentId = body.data.id;
  });

  it("POST /api/community/comments should post a nested reply with parentId", async () => {
    const res = await fetch(`${baseUrl}/api/community/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problemId,
        parentId: rootCommentId,
        content: "It operates in average O(1) time per lookup!",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.parentId, rootCommentId);
    replyCommentId = body.data.id;
  });

  it("GET /api/community/comments/:problemId should return hierarchy with nested replies", async () => {
    const res = await fetch(`${baseUrl}/api/community/comments/${problemId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));

    const foundRoot = body.data.find((c: any) => c.id === rootCommentId);
    assert.ok(foundRoot, "Root comment should be present");
    assert.ok(Array.isArray(foundRoot.replies), "Replies array should be populated");
    const foundReply = foundRoot.replies.find((r: any) => r.id === replyCommentId);
    assert.ok(foundReply, "Nested reply should be linked to root comment");
  });

  it("POST /api/community/comments/:id/vote should toggle upvote on comment", async () => {
    // 1. Cast UPVOTE
    const vote1 = await fetch(`${baseUrl}/api/community/comments/${rootCommentId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "UPVOTE" }),
    });
    assert.equal(vote1.status, 200);
    const data1 = await vote1.json();
    assert.equal(data1.voted, "UPVOTE");

    // 2. Cast UPVOTE again to toggle off
    const vote2 = await fetch(`${baseUrl}/api/community/comments/${rootCommentId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "UPVOTE" }),
    });
    assert.equal(vote2.status, 200);
    const data2 = await vote2.json();
    assert.equal(data2.voted, null);
  });

  it("POST /api/community/solutions should publish a community solution", async () => {
    const res = await fetch(`${baseUrl}/api/community/solutions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problemId,
        title: "Clean Single-Pass Hash Map Solution",
        description: "We store complements in a hash table as we iterate through the list.",
        code: "def twoSum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i",
        language: "PYTHON",
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, "Clean Single-Pass Hash Map Solution");
    assert.equal(body.data.timeComplexity, "O(N)");
    assert.ok(body.data.id);
    solutionId = body.data.id;
  });

  it("POST /api/community/solutions/:id/vote should toggle upvote on solution", async () => {
    const vote1 = await fetch(`${baseUrl}/api/community/solutions/${solutionId}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(vote1.status, 200);
    const data1 = await vote1.json();
    assert.equal(data1.upvoted, true);

    const vote2 = await fetch(`${baseUrl}/api/community/solutions/${solutionId}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(vote2.status, 200);
    const data2 = await vote2.json();
    assert.equal(data2.upvoted, false);
  });
});
