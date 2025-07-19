import { readdir } from "node:fs/promises";
import { join } from "node:path";

const TEST_DIR = "./test/keywords";
const RESULTS_FILE = "./test-results.txt";

type TestResult = {
  file: string;
  passed: number;
  failed: number;
};

// Step 1: Find all files in ./test/keywords
const files = (await readdir(TEST_DIR)).filter(
  (file) => file.endsWith(".ts") || file.endsWith(".js"),
);

const results: TestResult[] = [];

for (const file of files) {
  const filePath = join(TEST_DIR, file);
  const proc = Bun.spawn(["bun", "test", filePath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderr = await new Response(proc.stderr).text();

  const passMatch = stderr.match(/(\d+)\s+pass/);
  const failMatch = stderr.match(/(\d+)\s+fail/);

  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;

  results.push({
    file,
    passed,
    failed,
  });
}

// Step 3: Write results to test-results.txt
const output = results
  .map((r) => {
    return `File: ${r.file}
✅ Passed: ${r.passed}
❌ Failed: ${r.failed}
---
`;
  })
  .join("\n");

await Bun.write(RESULTS_FILE, output);

console.log(`✅ Test results written to ${RESULTS_FILE}`);
