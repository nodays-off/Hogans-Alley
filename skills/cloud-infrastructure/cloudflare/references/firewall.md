# Firewall and Security Rules Guide

Complete guide to Cloudflare's Web Application Firewall (WAF), firewall rules, and security features.

## Table of Contents

1. [Overview](#overview)
2. [Firewall Rules](#firewall-rules)
3. [WAF (Web Application Firewall)](#waf-web-application-firewall)
4. [Rate Limiting](#rate-limiting)
5. [Bot Protection](#bot-protection)
6. [Security Level](#security-level)
7. [IP Access Rules](#ip-access-rules)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Overview

Cloudflare provides multiple layers of security:

**Free Plan**:
- Firewall Rules (5 rules)
- IP Access Rules (unlimited)
- Security Level settings
- Basic DDoS protection
- Bot Fight Mode

**Paid Plans** (Pro/Business/Enterprise):
- More firewall rules
- WAF Managed Rules
- Rate Limiting
- Advanced Bot Management
- Custom rules and rulesets

**Execution Order**:
1. IP Access Rules (allow/block/challenge)
2. Firewall Rules (custom rules)
3. WAF Managed Rules (OWASP protection)
4. Rate Limiting
5. Bot Management
6. Security Level

## Firewall Rules

### What are Firewall Rules?

**Purpose**: Custom rules to filter HTTP/HTTPS traffic based on request properties

**Available on**: All plans (5 rules on Free, more on paid plans)

**Capabilities**:
- Match on any request property (IP, country, URI, headers, etc.)
- Actions: Block, Challenge, Allow, Bypass, JS Challenge, Log
- Complex logic with AND/OR operators

### Create Firewall Rule

**Location**: Dashboard → Security → WAF → Firewall rules

**Steps**:
1. Click "Create firewall rule"
2. Name your rule (descriptive)
3. Build expression (UI or Expression Builder)
4. Choose action
5. Save and deploy

### Firewall Rule Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **Block** | Return 403 error | Block malicious traffic permanently |
| **Challenge** | Show CAPTCHA | Stop bots but allow humans |
| **JS Challenge** | JavaScript verification | Invisible challenge for browsers |
| **Managed Challenge** | Smart challenge | Cloudflare decides challenge type |
| **Allow** | Bypass security checks | Whitelist trusted traffic |
| **Log** | Log only (no action) | Testing rules before enforcement |
| **Bypass** | Skip specific security features | Fine-grained control |

### Expression Language

**Basic Syntax**:
```
(field operator value)
```

**Common Fields**:
- `ip.src`: Source IP address
- `ip.geoip.country`: Country code (2-letter ISO)
- `http.host`: Hostname
- `http.request.uri.path`: URL path
- `http.request.method`: HTTP method (GET, POST, etc.)
- `http.user_agent`: Browser user agent
- `http.referer`: Referrer header
- `http.cookie`: Cookie values
- `http.request.headers`: Request headers

**Operators**:
- `eq`: Equals
- `ne`: Not equals
- `contains`: Contains substring
- `matches`: Regex match
- `in`: In list
- `gt`, `lt`, `ge`, `le`: Numeric comparisons

**Logical Operators**:
- `and`: All conditions must match
- `or`: Any condition must match
- `not`: Negate condition

### Example Firewall Rules

**Block Specific Country**:
```
(ip.geoip.country eq "CN")
```
Action: Block

**Block Specific IP Range**:
```
(ip.src in {192.0.2.0/24 198.51.100.0/24})
```
Action: Block

**Allow Only Specific Countries**:
```
(ip.geoip.country ne "US" and ip.geoip.country ne "CA" and ip.geoip.country ne "GB")
```
Action: Block

**Block Specific User Agents**:
```
(http.user_agent contains "BadBot" or http.user_agent contains "Scraper")
```
Action: Block

**Protect Admin Panel**:
```
(http.request.uri.path contains "/admin" and ip.src ne 203.0.113.1)
```
Action: Block

**Block Specific HTTP Methods**:
```
(http.request.method in {"DELETE" "PUT" "PATCH"})
```
Action: Block

**Challenge Non-Browser Traffic**:
```
(not http.user_agent contains "Mozilla" and http.request.uri.path eq "/api")
```
Action: Challenge

**Whitelist Office IP**:
```
(ip.src eq 203.0.113.1)
```
Action: Allow

**Block Query String Attacks**:
```
(http.request.uri.query contains "UNION SELECT" or http.request.uri.query contains "<script>")
```
Action: Block

**Protect API Endpoint**:
```
(http.request.uri.path matches "^/api/.*" and http.request.method eq "POST" and not http.cookie contains "auth_token=")
```
Action: Block

### Complex Rule Examples

**Geographic Restrictions with Exceptions**:
```
(ip.geoip.country ne "US" and ip.geoip.country ne "CA") and not (ip.src in {203.0.113.0/24})
```
Action: Block
_Block all non-US/CA traffic except specific IP range_

**API Rate Limiting (via Expression)**:
```
(http.host eq "api.example.com" and http.request.uri.path contains "/v1/" and not http.request.headers["X-API-Key"][0] eq "secret123")
```
Action: Challenge

**File Upload Protection**:
```
(http.request.uri.path matches ".*\\.(php|asp|aspx|jsp)$" and http.request.method eq "POST")
```
Action: Block

## WAF (Web Application Firewall)

### Managed Rules

**Available on**: Pro, Business, Enterprise plans

**Purpose**: Pre-configured rules to protect against common web vulnerabilities

**Rulesets**:
- **Cloudflare Managed Ruleset**: Core protection against OWASP Top 10
- **Cloudflare OWASP Core Ruleset**: OWASP ModSecurity rules
- **Cloudflare Exposed Credentials Check**: Detects compromised credentials

**Location**: Dashboard → Security → WAF → Managed rules

### Configure WAF Managed Rules

**1. Enable/Disable Rulesets**:
- Toggle entire rulesets on/off
- Most sites should enable all

**2. Set Sensitivity Level**:
- **Off**: Disabled
- **Low**: Minimal false positives
- **Medium**: Balanced (default)
- **High**: Maximum protection, may have false positives

**3. Customize Rules**:
- Override specific rules
- Change action (Block → Log, etc.)
- Disable problematic rules

### WAF Exception Patterns

**Skip WAF for Trusted IPs**:
```
# Firewall Rule
(ip.src in {203.0.113.1 203.0.113.2})
```
Action: Bypass → Select "WAF Managed Rules"

**Skip WAF for Specific Path**:
```
(http.request.uri.path contains "/webhook/github")
```
Action: Bypass → Select "WAF Managed Rules"

## Rate Limiting

### Overview

**Available on**: Pro, Business, Enterprise (with different limits)

**Purpose**: Limit request rate from IPs/users to prevent abuse

**Location**: Dashboard → Security → WAF → Rate limiting rules

### Create Rate Limiting Rule

**Basic Rule Structure**:
1. **Match criteria**: When to apply rate limit
2. **Rate**: Requests per time period
3. **Action**: What to do when exceeded
4. **Duration**: How long to apply action

**Example - Protect Login Endpoint**:
```
Name: Login Rate Limit
If: http.request.uri.path eq "/login" and http.request.method eq "POST"
Rate: 5 requests per 60 seconds
Action: Block for 300 seconds
```

**Example - API Rate Limit**:
```
Name: API Rate Limit
If: http.host eq "api.example.com"
Rate: 100 requests per 60 seconds
Characteristics: ip.src
Action: Challenge for 60 seconds
```

### Rate Limiting Characteristics

**Count by**:
- `ip.src`: Source IP (default)
- `http.request.headers["api-key"]`: API key
- `http.cookie["session"]`: Session cookie
- `cf.unique_visitor_id`: Cloudflare visitor ID

**Example - Per API Key**:
```
If: http.host eq "api.example.com"
Rate: 1000 requests per 3600 seconds
Count by: http.request.headers["X-API-Key"][0]
Action: Block for 600 seconds
```

### Rate Limiting Actions

- **Block**: Return 429 error
- **Challenge**: Show CAPTCHA
- **JS Challenge**: JavaScript check
- **Managed Challenge**: Adaptive challenge
- **Log**: Track violations without blocking (testing)

### Rate Limiting Examples

**Login Brute Force Protection**:
```
If: http.request.uri.path eq "/login" and http.request.method eq "POST"
Rate: 5 requests per 300 seconds (per IP)
Action: Block for 900 seconds
```

**Comment Spam Prevention**:
```
If: http.request.uri.path eq "/comments" and http.request.method eq "POST"
Rate: 3 requests per 60 seconds (per IP)
Action: Challenge for 300 seconds
```

**API Fair Use**:
```
If: http.host eq "api.example.com"
Rate: 100 requests per 60 seconds (per API key)
Count by: http.request.headers["X-API-Key"][0]
Action: Block for 60 seconds
Response: Custom 429 with retry-after header
```

**Search Rate Limit**:
```
If: http.request.uri.path contains "/search"
Rate: 20 requests per 60 seconds (per IP)
Action: JS Challenge for 300 seconds
```

## Bot Protection

### Bot Fight Mode (Free)

**Available on**: Free plan

**Purpose**: Basic bot protection with automatic mitigation

**How it works**:
- Challenges suspected bots
- Uses machine learning to identify bots
- Minimal configuration

**Enable**:
1. Dashboard → Security → Bots
2. Toggle "Bot Fight Mode" ON

**Limitations**:
- Cannot customize rules
- May occasionally challenge legitimate traffic
- No detailed bot analytics

### Super Bot Fight Mode (Paid)

**Available on**: Pro, Business plans

**Features**:
- Customizable bot protection
- Verified bot allowlist (Google, Bing, etc.)
- Detailed bot analytics
- Static resource protection

**Configure**:
1. Dashboard → Security → Bots
2. Choose action for each category:
   - Verified bots: Allow (search engines)
   - Likely bots: Challenge or Block
   - Definitely automated: Block

### Bot Management (Enterprise)

**Available on**: Enterprise plan

**Features**:
- Advanced ML-based detection
- Bot score (0-100)
- Custom rules based on bot score
- Detailed bot analytics and reporting

**Example Rule**:
```
(cf.bot_management.score lt 30)
```
Action: Block
_Block traffic with bot score under 30 (likely bot)_

## Security Level

### Overview

**Location**: Dashboard → Security → Settings

**Purpose**: Adjust challenge sensitivity globally

**Levels**:
- **Off**: No challenges (not recommended)
- **Essentially Off**: Challenge only most threatening
- **Low**: Challenge some threats
- **Medium**: Balanced (default)
- **High**: Challenge all threats
- **I'm Under Attack!**: Maximum protection (for DDoS)

### When to Use Each Level

**Medium** (default):
- Normal operations
- Balanced protection

**High**:
- Elevated threat period
- After noticing suspicious activity

**I'm Under Attack**:
- Active DDoS attack
- Massive bot attack
- Shows challenge page to all visitors before accessing site

**Note**: "I'm Under Attack" mode can affect legitimate users - use temporarily

## IP Access Rules

### Overview

**Location**: Dashboard → Security → WAF → Tools → IP Access Rules

**Purpose**: Simple IP-based allow/block/challenge list

**Scope**:
- This website only
- All websites in account

### Actions

- **Block**: Deny access (403 error)
- **Allow**: Bypass security checks
- **Challenge**: Show CAPTCHA
- **JS Challenge**: JavaScript verification
- **Managed Challenge**: Adaptive challenge

### Add IP Access Rule

**Single IP**:
```
IP: 192.0.2.1
Action: Block
Note: "Known attacker"
```

**IP Range (CIDR)**:
```
IP: 192.0.2.0/24
Action: Block
```

**Country**:
```
Country: CN
Action: Challenge
```

**ASN** (Autonomous System Number):
```
ASN: AS64496
Action: Block
Note: "Hosting provider known for abuse"
```

### Common IP Access Patterns

**Whitelist Office Network**:
```
IP: 203.0.113.0/24
Action: Allow
Scope: This website
```

**Block Known Malicious IPs**:
```
IP: 198.51.100.1
Action: Block
Note: "Brute force attacker"
```

**Challenge Entire Country**:
```
Country: XX
Action: Challenge
```

## Common Patterns

### Protect WordPress Admin

**Firewall Rule**:
```
(http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-login.php") and ip.src ne 203.0.113.1
```
Action: Block

**Rate Limiting Rule**:
```
If: http.request.uri.path eq "/wp-login.php" and http.request.method eq "POST"
Rate: 5 requests per 300 seconds
Action: Block for 900 seconds
```

### API Security Stack

**1. Require API Key (Firewall Rule)**:
```
(http.host eq "api.example.com" and not http.request.headers["X-API-Key"][0] in {"key1" "key2" "key3"})
```
Action: Block

**2. Rate Limit by API Key**:
```
If: http.host eq "api.example.com"
Rate: 1000 requests per 3600 seconds
Count by: http.request.headers["X-API-Key"][0]
Action: Block for 600 seconds
```

**3. Geo-restrict**:
```
(http.host eq "api.example.com" and ip.geoip.country ne "US")
```
Action: Block

### E-commerce Protection

**1. Protect Checkout**:
```
If: http.request.uri.path eq "/checkout" and http.request.method eq "POST"
Rate: 10 requests per 60 seconds
Action: Challenge for 300 seconds
```

**2. Card Testing Prevention**:
```
If: http.request.uri.path eq "/payment" and http.request.method eq "POST"
Rate: 3 requests per 300 seconds
Action: Block for 900 seconds
```

**3. Block High-Risk Countries**:
```
(http.request.uri.path contains "/checkout" and ip.geoip.country in {"XX" "YY" "ZZ"})
```
Action: Challenge

### Content Scraping Prevention

**1. Rate Limit Page Views**:
```
If: http.request.uri.path matches "^/articles/.*"
Rate: 30 requests per 60 seconds
Action: Challenge for 300 seconds
```

**2. Block Known Scrapers**:
```
(http.user_agent contains "scrapy" or http.user_agent contains "python-requests" or http.user_agent contains "curl")
```
Action: Block

**3. Challenge Missing Referrer**:
```
(http.request.uri.path matches "^/articles/.*" and not http.referer contains "example.com")
```
Action: JS Challenge

## Troubleshooting

### False Positives (Blocking Legitimate Users)

**Symptoms**:
- Users reporting 403 errors
- CAPTCHA challenges for normal traffic
- Legitimate requests blocked

**Solutions**:

1. **Check Firewall Event Log**:
   - Dashboard → Security → Events
   - Filter by action (Block, Challenge)
   - Identify triggered rule

2. **Temporarily Set Rule to Log**:
   - Change action to "Log" instead of "Block"
   - Monitor for false positives
   - Refine rule expression

3. **Add Exception**:
   ```
   # Original rule
   (http.request.uri.path contains "/admin")

   # Add exception for specific IP
   (http.request.uri.path contains "/admin" and ip.src ne 203.0.113.1)
   ```

4. **Adjust WAF Sensitivity**:
   - Dashboard → Security → WAF → Managed rules
   - Lower sensitivity from High to Medium
   - Disable specific rules causing issues

### Rate Limiting Too Aggressive

**Symptoms**:
- Legitimate users hitting rate limits
- 429 Too Many Requests errors

**Solutions**:

1. **Review Rate Limiting Log**:
   - Dashboard → Security → Events
   - Filter by "Rate Limiting"
   - Check if legitimate traffic

2. **Increase Limits**:
   - Adjust requests per period
   - Increase time window
   - Example: 10 req/60s → 20 req/60s

3. **Change Counting Characteristics**:
   ```
   # Instead of per IP
   Count by: ip.src

   # Try per session
   Count by: http.cookie["session"][0]
   ```

4. **Adjust Action**:
   - Change from Block to Challenge
   - Reduce block duration

### Bot Fight Mode Blocking Good Bots

**Symptoms**:
- Search engine crawlers blocked
- Monitoring tools failing
- API clients challenged

**Solutions**:

1. **Upgrade to Super Bot Fight Mode** (Pro+):
   - Allows whitelisting verified bots
   - More granular control

2. **Create Bypass Rule**:
   ```
   # Whitelist specific user agent
   (http.user_agent contains "Googlebot")
   ```
   Action: Allow

3. **Use IP Access Rule**:
   - Whitelist known good bot IPs
   - Create "Allow" rule for IP range

### Security Events Not Showing

**Symptoms**:
- Empty event log
- Rules not triggering

**Checks**:

1. **Verify Rule is Active**:
   - Check rule is enabled (toggle)
   - Verify expression is correct

2. **Test Rule Manually**:
   ```bash
   # Test with curl
   curl -I https://example.com/blocked-path

   # Test with specific IP (if VPN available)
   curl -I https://example.com -x proxy-in-blocked-country
   ```

3. **Check Rule Order**:
   - Earlier rules may be allowing traffic
   - Allow rules bypass later rules

4. **Verify Plan Limits**:
   - Free plan: 5 firewall rules
   - Ensure not exceeding limit

### Challenge Loop

**Symptoms**:
- Infinite CAPTCHA loop
- Challenge page keeps reloading

**Causes**:
- Conflicting rules
- Browser/client not accepting cookies
- Multiple challenge actions

**Solutions**:

1. **Check for Rule Conflicts**:
   - Review all firewall rules
   - Ensure no overlapping Challenge + Block rules

2. **Verify Cookie Settings**:
   - Challenge requires cookies
   - Test with cookies enabled

3. **Use Alternative Action**:
   - Try "Managed Challenge" instead of "Challenge"
   - Use "JS Challenge" for browsers

4. **Add Exception for Stuck Users**:
   - Temporarily whitelist affected IPs
   - Identify and fix problematic rule

## Security Configuration Checklist

### Basic Setup
- [ ] Review and enable appropriate security level
- [ ] Create IP access rules for known IPs (whitelist/blacklist)
- [ ] Enable Bot Fight Mode (Free) or Super Bot Fight Mode (Pro+)
- [ ] Review and enable WAF managed rules (Pro+)

### Firewall Rules
- [ ] Create rules to protect admin areas
- [ ] Block known malicious IPs/countries
- [ ] Whitelist office/trusted IPs
- [ ] Set up geographic restrictions (if needed)
- [ ] Test rules with "Log" action first

### Rate Limiting (Pro+)
- [ ] Protect login endpoints (5 req/5min)
- [ ] Protect API endpoints (appropriate limits)
- [ ] Protect form submissions (contact, comments)
- [ ] Test rate limits don't affect legitimate users

### Monitoring
- [ ] Review security events daily
- [ ] Set up alerts for high threat activity
- [ ] Monitor false positive rate
- [ ] Adjust rules based on event log
- [ ] Document rule purposes and exceptions

### Testing
- [ ] Test legitimate user access
- [ ] Verify admin access works
- [ ] Test API endpoints
- [ ] Check search engine crawling
- [ ] Verify monitoring tools work
- [ ] Test from different geographic locations
