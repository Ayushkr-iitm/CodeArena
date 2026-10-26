import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { compileSource } from "../../src/judge/compiler";

describe("Judge Compiler — Unit Tests", () => {
  it("should pre-compile valid Python code successfully", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test_compile_py_"));
    try {
      const sourcePath = path.join(tmpDir, "solution.py");
      await fs.writeFile(sourcePath, "print('Hello from test')\n");
      const res = await compileSource("PYTHON", sourcePath, tmpDir);
      assert.equal(res.success, true);
      assert.equal(res.error, undefined);
      assert.equal(res.executablePath, sourcePath);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("should catch Python syntax errors during pre-compilation", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test_compile_py_err_"));
    try {
      const sourcePath = path.join(tmpDir, "solution.py");
      // Deliberate invalid Python syntax
      await fs.writeFile(sourcePath, "def broken_func(\n  print('missing paren'");
      const res = await compileSource("PYTHON", sourcePath, tmpDir);
      assert.equal(res.success, false);
      assert.ok(res.error);
      assert.ok(res.error.toLowerCase().includes("syntaxerror"));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("should compile valid C++ code using local GCC compiler", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test_compile_cpp_"));
    try {
      const sourcePath = path.join(tmpDir, "solution.cpp");
      const code = `#include <iostream>
int main() {
    std::cout << "OK" << std::endl;
    return 0;
}`;
      await fs.writeFile(sourcePath, code);
      const res = await compileSource("CPP", sourcePath, tmpDir);
      assert.equal(res.success, true);
      assert.ok(res.executablePath);
      // Verify executable was generated
      const stat = await fs.stat(res.executablePath!);
      assert.ok(stat.size > 0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("should return detailed compiler diagnostic on invalid C++ code", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test_compile_cpp_err_"));
    try {
      const sourcePath = path.join(tmpDir, "solution.cpp");
      const code = `#include <iostream>
int main() {
    this_symbol_does_not_exist();
    return 0;
}`;
      await fs.writeFile(sourcePath, code);
      const res = await compileSource("CPP", sourcePath, tmpDir);
      assert.equal(res.success, false);
      assert.ok(res.error);
      assert.ok(res.error.includes("this_symbol_does_not_exist"));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});
