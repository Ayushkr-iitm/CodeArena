export interface ComparisonResult {
  isMatch: boolean;
  actualClean: string;
  expectedClean: string;
  diffSummary?: string;
}

/**
 * Normalizes program output by:
 * 1. Standardizing CRLF -> LF
 * 2. Trimming trailing spaces on every line
 * 3. Trimming outer leading and trailing blank lines
 */
export function normalizeOutput(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Compares actual stdout against expected output.
 * Performs both strict normalized string equality and token-level equivalence.
 */
export function checkOutput(actual: string, expected: string): ComparisonResult {
  const actualClean = normalizeOutput(actual);
  const expectedClean = normalizeOutput(expected);

  if (actualClean === expectedClean) {
    return {
      isMatch: true,
      actualClean,
      expectedClean,
    };
  }

  // Token level check (in case numbers/tokens are separated by varying whitespace)
  const actualTokens = actualClean.split(/\s+/).filter(Boolean);
  const expectedTokens = expectedClean.split(/\s+/).filter(Boolean);

  if (actualTokens.length === expectedTokens.length && actualTokens.length > 0) {
    const tokensMatch = actualTokens.every((token, idx) => token === expectedTokens[idx]);
    if (tokensMatch) {
      return {
        isMatch: true,
        actualClean,
        expectedClean,
      };
    }
  }

  // Generate difference summary for first mismatch
  let diffSummary = "";
  const actualLines = actualClean.split("\n");
  const expectedLines = expectedClean.split("\n");
  const maxLines = Math.max(actualLines.length, expectedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const act = actualLines[i] ?? "<EOF>";
    const exp = expectedLines[i] ?? "<EOF>";
    if (act !== exp) {
      diffSummary = `Line ${i + 1}: expected "${exp}", got "${act}"`;
      break;
    }
  }

  return {
    isMatch: false,
    actualClean,
    expectedClean,
    diffSummary: diffSummary || "Output did not match expected output.",
  };
}
