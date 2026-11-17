import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import { ReviewReportSchema } from '../src/types';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from '../src/agents';
import { mcpServersConfig } from '../src/config/mcp.config';

const sampleReport = {
  pullRequest: { owner: 'o', repo: 'r', number: 1 },
  fileReviews: [],
  summary: {
    totalFiles: 0,
    overallScore: 100,
    criticalIssues: 0,
    highPriorityTests: 0,
    refactoringOpportunities: 0,
  },
  recommendations: [],
  metadata: { analyzedAt: '2026-01-01T00:00:00Z', duration: 0, agentVersions: {} },
};

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      expect(new CodeReviewOrchestrator()).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom options', () => {
      expect(new CodeReviewOrchestrator({ maxTurns: 10 })).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should configure GitHub and ESLint MCP servers over stdio with npx', () => {
      for (const server of [mcpServersConfig.github, mcpServersConfig.eslint]) {
        expect(server.type).toBe('stdio');
        expect(server.command).toBe('npx');
      }
    });
  });

  describe('Subagents', () => {
    it('should define all 3 subagents with the Skill tool and inherited model', () => {
      for (const agent of [codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester]) {
        expect(agent.description.length).toBeGreaterThan(20);
        expect(agent.tools).toContain('Skill');
        expect(agent.model).toBe('inherit');
      }
    });
  });

  describe('Report validation', () => {
    it('should accept a valid ReviewReport', () => {
      expect(ReviewReportSchema.safeParse(sampleReport).success).toBe(true);
    });

    it('should reject a report without the summary', () => {
      const { summary, ...broken } = sampleReport;
      expect(ReviewReportSchema.safeParse(broken).success).toBe(false);
    });
  });

  describe('Integration', () => {
    // Live test: needs real credentials and GITHUB_TOKEN, and costs budget.
    // Run it manually with: npm run dev -- udacity cd14715-simple-todo-app 1
    it.skip('should review a real small PR', async () => {
      const report = await new CodeReviewOrchestrator().reviewPullRequest(
        'udacity',
        'cd14715-simple-todo-app',
        1
      );
      expect(ReviewReportSchema.safeParse(report).success).toBe(true);
    });
  });
});