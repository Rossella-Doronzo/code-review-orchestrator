import * as dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils/report-generator';

dotenv.config();

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs(): { owner: string; repo: string; prNumber: number } {
  const [owner, repo, prStr] = process.argv.slice(2);
  if (!owner || !repo || !prStr) {
    fail('Missing arguments.\nUsage: npm run dev <owner> <repo> <pr-number>');
  }
  const prNumber = Number(prStr);
  if (!/^\d+$/.test(prStr) || prNumber < 1) {
    fail(`Invalid PR number "${prStr}": it must be a positive integer.`);
  }
  return { owner, repo, prNumber };
}

function checkEnvironment(): void {
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasAws = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  if (hasAnthropic) {
    console.log('🔐 Using Anthropic API authentication');
  } else if (hasAws) {
    if (!process.env.AWS_REGION) {
      fail('AWS_REGION is required when using AWS Bedrock.');
    }
    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    fail(
      'No credentials found. Set ANTHROPIC_API_KEY, or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (+ AWS_REGION).'
    );
  }
    if (!process.env.GITHUB_TOKEN) {
    fail(
      'GITHUB_TOKEN is required. Create a personal access token at https://github.com/settings/tokens and add GITHUB_TOKEN=... to your .env file.'
    );
  }
  if (!process.env.ANTHROPIC_MODEL) {
    fail(
      'ANTHROPIC_MODEL is required.\n  Anthropic API: claude-sonnet-4-5-20250929\n  AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0'
    );
  }
}

async function main(): Promise<void> {
  const { owner, repo, prNumber } = parseArgs();
  checkEnvironment();
  console.log(`🔍 Reviewing ${owner}/${repo} PR #${prNumber}...`);
  try {
    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);
    const generator = new ReportGenerator();
    const dir = join(process.env.PROJECT_ROOT ?? process.cwd(), 'reports');
    mkdirSync(dir, { recursive: true });
    const base = join(dir, `${owner}_${repo}_${prNumber}`);
    writeFileSync(`${base}.json`, generator.generateJSONReport(report));
    writeFileSync(`${base}.md`, generator.generateMarkdownReport(report));
    writeFileSync(`${base}.html`, generator.generateHTMLReport(report));
    console.log(`✅ Reports saved to ${dir}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

main();