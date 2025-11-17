# Cloudflare Workers Reference

This is a reference file pointing to the dedicated cloudflare-workers skill.

## Use the Dedicated Skill

For all Workers development topics, use the **[cloudflare-workers skill](../../cloudflare-workers/SKILL.md)**.

## What's in the cloudflare-workers Skill

The cloudflare-workers skill covers:

### Serverless Functions
- Workers development (TypeScript/JavaScript/Python)
- Request handling and routing
- Wrangler CLI usage
- Local development and deployment
- Environment management

### Storage Solutions
- **D1**: SQLite database on the edge
- **KV**: Key-value storage
- **R2**: Object storage (S3-compatible)
- **Durable Objects**: Stateful compute with WebSockets

### Advanced Features
- **Queues**: Message queues for async processing
- **Workers AI**: Run AI models on the edge
- **AI Gateway**: Unified interface for AI providers
- **Vectorize**: Vector database for embeddings
- **Hyperdrive**: PostgreSQL connection pooling

### Full-Stack Development
- Framework integration (Next.js, Remix, SvelteKit, Astro)
- API development patterns
- Authentication and authorization
- Caching strategies
- Error handling

## When to Use cloudflare-workers Skill

Use the cloudflare-workers skill when you need to:
- Build serverless APIs or backend logic
- Create Workers functions
- Work with D1, KV, R2, or Durable Objects
- Implement AI features (Workers AI, AI Gateway)
- Develop full-stack applications on Cloudflare
- Handle WebSocket connections
- Process background jobs with Queues
- Implement caching and CDN logic

## When to Use This (cloudflare) Skill

Use the current cloudflare platform skill for:
- DNS configuration
- SSL/TLS certificate setup
- Firewall rules and WAF
- Security configuration
- Static site deployment (Pages)
- Platform-level settings

## Quick Comparison

| Task | Use This Skill (cloudflare) | Use cloudflare-workers Skill |
|------|---------------------------|----------------------------|
| Configure DNS records | ✓ | |
| Set up SSL certificates | ✓ | |
| Configure firewall rules | ✓ | |
| Deploy static site to Pages | ✓ | |
| Write serverless functions | | ✓ |
| Work with D1 database | | ✓ |
| Use KV storage | | ✓ |
| Upload files to R2 | | ✓ |
| Create Durable Objects | | ✓ |
| Implement Workers AI | | ✓ |
| Build API with Workers | | ✓ |

## Example: Full Application Setup

**Platform Configuration** (this skill):
1. Add domain to Cloudflare
2. Configure DNS records
3. Set up SSL/TLS certificates
4. Configure security rules

**Application Development** (cloudflare-workers skill):
1. Create Workers for API endpoints
2. Set up D1 database
3. Configure R2 for file storage
4. Implement authentication
5. Deploy and test

## Access the cloudflare-workers Skill

**Relative path**: `../cloudflare-workers/SKILL.md`

**Full path**: `C:\Users\olaid\OneDrive\Desktop\Github\sotos-dashboard\.claude\skills\cloud-infrastructure\cloudflare-workers\SKILL.md`

For any Workers-related development questions, use the cloudflare-workers skill for comprehensive guidance.
