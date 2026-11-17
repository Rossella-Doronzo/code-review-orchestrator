import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes a source file for security vulnerabilities, performance problems and maintainability issues. Use it for every changed source file of a pull request. Returns a JSON object with issues (line, severity, category, description, suggestion), an overallScore from 0 to 100 and a summary.',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  model: 'inherit',
};