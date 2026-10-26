import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSubmissionSecurity } from "../../src/judge/security";

describe("Sandbox Security Scanner — Unit Tests", () => {
  describe("Python Static Analysis", () => {
    it("should allow standard competitive programming libraries", () => {
      const code = `
import sys
import math
from collections import deque, Counter
import heapq
import itertools

def solve():
    data = sys.stdin.read().split()
    print(math.sqrt(16))
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, true);
      assert.equal(res.reason, undefined);
    });

    it("should block import of dangerous os module", () => {
      const code = `
import os
os.system("whoami")
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("os"));
    });

    it("should block import of subprocess module", () => {
      const code = `
from subprocess import Popen, PIPE
p = Popen(['ls'], stdout=PIPE)
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("subprocess"));
    });

    it("should block network socket imports", () => {
      const code = `
import socket
s = socket.socket()
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("socket"));
    });

    it("should detect dynamic __import__ obfuscation", () => {
      const code = `
mod = __import__("os")
mod.system("calc")
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("Dynamic import"));
    });

    it("should reject eval() and exec() injections", () => {
      const code = `
cmd = "print(123)"
eval(cmd)
`;
      const res = validateSubmissionSecurity("PYTHON", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("eval/exec"));
    });
  });

  describe("C++ Static Analysis", () => {
    it("should allow safe STL headers and standard CP practices", () => {
      const code = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <queue>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << "Ready" << endl;
    return 0;
}
`;
      const res = validateSubmissionSecurity("CPP", code);
      assert.equal(res.isSafe, true);
    });

    it("should block inclusion of windows.h and low-level socket headers", () => {
      const code = `
#include <iostream>
#include <windows.h>

int main() {
    return 0;
}
`;
      const res = validateSubmissionSecurity("CPP", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("windows.h"));
    });

    it("should block direct system() and fork() calls", () => {
      const code = `
#include <iostream>
int main() {
    system("shutdown -s -t 0");
    return 0;
}
`;
      const res = validateSubmissionSecurity("CPP", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("system()"));
    });
  });

  describe("Java Static Analysis", () => {
    it("should block ProcessBuilder and Runtime executions", () => {
      const code = `
public class Main {
    public static void main(String[] args) {
        Runtime.getRuntime().exec("notepad.exe");
    }
}
`;
      const res = validateSubmissionSecurity("JAVA", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("ProcessBuilder/Runtime"));
    });

    it("should block socket network calls", () => {
      const code = `
import java.net.Socket;
public class Main {
    public static void main(String[] args) {}
}
`;
      const res = validateSubmissionSecurity("JAVA", code);
      assert.equal(res.isSafe, false);
      assert.ok(res.reason?.includes("Network socket"));
    });
  });
});
