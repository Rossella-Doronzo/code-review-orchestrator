import { describe, it, expect } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  CodeQualityResultJSONSchema,
} from '../src/types';

const validQuality = {
  file: 'a.ts',
  issues: [
    { line: 3, severity: 'high', category: 'security', description: 'd', suggestion: 's' },
  ],
  overallScore: 80,
  summary: 'ok',
};

const validCoverage = {
  file: 'a.ts',
  hasTests: true,
  testFiles: ['a.test.ts'],
  untestedPaths: [
    { type: 'function', location: 'foo', priority: 'high', reasoning: 'r', suggestedTest: 't' },
  ],
  coverageEstimate: 60,
  summary: 'ok',
};

const validRefactoring = {
  file: 'a.ts',
  suggestions: [
    { type: 'simplify', location: 'foo', impact: 'low', description: 'd', before: 'b', after: 'a', benefits: 'x' },
  ],
  summary: 'ok',
};

describe('valid data', () => {
  it('accepts a valid code quality result', () => {
    expect(() => CodeQualityResultSchema.parse(validQuality)).not.toThrow();
  });

  it('accepts a valid test coverage result', () => {
    expect(() => TestCoverageResultSchema.parse(validCoverage)).not.toThrow();
  });

  it('accepts a valid refactoring result', () => {
    expect(() => RefactoringSuggestionSchema.parse(validRefactoring)).not.toThrow();
  });
});

describe('invalid data', () => {
  it('rejects a missing required field', () => {
    const { summary, ...incomplete } = validQuality;
    expect(() => CodeQualityResultSchema.parse(incomplete)).toThrow();
  });

  it('rejects a wrong type', () => {
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, overallScore: 'high' })
    ).toThrow();
  });

  it('rejects an invalid severity value', () => {
    const bad = {
      ...validQuality,
      issues: [{ ...validQuality.issues[0], severity: 'urgent' }],
    };
    expect(() => CodeQualityResultSchema.parse(bad)).toThrow();
  });

  it('rejects an invalid refactoring type', () => {
    const bad = {
      ...validRefactoring,
      suggestions: [{ ...validRefactoring.suggestions[0], type: 'rewrite' }],
    };
    expect(() => RefactoringSuggestionSchema.parse(bad)).toThrow();
  });
});

describe('edge cases', () => {
  it('accepts empty arrays', () => {
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, issues: [] })
    ).not.toThrow();
    expect(() =>
      TestCoverageResultSchema.parse({
        ...validCoverage,
        testFiles: [],
        untestedPaths: [],
      })
    ).not.toThrow();
    expect(() =>
      RefactoringSuggestionSchema.parse({ ...validRefactoring, suggestions: [] })
    ).not.toThrow();
  });

  it('accepts score boundaries 0 and 100', () => {
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, overallScore: 0 })
    ).not.toThrow();
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, overallScore: 100 })
    ).not.toThrow();
  });

  it('rejects scores outside 0-100', () => {
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, overallScore: -1 })
    ).toThrow();
    expect(() =>
      CodeQualityResultSchema.parse({ ...validQuality, overallScore: 101 })
    ).toThrow();
  });
});

describe('JSON schema export', () => {
  it('produces an object schema with the required properties', () => {
       const schema = CodeQualityResultJSONSchema as {
      type?: string;
      required?: string[];
    };
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(
      expect.arrayContaining(['file', 'issues', 'overallScore', 'summary'])
    );
  });
});