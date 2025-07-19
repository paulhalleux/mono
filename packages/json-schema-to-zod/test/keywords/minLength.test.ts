import { describe } from "bun:test";

import suites from "../json-schema-test-suite/minLength.json";

import { runSuite } from "./utils";

describe("json-schema-test-suite/minLength", () => {
  runSuite(suites);
});
