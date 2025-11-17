# Codex Invocation Skill

Invoke OpenAI Codex CLI with the correct configuration for autonomous code generation.

## Quick Reference

### Basic Invocation
```bash
codex exec \
  -m gpt-5.1-codex \
  --dangerously-bypass-approvals-and-sandbox \
  -c model_reasoning_effort="high" \
  "Your prompt here"
```

### What This Does
- Uses GPT-5.1 Codex model for advanced code generation
- Enables full write access to create/modify files
- Uses high reasoning effort for production-quality code
- Executes autonomously without approval prompts

## Skills Referenced in Phase 2

The CODEX_PHASE_2_PROMPT.md references these skills:

1. **api-design-principles** - REST API design, error handling, consistent naming
2. **database-migration** - Migration best practices, schema changes
3. **sql-optimization-patterns** - Query optimization, avoiding N+1, proper JOINs
4. **modern-javascript-patterns** - Async/await, TypeScript generics, type narrowing

These skills provide Codex with best practices and patterns to follow during implementation.

## See SKILL.md for Details

See [SKILL.md](./SKILL.md) for:
- Complete usage patterns
- Common use cases
- Troubleshooting
- Advanced workflows
- Example prompts
