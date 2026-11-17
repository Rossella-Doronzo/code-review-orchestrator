# 🔍 Code Review Report

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | 32/100 |
| **Files Reviewed** | 1 |
| **Critical Issues** | 3 |
| **High Priority Tests** | 9 |
| **Refactoring Opportunities** | 6 |

## 🎯 Top Recommendations

1. 🚨 **Security**: Fix three SQL injection vulnerabilities in searchTodos (line 115), searchTodosByStatus (line 123), and getTodosByUser (line 131). All three functions directly embed user input into SQL queries without parameterization. Attackers can inject arbitrary SQL to modify/delete data or extract sensitive information.
   - Files: src/todo.ts

2. 🚨 **Authorization**: Add authentication and authorization checks to getTodosByUser function (line 131). Currently, any user can query any other user's todos by passing a different userId. This should verify the caller is authenticated and authorized to view the specified user's todos.
   - Files: src/todo.ts

3. ⚠️ **Testing**: Create comprehensive test suite for src/todo.ts with zero current coverage. Priority areas: test the three vulnerable functions with malicious inputs, test validation functions with boundary cases, test security-critical paths like createTodo and sanitizeInput, and test parameterized query calls.
   - Files: src/todo.ts

4. ⚠️ **Input Validation**: Add input validation to searchTodos (keyword length) and searchTodosByStatus (validate completed is true/false). Missing validation allows potential DoS attacks via LIKE queries with excessively long keywords and type confusion with invalid completed values.
   - Files: src/todo.ts

5. 📝 **Performance**: Optimize sanitizeInput function (line 53) to use a single-pass regex replacement instead of four sequential .replace() calls. Current implementation creates multiple intermediate strings and iterates through content multiple times.
   - Files: src/todo.ts

## 📁 File Details

### 📄 `src/todo.ts`

**Quality Score:** 32/100 | **Coverage:** ~0%

#### Issues (10)
  - Line 115: `critical` SQL injection vulnerability via string interpolation. The keyword parameter is directly embedded in the SQL query using template literals without parameterization or validation. An attacker can inject malicious SQL code (e.g., `'; DROP TABLE todos; --`) to execute arbitrary database commands.
  - Line 123: `critical` SQL injection vulnerability through direct string concatenation. The completed parameter is concatenated directly into the SQL query without type validation or parameterization. An attacker can inject SQL code like `1 OR 1=1` to bypass the WHERE clause and retrieve all todos.
  - Line 131: `critical` SQL injection vulnerability with single-quoted string interpolation. The userId parameter is directly embedded in the SQL query without parameterization. An attacker can break out of the string using a single quote (e.g., `' OR '1'='1`) to execute arbitrary SQL.

  *...and 7 more*

#### Test Gaps (15)
  - `validateTodoInput` (high priority)
  - `sanitizeInput` (high priority)

  *...and 13 more*

#### Refactoring Opportunities (6)
  - **simplify**: The validation function uses multiple separate if statements that could be consolidated into a single logical expression. This reduces nesting and makes the validation logic more readable.
  - **modernize**: The HTML entity replacement can use a more maintainable approach by defining a mapping object and using Object.entries with reduce, making it easier to extend with additional entities.

  *...and 4 more*

---

*Generated at 2026-11-17T00:00:00Z • Duration: 127388ms*
