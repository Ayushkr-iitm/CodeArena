import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateSuite } from "../../src/judge/index";

describe("Online Judge Pipeline — E2E Execution & Verdict Tests", () => {
  const sampleTestCases = [
    { id: "tc-1", input: "3 5\n", expectedOutput: "8\n", isSample: true, order: 1 },
    { id: "tc-2", input: "100 250\n", expectedOutput: "350\n", isSample: true, order: 2 },
    { id: "tc-3", input: "-10 15\n", expectedOutput: "5\n", isSample: false, order: 3 },
  ];

  describe("Python Language Execution Pipeline", () => {
    it("should evaluate correct Python solution to ACCEPTED", async () => {
      const code = `
import sys
line = sys.stdin.read().split()
if line:
    a, b = map(int, line[:2])
    print(a + b)
`;
      const res = await evaluateSuite("PYTHON", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "ACCEPTED");
      assert.equal(res.totalTestCases, 3);
      assert.equal(res.testCasesPassed, 3);
      assert.equal(res.testCaseResults.length, 3);
      assert.ok(res.maxRuntimeMs >= 0);
    });

    it("should evaluate incorrect Python solution to WRONG_ANSWER and supply diff", async () => {
      const code = `
import sys
line = sys.stdin.read().split()
if line:
    a, b = map(int, line[:2])
    print(a * b) # Incorrect operation
`;
      const res = await evaluateSuite("PYTHON", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "WRONG_ANSWER");
      assert.ok(res.testCasesPassed < 3);
      const failedCase = res.testCaseResults.find((tc) => tc.verdict === "WRONG_ANSWER");
      assert.ok(failedCase);
      assert.ok(failedCase.error, "Failing testcase should supply diffSummary");
    });

    it("should catch Python unhandled runtime exceptions as RUNTIME_ERROR", async () => {
      const code = `
import sys
print(1 / 0) # ZeroDivisionError
`;
      const res = await evaluateSuite("PYTHON", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "RUNTIME_ERROR");
      assert.equal(res.testCasesPassed, 0);
      assert.ok(
        res.testCaseResults[0].error?.toLowerCase().includes("zerodivision") ||
        res.testCaseResults[0].error?.toLowerCase().includes("error")
      );
    });

    it("should catch Python syntax errors as COMPILATION_ERROR", async () => {
      const code = `
def broken_syntax(
    print "Missing parens in Python 3"
`;
      const res = await evaluateSuite("PYTHON", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "COMPILATION_ERROR");
      assert.equal(res.testCasesPassed, 0);
      assert.ok(res.compileOutput || res.testCaseResults[0].error);
    });
  });

  describe("C++ Language Execution Pipeline", () => {
    it("should compile and evaluate correct C++ solution to ACCEPTED", async () => {
      const code = `
#include <iostream>
using namespace std;
int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
`;
      const res = await evaluateSuite("CPP", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "ACCEPTED");
      assert.equal(res.totalTestCases, 3);
      assert.equal(res.testCasesPassed, 3);
    });

    it("should catch C++ compiler diagnostic errors as COMPILATION_ERROR", async () => {
      const code = `
#include <iostream>
int main() {
    this_is_an_undeclared_function_call();
    return 0;
}
`;
      const res = await evaluateSuite("CPP", code, sampleTestCases, 3000, 256);

      assert.equal(res.verdict, "COMPILATION_ERROR");
      assert.equal(res.testCasesPassed, 0);
      assert.ok(
        (res.compileOutput || res.testCaseResults[0].error || "").includes(
          "this_is_an_undeclared_function_call"
        )
      );
    });
  });
});
