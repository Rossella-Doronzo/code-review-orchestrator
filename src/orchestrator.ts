import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReportSchema, ReviewReportJSONSchema } from './types';
import type { ReviewReport } from './types';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester,
} from './agents';
import { buildOrchestratorPrompt } from './prompts';
import { mcpServersConfig } from './config/mcp.config';
import { withRetry, withTimeout, globalRateLimiter } from './utils/index.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  /** Maximum agent turns for the whole review (default 60) */
  maxTurns?: number;
}

/** Shape of the final message of the SDK stream (only the fields we use) */
interface ResultMessage {
  type: 'result';
  subtype: string;
  result?: string;
  structured_output?: unknown;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private readonly maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.maxTurns = options.maxTurns ?? 60;
  }
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    return withRetry(
      () =>
        withTimeout(
          async () => {
            await globalRateLimiter.acquire(50000);
            try {
              return await this.runReview(owner, repo, prNumber);
            } finally {
              globalRateLimiter.release();
            }
          },
          15 * 60 * 1000,
          'Pull request review timed out after 15 minutes'
        ),
      2,
      2000
    );
  }
  /**
   * Review a pull request using parallel subagent analysis
   */
  private async runReview(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const model = process.env.ANTHROPIC_MODEL;
    if (!model) {
      throw new Error('ANTHROPIC_MODEL environment variable is required');
    }

    const startedAt = Date.now();
    const prompt = buildOrchestratorPrompt(owner, repo, prNumber);
    let finalMessage: ResultMessage | undefined;

    for await (const message of query({
      prompt,
      options: {
        model,
        cwd: process.env.PROJECT_ROOT ?? process.cwd(),
        settingSources: ['project'],
        mcpServers: mcpServersConfig,
                allowedTools: ['Task', 'Read', 'Grep', 'Glob', 'Skill', 'mcp__github', 'mcp__eslint'],
                        agents: {
          'code-quality-analyzer': codeQualityAnalyzer,
          'test-coverage-analyzer': testCoverageAnalyzer,
          'refactoring-suggester': refactoringSuggester,
        },
        maxTurns: this.maxTurns,
        permissionMode: 'acceptEdits',
        outputFormat: {
          type: 'json_schema',
          schema: ReviewReportJSONSchema,
        },
      },
    })) {
      if (message.type === 'result') {
        finalMessage = message as unknown as ResultMessage;
      }
    }
    
    if (!finalMessage || finalMessage.subtype !== 'success') {
      throw new Error(
        `Review failed: agent ended with "${finalMessage?.subtype ?? 'no result'}"`
      );
    }

    let raw: unknown = finalMessage.structured_output;
    if (raw === undefined && finalMessage.result) {
      try {
        raw = JSON.parse(finalMessage.result);
      } catch {
        throw new Error('Review failed: the agent did not return valid JSON');
      }
    }

    const parsed = ReviewReportSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Review failed: output does not match ReviewReportSchema (${parsed.error.issues.length} problems)`
      );
    }

    return {
      ...parsed.data,
      metadata: { ...parsed.data.metadata, duration: Date.now() - startedAt },
    };
  }
}