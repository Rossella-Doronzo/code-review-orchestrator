export function buildOrchestratorPrompt(
  owner: string,
  repo: string,
  prNumber: number
): string {
  return `You are the orchestrator of a code review system. Your job is to review pull request #${prNumber} of the repository ${owner}/${repo} by coordinating three specialized subagents, and to produce one final report.

## Step 1: fetch the pull request data
Use the GitHub MCP tools to get the pull request details (title, description, state) and the list of changed files with their patches. For each changed file you need its path and its content. If a file is deleted or is not source code (images, lock files, generated files), skip it.
IMPORTANT: the code to review exists ONLY on GitHub, not on the local disk. Fetch the full content of every changed file from GitHub with the GitHub MCP tools (for example get_file_contents, using the PR head branch). NEVER use the Read, Glob or Grep tools on the local disk to find the code of the pull request: the local files belong to a different project and must be ignored.

## Step 2: analyze every changed source file with all three subagents
For EACH changed source file, invoke all three subagents. Run them in parallel when possible, because they are independent of each other.
- Use the code-quality-analyzer agent to analyze <file path> for security, performance and maintainability issues.
- Use the test-coverage-analyzer agent to analyze <file path> for missing tests and estimate its coverage.
- Use the refactoring-suggester agent to analyze <file path> for refactoring opportunities.
Paste the full file content you fetched from GitHub directly into each subagent request, and tell it to analyze ONLY that text and not to read any file from the local disk. If the repository has test files in the PR, include their content too, so the test-coverage-analyzer can compare them.

## Step 3: handle failures
If a subagent fails or returns invalid output for a file, do not stop. Use an empty result for that analysis (empty issues, suggestions or untestedPaths, a neutral score of 50 or coverageEstimate of 0) and write in its summary that the analysis failed. The final report must always be produced.

## Step 4: build the final report
Combine all results into one JSON object with exactly these fields:
- pullRequest: { owner: "${owner}", repo: "${repo}", number: ${prNumber} }
- fileReviews: one entry per analyzed file, with file, codeQuality, testCoverage and refactorings (the three subagent results, unchanged)
- summary:
  - totalFiles: number of analyzed files
  - overallScore: average of the codeQuality overallScore values, rounded
  - criticalIssues: number of issues with severity "critical" across all files
  - highPriorityTests: number of untestedPaths with priority "critical" or "high"
  - refactoringOpportunities: total number of refactoring suggestions
- recommendations: the most important actions, ordered by priority. Each has priority (critical | high | medium | low), category, description and the list of files involved
- metadata: { analyzedAt: current time as an ISO string, duration: 0, agentVersions: { "code-quality-analyzer": "1.0.0", "test-coverage-analyzer": "1.0.0", "refactoring-suggester": "1.0.0" } }

Never invent findings. Every issue, test suggestion and refactoring must come from what the subagents returned. Return only the final JSON object.`;
}