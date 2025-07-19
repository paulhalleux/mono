import { describe } from "bun:test";

import suites from "../json-schema-test-suite/type.json";

import { runSuite } from "./utils";

describe("json-schema-test-suite/type", () => {
  runSuite(suites);
});
