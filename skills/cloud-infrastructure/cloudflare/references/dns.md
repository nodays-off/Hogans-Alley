# DNS Configuration Guide

Complete guide to configuring DNS records and domain settings in Cloudflare.

## Table of Contents

1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [DNS Record Types](#dns-record-types)
4. [Common Configurations](#common-configurations)
5. [Advanced Features](#advanced-features)
6. [DNSSEC](#dnssec)
7. [Troubleshooting](#troubleshooting)

## Overview

Cloudflare DNS provides:
- Fast global DNS resolution (fastest in the industry)
- Free DNSSEC
- Advanced traffic management
- Automatic IPv6 support
- DNS analytics and monitoring

**Key Concept**: DNS records tell the internet where to find your services (web servers, email, etc.).

## Initial Setup

### Add Domain to Cloudflare

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Click "Add a Site"

2. **Enter Domain Name**
   - Type your domain (e.g., `example.com`)
   - Select a plan (Free is sufficient for most use cases)

3. **Review Existing DNS Records**
   - Cloudflare scans and imports existing records
   - Verify all records are correct
   - Add any missing records

4. **Update Nameservers**
   - Cloudflare provides two nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`)
   - Log in to your domain registrar (GoDaddy, Namecheap, etc.)
   - Replace existing nameservers with Cloudflare's nameservers
   - **Wait 24-48 hours** for propagation

5. **Verify Activation**
   ```bash
   # Check nameservers
   dig NS example.com

   # Should return Cloudflare nameservers
   # example.com. 3600 IN NS ns1.cloudflare.com.
   # example.com. 3600 IN NS ns2.cloudflare.com.
   ```

## DNS Record Types

### A Record (IPv4 Address)

**Purpose**: Points domain/subdomain to an IPv4 address

**Example**:
```
Type: A
Name: example.com (or @)
IPv4 address: 192.0.2.1
TTL: Auto
Proxy status: Proxied (orange cloud)
```

**Use Cases**:
- Point root domain to web server
- Point subdomain to specific service
- Direct traffic to origin server

### AAAA Record (IPv6 Address)

**Purpose**: Points domain/subdomain to an IPv6 address

**Example**:
```
Type: AAAA
Name: example.com
IPv6 address: 2001:0db8::1
TTL: Auto
Proxy status: Proxied
```

**Use Cases**:
- IPv6-only servers
- Modern infrastructure with dual-stack support

### CNAME Record (Canonical Name)

**Purpose**: Creates an alias pointing to another domain

**Example**:
```
Type: CNAME
Name: www
Target: example.com
TTL: Auto
Proxy status: Proxied
```

**Important Rules**:
- Cannot be used for root domain (`@`)
- Cannot coexist with other records for same name
- Commonly used for `www` subdomain

**Use Cases**:
- Point `www.example.com` to `example.com`
- Point subdomain to external service (e.g., `blog` → `myblog.wordpress.com`)
- Load balancer aliases

### MX Record (Mail Exchange)

**Purpose**: Routes email to mail servers

**Example**:
```
Type: MX
Name: example.com (or @)
Mail server: mail.example.com
Priority: 10
TTL: Auto
```

**Priority**: Lower number = higher priority (10 before 20)

**Common Setup (Google Workspace)**:
```
MX  @  ASPMX.L.GOOGLE.COM        Priority: 1
MX  @  ALT1.ASPMX.L.GOOGLE.COM   Priority: 5
MX  @  ALT2.ASPMX.L.GOOGLE.COM   Priority: 5
MX  @  ALT3.ASPMX.L.GOOGLE.COM   Priority: 10
MX  @  ALT4.ASPMX.L.GOOGLE.COM   Priority: 10
```

### TXT Record (Text)

**Purpose**: Stores text information for verification and security

**Example**:
```
Type: TXT
Name: example.com (or @)
Content: "v=spf1 include:_spf.google.com ~all"
TTL: Auto
```

**Use Cases**:
- **SPF**: Email authentication (`v=spf1...`)
- **DKIM**: Email signing (`v=DKIM1; k=rsa; p=...`)
- **DMARC**: Email policy (`v=DMARC1; p=quarantine...`)
- **Domain Verification**: Prove domain ownership
- **Site Verification**: Google Search Console, etc.

### SRV Record (Service)

**Purpose**: Specifies location of services

**Example**:
```
Type: SRV
Name: _service._protocol.example.com
Service: _minecraft._tcp
Priority: 0
Weight: 5
Port: 25565
Target: mc.example.com
```

**Use Cases**:
- Minecraft servers
- VoIP/SIP services
- XMPP/Jabber
- LDAP directories

### CAA Record (Certification Authority Authorization)

**Purpose**: Controls which CAs can issue certificates for your domain

**Example**:
```
Type: CAA
Name: example.com (or @)
Tag: issue
Value: letsencrypt.org
```

**Common Configurations**:
```
# Allow Let's Encrypt only
CAA  @  0 issue "letsencrypt.org"

# Allow multiple CAs
CAA  @  0 issue "letsencrypt.org"
CAA  @  0 issue "digicert.com"

# Disallow all certificate issuance
CAA  @  0 issue ";"

# Wildcard certificates
CAA  @  0 issuewild "letsencrypt.org"
```

## Common Configurations

### Root Domain + WWW

**Pattern**: Both `example.com` and `www.example.com` work

**Configuration**:
```
# Root domain points to server
A     @     192.0.2.1     Proxied

# WWW is alias to root
CNAME www   example.com   Proxied
```

### Subdomain Setup

**Pattern**: Different services on different subdomains

**Configuration**:
```
# Main site
A     @       192.0.2.1     Proxied

# Blog
A     blog    192.0.2.2     Proxied

# API
A     api     192.0.2.3     Proxied

# Email
MX    @       mail.example.com   Priority: 10
A     mail    192.0.2.4     DNS only (not proxied)
```

### Email Configuration

**Complete email setup**:

```
# MX Records (routing)
MX    @    mail.example.com    Priority: 10

# A Record for mail server
A     mail   192.0.2.5    DNS only

# SPF (sender authentication)
TXT   @    "v=spf1 mx include:_spf.google.com ~all"

# DMARC (policy)
TXT   _dmarc   "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"

# DKIM (signing key - provided by email provider)
TXT   default._domainkey   "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
```

### Third-Party Service Integration

**Vercel/Netlify**:
```
CNAME  www    cname.vercel-dns.com   DNS only
A      @      76.76.21.21           Proxied (optional)
```

**GitHub Pages**:
```
CNAME  www    username.github.io    DNS only
A      @      185.199.108.153       Proxied (optional)
A      @      185.199.109.153       Proxied (optional)
A      @      185.199.110.153       Proxied (optional)
A      @      185.199.111.153       Proxied (optional)
```

## Advanced Features

### Proxy Status (Orange vs Gray Cloud)

**Proxied (Orange Cloud)**:
- Traffic routes through Cloudflare
- Enables CDN, WAF, DDoS protection
- Hides origin IP address
- Use for: Web traffic (HTTP/HTTPS)

**DNS Only (Gray Cloud)**:
- Direct connection to origin
- No Cloudflare protection
- Required for: Email (MX), FTP, SSH, game servers

**When to Use DNS Only**:
- Email servers (MX records)
- Non-HTTP protocols
- Services requiring direct connection
- When troubleshooting SSL issues

### TTL (Time To Live)

**What it means**: How long DNS resolvers cache your record

**Options**:
- **Auto**: Cloudflare manages (recommended)
- **2 min**: Fast changes, more queries
- **5 min - 1 hour**: Balanced
- **1 day+**: Rarely changing records

**Best Practices**:
- Use Auto for proxied records
- Use shorter TTL before making changes
- Use longer TTL for stable records (email)

### DNS Record Priority

**MX Records**: Use priority to control mail routing
```
MX  @  primary-mail.example.com      Priority: 10
MX  @  backup-mail.example.com       Priority: 20
```
Lower number = tried first

**SRV Records**: Use priority + weight for load balancing
```
SRV  _service._tcp  server1.example.com  Priority: 10, Weight: 5
SRV  _service._tcp  server2.example.com  Priority: 10, Weight: 5
```

## DNSSEC

### What is DNSSEC?

**Purpose**: Cryptographically signs DNS records to prevent tampering

**Benefits**:
- Prevents DNS spoofing/cache poisoning
- Ensures DNS responses are authentic
- Required for some compliance standards

### Enable DNSSEC

1. **In Cloudflare Dashboard**:
   - Go to DNS tab
   - Click "Enable DNSSEC"
   - Copy DS record information

2. **At Your Registrar**:
   - Log in to domain registrar
   - Find DNSSEC settings
   - Add DS record with provided values:
     - Key Tag
     - Algorithm
     - Digest Type
     - Digest

3. **Verify**:
   ```bash
   # Check DNSSEC status
   dig +dnssec example.com

   # Should show RRSIG records
   ```

### DNSSEC Status Checks

```bash
# Detailed DNSSEC validation
dig +dnssec +multi example.com

# Check DS records at parent
dig DS example.com @8.8.8.8

# Verify chain of trust
drill -TD example.com
```

## Troubleshooting

### DNS Not Resolving

**Problem**: Domain not loading

**Checks**:
1. Verify nameservers are updated at registrar
   ```bash
   dig NS example.com
   ```

2. Check DNS propagation
   ```bash
   # Check from different locations
   dig @8.8.8.8 example.com      # Google DNS
   dig @1.1.1.1 example.com      # Cloudflare DNS
   dig @208.67.222.222 example.com  # OpenDNS
   ```

3. Wait for propagation (up to 48 hours)

4. Clear local DNS cache
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### CNAME Flattening

**Problem**: Want CNAME at root domain (not allowed by DNS standards)

**Solution**: Cloudflare automatically "flattens" CNAME records at root
```
# This works in Cloudflare (normally not allowed)
CNAME  @  external-service.com  Proxied
```

**How it works**: Cloudflare resolves the CNAME and presents A/AAAA records

### Subdomain Not Working

**Problem**: Subdomain (e.g., `api.example.com`) not resolving

**Checks**:
1. Verify record exists in DNS dashboard
2. Check proxy status (orange vs gray)
3. Verify origin server is accessible
   ```bash
   dig api.example.com
   curl -I http://192.0.2.1  # Direct IP test
   ```

### Email Not Working

**Problem**: Emails not being delivered

**Checks**:
1. Verify MX records exist and are DNS only (gray cloud)
   ```bash
   dig MX example.com
   ```

2. Check SPF/DKIM/DMARC records
   ```bash
   dig TXT example.com
   dig TXT _dmarc.example.com
   ```

3. Test email authentication
   - Send test email to mail-tester.com
   - Check spam score and authentication

4. Verify mail server is reachable
   ```bash
   telnet mail.example.com 25
   ```

### Records Not Updating

**Problem**: DNS changes not taking effect

**Checks**:
1. Clear Cloudflare cache if proxied
   - Dashboard → Caching → Configuration → Purge Everything

2. Check TTL settings
   - Lower TTL if frequent changes needed

3. Verify correct record type
   - Can't have both A and CNAME for same name

4. Test with direct DNS query
   ```bash
   # Query Cloudflare directly
   dig @ns1.cloudflare.com example.com
   ```

## DNS Configuration Checklist

### Initial Setup
- [ ] Add domain to Cloudflare
- [ ] Review imported DNS records
- [ ] Update nameservers at registrar
- [ ] Verify nameserver change (dig NS domain.com)
- [ ] Wait for full propagation (24-48 hours)

### Basic Records
- [ ] Configure root domain A/AAAA record
- [ ] Add www CNAME record
- [ ] Set appropriate proxy status (orange/gray)
- [ ] Configure subdomain records as needed

### Email Configuration
- [ ] Add MX records for mail routing
- [ ] Create A record for mail server (DNS only)
- [ ] Add SPF TXT record
- [ ] Add DKIM TXT record
- [ ] Add DMARC TXT record
- [ ] Test email delivery

### Security
- [ ] Enable DNSSEC in Cloudflare
- [ ] Add DS record at registrar
- [ ] Add CAA records to control certificate issuance
- [ ] Verify DNSSEC validation

### Verification
- [ ] Test DNS resolution (dig/nslookup)
- [ ] Verify website loads correctly
- [ ] Test email sending/receiving
- [ ] Check all subdomains
- [ ] Verify SSL certificates work
- [ ] Test from multiple geographic locations
