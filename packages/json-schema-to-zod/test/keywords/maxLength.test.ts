import { describe } from "bun:test";

import suites from "../json-schema-test-suite/maxLength.json";

import { runSuite } from "./utils";

describe("json-schema-test-suite/maxLength", () => {
  runSuite(suites);
});
