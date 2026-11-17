import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Finds opportunities to improve the structure and clarity of a source file: extract function or class candidates, renaming, modernization of old patterns, simplification of redundant or dead code, and design pattern improvements. Does not look for bugs or vulnerabilities. Use it for every changed source file of a pull request. Returns a JSON object with suggestions (type, location, impact, description, before, after, benefits) and a summary.',
  prompt: REFACTORING_SUGGESTER_PROMPT,
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  model: 'inherit',
};