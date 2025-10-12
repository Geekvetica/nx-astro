export interface TestExecutorSchema {
  testPathPattern?: string;
  watch?: boolean;
  coverage?: boolean;
  ci?: boolean;
  root?: string;
  config?: string;
  reporter?: string;
  run?: boolean;
  verbose?: boolean;
  additionalArgs?: string[];
}
