import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Community Features (Editorials, Hints, Solutions, Comments)...");

  const admin = await prisma.user.findUnique({ where: { email: "admin@codearena.com" } });
  const user = await prisma.user.findUnique({ where: { email: "user@codearena.com" } });
  if (!admin || !user) {
    throw new Error("Seed users not found");
  }

  // 1. Two Sum Community Data
  const twoSum = await prisma.problem.findUnique({ where: { slug: "two-sum" } });
  if (twoSum) {
    await prisma.problem.update({
      where: { id: twoSum.id },
      data: {
        hints: JSON.stringify([
          "A really brute force way would be to search for all possible pairs of numbers, but that takes O(N^2) time. Can you think of something faster?",
          "Can we use extra space? We can remember what elements we've seen so far in a Hash Table.",
          "As you iterate, for each number x, calculate complement = target - x. Check if complement is already present in your hash table.",
        ]),
        editorial: `### Problem Intuition
To find two numbers summing to \`target\`, for each number $x$, we require its exact complement $y = \\text{target} - x$.

### Approach 1: Hash Map ($O(N)$ Time, $O(N)$ Space)
We iterate through the array once while storing each visited number and its 0-indexed position in a hash map (\`std::unordered_map\` in C++, \`dict\` in Python, \`HashMap\` in Java).

For each element \`nums[i]\`:
1. Calculate \`complement = target - nums[i]\`.
2. If the complement exists in our map, we have immediately found our two indices: \`[map[complement], i]\`.
3. Otherwise, insert \`nums[i]\` into the map and continue.

### Complexity Analysis
- **Time Complexity:** $\\mathcal{O}(N)$ — single pass over the array with $\\mathcal{O}(1)$ average hash map lookups.
- **Space Complexity:** $\\mathcal{O}(N)$ — to store up to $N$ elements in the hash map.`,
      },
    });

    // Add Community Solution
    const existingSol = await prisma.solution.findFirst({
      where: { problemId: twoSum.id, title: { contains: "Optimal Single-Pass Hash Map" } },
    });

    if (!existingSol) {
      await prisma.solution.create({
        data: {
          problemId: twoSum.id,
          userId: admin.id,
          title: "Optimal Single-Pass Hash Map Solution (C++ & Python)",
          description: `This solution maintains an unordered map of numbers seen so far. As soon as the required complement \`target - nums[i]\` is encountered in the map, we return the pair immediately without waiting to process the rest of the array.`,
          code: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, target;
    if (!(cin >> n >> target)) return 0;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            cout << seen[complement] << " " << i << "\\n";
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}`,
          language: "CPP",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          upvotes: 18,
        },
      });
    }

    // Add Discussion Comments
    const commentCount = await prisma.comment.count({ where: { problemId: twoSum.id } });
    if (commentCount === 0) {
      const topComment = await prisma.comment.create({
        data: {
          problemId: twoSum.id,
          userId: admin.id,
          content: "Remember that you cannot use the same element twice! Make sure you check for the complement in the hash table BEFORE inserting the current element to avoid matching the element with itself.",
          upvotes: 12,
        },
      });

      await prisma.comment.create({
        data: {
          problemId: twoSum.id,
          userId: user.id,
          parentId: topComment.id,
          content: "Great tip! This also handles duplicates cleanly (e.g. [3, 3] with target = 6).",
          upvotes: 5,
        },
      });
    }
  }

  // 2. Reverse String Community Data
  const reverseString = await prisma.problem.findUnique({ where: { slug: "reverse-string" } });
  if (reverseString) {
    await prisma.problem.update({
      where: { id: reverseString.id },
      data: {
        hints: JSON.stringify([
          "Can you solve this without allocating an entire duplicate string?",
          "Use two pointers: one starting from the beginning (left = 0) and one from the end (right = length - 1).",
          "Swap the characters at left and right, then advance left and decrement right until they meet in the middle.",
        ]),
        editorial: `### Two Pointers Technique
We can reverse a sequence in-place in $\\mathcal{O}(N)$ time and $\\mathcal{O}(1)$ extra space by maintaining two indices:
- \`left = 0\`
- \`right = s.length() - 1\`

While \`left < right\`, swap \`s[left]\` and \`s[right]\`, then increment \`left\` and decrement \`right\`.

### Complexity
- **Time Complexity:** $\\mathcal{O}(N)$ where $N$ is string length.
- **Space Complexity:** $\\mathcal{O}(1)$ auxiliary memory.`,
      },
    });

    const existingSol = await prisma.solution.findFirst({
      where: { problemId: reverseString.id, title: { contains: "In-Place Two Pointers" } },
    });

    if (!existingSol) {
      await prisma.solution.create({
        data: {
          problemId: reverseString.id,
          userId: admin.id,
          title: "In-Place Two Pointers Reversal with O(1) Memory",
          description: "Swaps opposing characters from the extremities toward the center until pointers meet.",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) return 0;

    int left = 0, right = s.length() - 1;
    while (left < right) {
        swap(s[left], s[right]);
        left++;
        right--;
    }
    cout << s << "\\n";
    return 0;
}`,
          language: "CPP",
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          upvotes: 9,
        },
      });
    }
  }

  console.log("✅ Community features successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
