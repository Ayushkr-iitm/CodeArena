import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@codearena.com" },
    update: {},
    create: {
      email: "admin@codearena.com",
      username: "admin",
      displayName: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      rating: 2000,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ============================================
  // CREATE TEST USER
  // ============================================
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@codearena.com" },
    update: {},
    create: {
      email: "user@codearena.com",
      username: "testuser",
      displayName: "Test User",
      passwordHash: userPassword,
      role: "USER",
      rating: 1200,
    },
  });
  console.log(`✅ Test user: ${user.email}`);

  // ============================================
  // CREATE TAGS
  // ============================================
  const tagNames = [
    "Arrays",
    "Strings",
    "Hash Table",
    "Math",
    "Sorting",
    "Binary Search",
    "Dynamic Programming",
    "Greedy",
    "Two Pointers",
    "Stack",
    "Tree",
    "Graph",
    "DFS",
    "BFS",
    "Linked List",
    "Recursion",
    "Sliding Window",
  ];

  const tags: Record<string, any> = {};
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    tags[name] = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  console.log(`✅ Created ${tagNames.length} tags`);

  // ============================================
  // CREATE SAMPLE PROBLEMS
  // ============================================

  // Problem 1: Two Sum (Easy)
  const twoSum = await prisma.problem.upsert({
    where: { slug: "two-sum" },
    update: {},
    create: {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY",
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
      inputFormat:
        "First line contains n (size of array) and target.\nSecond line contains n space-separated integers.",
      outputFormat: "Two space-separated integers — the indices (0-indexed).",
      constraints: `- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- -10⁹ ≤ target ≤ 10⁹
- Only one valid answer exists.`,
      sampleInput: "4 9\n2 7 11 15",
      sampleOutput: "0 1",
      timeLimit: 2000,
      memoryLimit: 256,
      isPublished: true,
      tags: {
        create: [
          { tag: { connect: { id: tags["Arrays"].id } } },
          { tag: { connect: { id: tags["Hash Table"].id } } },
        ],
      },
      testCases: {
        create: [
          {
            input: "4 9\n2 7 11 15",
            expectedOutput: "0 1",
            isSample: true,
            order: 1,
          },
          {
            input: "3 6\n3 2 4",
            expectedOutput: "1 2",
            isSample: true,
            order: 2,
          },
          {
            input: "2 6\n3 3",
            expectedOutput: "0 1",
            isSample: false,
            order: 3,
          },
          {
            input: "5 10\n1 2 3 4 6",
            expectedOutput: "3 4",
            isSample: false,
            order: 4,
          },
          {
            input: "4 0\n-3 4 3 90",
            expectedOutput: "0 2",
            isSample: false,
            order: 5,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem: ${twoSum.title}`);

  // Problem 2: Reverse String (Easy)
  const reverseStr = await prisma.problem.upsert({
    where: { slug: "reverse-string" },
    update: {},
    create: {
      title: "Reverse String",
      slug: "reverse-string",
      difficulty: "EASY",
      description: `Write a function that reverses a string. The input string is given as a single line.

Print the reversed string.`,
      inputFormat: "A single line containing the string s.",
      outputFormat: "The reversed string.",
      constraints: `- 1 ≤ s.length ≤ 10⁵
- s consists of printable ASCII characters.`,
      sampleInput: "hello",
      sampleOutput: "olleh",
      timeLimit: 1000,
      memoryLimit: 256,
      isPublished: true,
      tags: {
        create: [
          { tag: { connect: { id: tags["Strings"].id } } },
          { tag: { connect: { id: tags["Two Pointers"].id } } },
        ],
      },
      testCases: {
        create: [
          {
            input: "hello",
            expectedOutput: "olleh",
            isSample: true,
            order: 1,
          },
          {
            input: "Hannah",
            expectedOutput: "hannaH",
            isSample: true,
            order: 2,
          },
          {
            input: "a",
            expectedOutput: "a",
            isSample: false,
            order: 3,
          },
          {
            input: "abcdef",
            expectedOutput: "fedcba",
            isSample: false,
            order: 4,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem: ${reverseStr.title}`);

  // Problem 3: Maximum Subarray (Medium)
  const maxSubarray = await prisma.problem.upsert({
    where: { slug: "maximum-subarray" },
    update: {},
    create: {
      title: "Maximum Subarray",
      slug: "maximum-subarray",
      difficulty: "MEDIUM",
      description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
      inputFormat:
        "First line contains n (size of array).\nSecond line contains n space-separated integers.",
      outputFormat: "A single integer — the maximum subarray sum.",
      constraints: `- 1 ≤ nums.length ≤ 10⁵
- -10⁴ ≤ nums[i] ≤ 10⁴`,
      sampleInput: "9\n-2 1 -3 4 -1 2 1 -5 4",
      sampleOutput: "6",
      timeLimit: 2000,
      memoryLimit: 256,
      isPublished: true,
      tags: {
        create: [
          { tag: { connect: { id: tags["Arrays"].id } } },
          { tag: { connect: { id: tags["Dynamic Programming"].id } } },
        ],
      },
      testCases: {
        create: [
          {
            input: "9\n-2 1 -3 4 -1 2 1 -5 4",
            expectedOutput: "6",
            isSample: true,
            order: 1,
          },
          {
            input: "1\n1",
            expectedOutput: "1",
            isSample: true,
            order: 2,
          },
          {
            input: "5\n5 4 -1 7 8",
            expectedOutput: "23",
            isSample: false,
            order: 3,
          },
          {
            input: "3\n-1 -2 -3",
            expectedOutput: "-1",
            isSample: false,
            order: 4,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem: ${maxSubarray.title}`);

  // Problem 4: Valid Parentheses (Easy)
  const validParens = await prisma.problem.upsert({
    where: { slug: "valid-parentheses" },
    update: {},
    create: {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: "EASY",
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print "true" if valid, "false" otherwise.`,
      inputFormat: "A single line containing the string s.",
      outputFormat: '"true" or "false".',
      constraints: `- 1 ≤ s.length ≤ 10⁴
- s consists of parentheses only '()[]{}'.`,
      sampleInput: "()",
      sampleOutput: "true",
      timeLimit: 1000,
      memoryLimit: 256,
      isPublished: true,
      tags: {
        create: [
          { tag: { connect: { id: tags["Strings"].id } } },
          { tag: { connect: { id: tags["Stack"].id } } },
        ],
      },
      testCases: {
        create: [
          { input: "()", expectedOutput: "true", isSample: true, order: 1 },
          { input: "()[]{}", expectedOutput: "true", isSample: true, order: 2 },
          { input: "(]", expectedOutput: "false", isSample: true, order: 3 },
          { input: "([)]", expectedOutput: "false", isSample: false, order: 4 },
          { input: "{[]}", expectedOutput: "true", isSample: false, order: 5 },
          { input: "", expectedOutput: "true", isSample: false, order: 6 },
        ],
      },
    },
  });
  console.log(`✅ Problem: ${validParens.title}`);

  // Problem 5: Longest Common Subsequence (Hard)
  const lcs = await prisma.problem.upsert({
    where: { slug: "longest-common-subsequence" },
    update: {},
    create: {
      title: "Longest Common Subsequence",
      slug: "longest-common-subsequence",
      difficulty: "HARD",
      description: `Given two strings \`text1\` and \`text2\`, return the length of their **longest common subsequence**. If there is no common subsequence, return 0.

A **subsequence** of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

For example, "ace" is a subsequence of "abcde".`,
      inputFormat:
        "First line contains text1.\nSecond line contains text2.",
      outputFormat: "A single integer — the length of the longest common subsequence.",
      constraints: `- 1 ≤ text1.length, text2.length ≤ 1000
- text1 and text2 consist of only lowercase English characters.`,
      sampleInput: "abcde\nace",
      sampleOutput: "3",
      timeLimit: 2000,
      memoryLimit: 256,
      isPublished: true,
      tags: {
        create: [
          { tag: { connect: { id: tags["Strings"].id } } },
          { tag: { connect: { id: tags["Dynamic Programming"].id } } },
        ],
      },
      testCases: {
        create: [
          {
            input: "abcde\nace",
            expectedOutput: "3",
            isSample: true,
            order: 1,
          },
          {
            input: "abc\nabc",
            expectedOutput: "3",
            isSample: true,
            order: 2,
          },
          {
            input: "abc\ndef",
            expectedOutput: "0",
            isSample: true,
            order: 3,
          },
          {
            input: "bsbininm\njmjkbkjkv",
            expectedOutput: "1",
            isSample: false,
            order: 4,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem: ${lcs.title}`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@codearena.com / admin123");
  console.log("   User:  user@codearena.com / user123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
