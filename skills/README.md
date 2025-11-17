# Claude Skills Catalog

A comprehensive collection of skills organized by category to enhance development workflows with Claude Code.

## About

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. This repository contains a curated collection organized by category for easy discovery and use.

For more information, check out:
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [Equipping agents for the real world with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

## Directory Structure

```
.claude/skills/
├── ai-tools/              # AI and ML integration skills
├── cloud-infrastructure/  # Cloud platform skills
├── databases/             # Database-specific skills
├── debugging/             # Debugging and troubleshooting
├── development-workflow/  # Development process skills
├── document-processing/   # Document format handling
├── frameworks/            # Framework-specific skills
├── problem-solving/       # Problem-solving methodologies
├── tools-utilities/       # General development tools
└── meta/                  # Skills about skills and Claude Code
```

# Skills by Category

## AI Tools

AI and machine learning integration capabilities:

- **gemini-audio** - Audio processing and TTS with Gemini API
- **gemini-document-processing** - Document understanding with Gemini
- **gemini-image-gen** - Image generation with Gemini Imagen
- **gemini-video-understanding** - Video analysis with Gemini
- **gemini-vision** - Image understanding with Gemini Vision
- **google-adk-python** - Google AI Development Kit for Python

## Cloud Infrastructure

Cloud platform deployment and management:

- **cloudflare** - Cloudflare platform integration
- **cloudflare-browser-rendering** - Browser rendering with Cloudflare
- **cloudflare-r2** - Object storage with Cloudflare R2
- **cloudflare-workers** - Serverless functions with Cloudflare Workers
- **gcloud** - Google Cloud Platform CLI and services

## Databases

Database-specific skills and patterns:

- **mongodb** - MongoDB operations and best practices
- **postgresql-psql** - PostgreSQL CLI and advanced features

## Debugging

Systematic debugging and troubleshooting:

- **defense-in-depth** - Multi-layer validation to prevent bugs
- **root-cause-tracing** - Trace bugs backward to find original cause
- **systematic-debugging** - Four-phase debugging framework
- **verification-before-completion** - Evidence before assertions

## Development Workflow

Core development processes and practices:

- **brainstorming** - Refine ideas through Socratic questioning
- **condition-based-waiting** - Replace timeouts with condition polling
- **dispatching-parallel-agents** - Parallel problem-solving with agents
- **executing-plans** - Execute implementation plans in batches
- **finishing-a-development-branch** - Complete and integrate feature work
- **receiving-code-review** - Handle code review feedback rigorously
- **requesting-code-review** - Request automated code review
- **sharing-skills** - Contribute skills upstream via PR
- **subagent-driven-development** - Fast iteration with quality gates
- **test-driven-development** - Write tests first, watch them fail
- **testing-anti-patterns** - Avoid common testing mistakes
- **testing-skills-with-subagents** - Test skills before deployment
- **using-git-worktrees** - Isolated git workspaces for parallel work
- **using-superpowers** - Core workflows and best practices
- **writing-plans** - Create detailed implementation plans

## Frameworks

Framework-specific expertise:

- **better-auth** - Authentication with Better Auth
- **docker** - Container management and deployment
- **nextjs** - Next.js application development
- **remix-icon** - Icon library integration
- **shadcn-ui** - shadcn/ui component library
- **tailwindcss** - Tailwind CSS styling
- **turborepo** - Monorepo management with Turborepo

## Problem-Solving

Advanced problem-solving methodologies:

- **collision-zone-thinking** - Find where different constraints meet
- **inversion-exercise** - Think backward from failure
- **meta-pattern-recognition** - Recognize patterns across domains
- **scale-game** - Test ideas at different scales
- **simplification-cascades** - Simplify until clear
- **when-stuck** - Strategies for getting unstuck

## Tools & Utilities

General development tools and utilities:

- **chrome-devtools** - Browser debugging and performance analysis
- **docs-seeker** - Find and fetch documentation efficiently
- **ffmpeg** - Video/audio processing with FFmpeg
- **imagemagick** - Image manipulation and conversion
- **mcp-builder** - Build Model Context Protocol servers
- **repomix** - Repository analysis and packing
- **shopify** - Shopify app development

## Meta Skills

Skills about Claude Code itself and skill development:

- **canvas-design** - Design UI/UX in Claude Canvas
- **claude-code** - Claude Code features and capabilities
- **skill-creator** - Create new skills systematically
- **template-skill** - Template for new skills
- **writing-skills** - Apply TDD to skill development

# Document Processing

Handle various document formats (located in `document-processing/`):

- **docx** - Create, edit, and analyze Word documents with support for tracked changes, comments, formatting preservation, and text extraction
- **pdf** - Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms
- **pptx** - Create, edit, and analyze PowerPoint presentations with support for layouts, templates, charts, and automated slide generation
- **xlsx** - Create, edit, and analyze Excel spreadsheets with support for formulas, formatting, data analysis, and visualization

# Usage

## In Claude Code

Skills in the `.claude/skills/` directory are automatically detected by Claude Code. Simply mention the skill by name or describe what you want to do, and Claude will use the appropriate skill.

Example:
- "Use the systematic-debugging skill to investigate this test failure"
- "Apply the nextjs skill to help with this Next.js component"

## Slash Commands

Available slash commands:

- `/brainstorm` - Interactive design refinement using Socratic method
- `/execute-plan` - Execute plans in batches with review checkpoints
- `/write-plan` - Create detailed implementation plan with bite-sized tasks

# Creating a Basic Skill

Skills are simple to create - just a folder with a `SKILL.md` file containing YAML frontmatter and instructions. You can use the **template-skill** in this repository as a starting point:

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

The frontmatter requires only two fields:
- `name` - A unique identifier for your skill (lowercase, hyphens for spaces)
- `description` - A complete description of what the skill does and when to use it

The markdown content below contains the instructions, examples, and guidelines that Claude will follow. For more details, see [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills).

# Additional Resources

## Documentation

Many skills include additional reference documentation in `references/` subdirectories with:
- API references
- Best practices guides
- Code examples
- Performance tips
- Migration guides

## Contributing

To add new skills:

1. Use the **skill-creator** skill to generate structured skills
2. Use the **testing-skills-with-subagents** skill to validate
3. Use the **sharing-skills** skill to contribute upstream

## Learn More

- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [Equipping agents for the real world with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)