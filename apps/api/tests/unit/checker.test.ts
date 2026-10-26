import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkOutput, normalizeOutput, generateDiffSummary } from "../../src/judge/checker";

describe("Judge Output Checker — Unit Tests", () => {
  it("should accept identical strings", () => {
    const result = checkOutput("Hello World", "Hello World");
    assert.equal(result.isMatch, true);
    assert.equal(result.diffSummary, undefined);
  });

  it("should normalize trailing whitespace and carriage returns (CRLF vs LF)", () => {
    const actual = "1 2 3   \r\n4 5 6\r\n";
    const expected = "1 2 3\n4 5 6\n\n";
    const result = checkOutput(actual, expected);
    assert.equal(result.isMatch, true);
  });

  it("should ignore trailing blank lines at the end of output", () => {
    const actual = "42\n\n\n";
    const expected = "42";
    const result = checkOutput(actual, expected);
    assert.equal(result.isMatch, true);
  });

  it("should reject mismatched outputs and generate accurate diff summary", () => {
    const actual = "42";
    const expected = "43";
    const result = checkOutput(actual, expected);
    assert.equal(result.isMatch, false);
    assert.ok(result.diffSummary);
    assert.ok(result.diffSummary.includes('expected "43", got "42"'));
  });

  it("should detect line count mismatches", () => {
    const actual = "1\n2";
    const expected = "1\n2\n3";
    const result = checkOutput(actual, expected);
    assert.equal(result.isMatch, false);
    assert.ok(result.diffSummary?.includes('<EOF>'));
  });
});
