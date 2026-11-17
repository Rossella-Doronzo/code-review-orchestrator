import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Evaluates how well a source file is covered by tests. Finds the matching test files, identifies untested functions, branches and edge cases, estimates coverage and suggests specific test cases with real assertions. Use it for every changed source file of a pull request. Returns a JSON object with hasTests, testFiles, untestedPaths, a coverageEstimate from 0 to 100 and a summary.',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  model: 'inherit',
};