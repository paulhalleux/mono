import { describe } from "bun:test";

import suites from "../json-schema-test-suite/pattern.json";

import { runSuite } from "./utils";

describe("json-schema-test-suite/pattern", () => {
  runSuite(suites);
});
