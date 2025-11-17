# SSL/TLS Configuration Guide

Complete guide to SSL/TLS certificate management and HTTPS configuration in Cloudflare.

## Table of Contents

1. [Overview](#overview)
2. [SSL/TLS Modes](#ssltls-modes)
3. [Universal SSL](#universal-ssl)
4. [Custom Certificates](#custom-certificates)
5. [Origin Certificates](#origin-certificates)
6. [Edge Certificates](#edge-certificates)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

Cloudflare provides free SSL/TLS certificates for all domains, with options for:
- Automatic certificate provisioning (Universal SSL)
- Custom certificates (uploaded by you)
- Origin certificates (for backend security)
- Advanced certificate management (dedicated certificates, custom hostnames)

**Two Encryption Paths**:
1. **Visitor to Cloudflare**: Edge certificate (managed by Cloudflare)
2. **Cloudflare to Origin**: Origin certificate (your responsibility)

```
[Visitor] --HTTPS--> [Cloudflare Edge] --HTTPS--> [Origin Server]
          (Edge Cert)                   (Origin Cert)
```

## SSL/TLS Modes

### Overview of Modes

| Mode | Visitor→Cloudflare | Cloudflare→Origin | Security Level | Use Case |
|------|-------------------|-------------------|----------------|----------|
| **Off** | HTTP only | HTTP | None | Not recommended |
| **Flexible** | HTTPS | HTTP | Low | Quick setup, no origin cert needed |
| **Full** | HTTPS | HTTPS | Medium | Self-signed origin cert OK |
| **Full (strict)** | HTTPS | HTTPS (validated) | High | **Recommended** - Valid origin cert required |

### Off (Not Secure)

**Description**: No encryption at all

**Configuration**:
- Visitor → Cloudflare: HTTP
- Cloudflare → Origin: HTTP

**When to Use**: Never (for production)

**Issues**:
- No encryption
- Data transmitted in plain text
- Browser shows "Not Secure"
- SEO penalties

### Flexible

**Description**: Encrypts traffic between visitor and Cloudflare only

**Configuration**:
- Visitor → Cloudflare: HTTPS (encrypted)
- Cloudflare → Origin: HTTP (unencrypted)

**When to Use**:
- Testing/development only
- Quick setup when origin can't support SSL
- Shared hosting without SSL support

**Security Issues**:
- Origin traffic is unencrypted
- Vulnerable to man-in-the-middle attacks between Cloudflare and origin
- Not recommended for production

**Setup**:
1. Dashboard → SSL/TLS → Overview
2. Select "Flexible"
3. Enable "Always Use HTTPS" (optional)

### Full

**Description**: Encrypts both connections, accepts self-signed origin certificates

**Configuration**:
- Visitor → Cloudflare: HTTPS (encrypted)
- Cloudflare → Origin: HTTPS (encrypted, self-signed OK)

**When to Use**:
- Origin has self-signed certificate
- Using Cloudflare Origin Certificate
- Development/staging environments

**Advantages**:
- End-to-end encryption
- Works with self-signed certificates
- Better than Flexible

**Limitations**:
- Doesn't validate origin certificate
- Won't detect origin certificate issues

**Setup**:
1. Install certificate on origin (self-signed or Cloudflare Origin Certificate)
2. Dashboard → SSL/TLS → Overview
3. Select "Full"

### Full (Strict) - RECOMMENDED

**Description**: Full encryption with validated origin certificate

**Configuration**:
- Visitor → Cloudflare: HTTPS (encrypted)
- Cloudflare → Origin: HTTPS (encrypted, validated)

**When to Use**:
- **Production environments** (always)
- When security is important
- When origin has valid SSL certificate

**Requirements**:
- Origin must have valid SSL certificate from:
  - Public CA (Let's Encrypt, DigiCert, etc.)
  - Cloudflare Origin Certificate
- Certificate must not be expired
- Certificate must match hostname

**Setup**:
1. Install valid certificate on origin
2. Dashboard → SSL/TLS → Overview
3. Select "Full (strict)"

## Universal SSL

### What is Universal SSL?

**Free SSL certificates** automatically provisioned for all Cloudflare domains.

**Features**:
- Completely free
- Automatic renewal
- Covers root domain + www subdomain
- DV (Domain Validated) certificates
- Issued within 24 hours (usually minutes)

**Certificate Details**:
- Valid for: `example.com` and `www.example.com`
- Issuer: Let's Encrypt or Google Trust Services
- Validity: 90 days (auto-renewed)
- Type: Shared certificate (SNI)

### Enable Universal SSL

**Automatic**: Enabled by default when you add a domain

**Manual**:
1. Dashboard → SSL/TLS → Edge Certificates
2. Scroll to "Disable Universal SSL"
3. Toggle ON (if disabled)

**Issuance Time**:
- Usually within 15 minutes
- Can take up to 24 hours
- Requires DNS to be active

### Universal SSL Status

**Check Status**:
1. Dashboard → SSL/TLS → Edge Certificates
2. Look for "Universal SSL Status"

**Statuses**:
- **Active**: Certificate issued and working
- **Initializing**: Being provisioned
- **Pending Validation**: Waiting for DNS validation
- **Pending Deployment**: Certificate issued, deploying to edge

**If Stuck**:
```bash
# Verify DNS is resolving
dig example.com

# Check CAA records (if any)
dig CAA example.com
```

## Custom Certificates

### Upload Custom Certificate

**Use Case**: Use your own certificate (EV, OV, or specific CA requirements)

**Requirements**:
- Available on Business and Enterprise plans only
- Certificate file (PEM format)
- Private key (PEM format)
- Optional: Intermediate certificates

**Upload Process**:
1. Dashboard → SSL/TLS → Edge Certificates
2. Click "Upload Custom Certificate"
3. Paste certificate and private key
4. Select certificate priority
5. Click "Upload"

**Certificate Format**:
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Intermediate Certificate if needed]
-----END CERTIFICATE-----
```

**Private Key Format**:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0...
-----END PRIVATE KEY-----
```

### Custom Certificate Priority

**Cloudflare Managed (default)**: Use Universal SSL
**Custom Certificate**: Use your uploaded certificate

**Setting Priority**:
- Higher priority = used first
- Useful for gradual rollout or A/B testing

## Origin Certificates

### What are Origin Certificates?

**Free certificates** issued by Cloudflare to secure traffic between Cloudflare and your origin server.

**Benefits**:
- Free forever
- Valid up to 15 years
- Easy to generate in dashboard
- Works perfectly with Full (strict) mode
- Covers multiple hostnames/wildcards

**Important**: Only trusted by Cloudflare, not by browsers (not for non-proxied domains)

### Create Origin Certificate

**Steps**:
1. Dashboard → SSL/TLS → Origin Server
2. Click "Create Certificate"
3. Choose options:
   - **Generate private key**: Let Cloudflare generate (recommended)
   - **Use my private key**: Paste your CSR
4. List hostnames:
   ```
   example.com
   *.example.com
   www.example.com
   ```
5. Certificate validity: 15 years (default)
6. Click "Next"

**Output**:
- Origin Certificate (install on server)
- Private Key (install on server, keep secret!)

### Install Origin Certificate

**Apache**:
```apache
# /etc/apache2/sites-available/example.com-ssl.conf
<VirtualHost *:443>
    ServerName example.com

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cloudflare-origin.crt
    SSLCertificateKeyFile /etc/ssl/private/cloudflare-origin.key

    # Rest of config...
</VirtualHost>
```

**Nginx**:
```nginx
# /etc/nginx/sites-available/example.com
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/cloudflare-origin.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    # Rest of config...
}
```

**IIS** (Windows):
1. Open IIS Manager
2. Select server → Server Certificates
3. Import → Select `.pfx` file
4. Bind certificate to site

**Convert to PFX** (for IIS):
```bash
openssl pkcs12 -export \
  -out certificate.pfx \
  -inkey cloudflare-origin.key \
  -in cloudflare-origin.crt
```

### Verify Origin Certificate

```bash
# Test SSL connection
openssl s_client -connect origin-ip:443 -servername example.com

# Check certificate details
openssl x509 -in cloudflare-origin.crt -text -noout
```

## Edge Certificates

### Edge Certificate Settings

**Location**: Dashboard → SSL/TLS → Edge Certificates

**Available Settings**:

#### Always Use HTTPS
- Redirects all HTTP requests to HTTPS
- Recommended: Enabled
- 301 redirect (permanent)

#### HTTP Strict Transport Security (HSTS)
- Forces browsers to use HTTPS
- **WARNING**: Can't be easily undone
- Settings:
  - Max Age: 6 months (recommended)
  - Include subdomains: Yes (if all subdomains support HTTPS)
  - Preload: Only if you're sure

**Enable HSTS**:
1. Enable "Always Use HTTPS" first
2. Verify all subdomains support HTTPS
3. Enable HSTS with short max-age (1 month)
4. Test thoroughly
5. Increase max-age gradually

#### Minimum TLS Version
- TLS 1.0: Legacy (insecure)
- TLS 1.1: Legacy (insecure)
- TLS 1.2: Recommended minimum
- TLS 1.3: Most secure (recommended if supported)

**Recommendation**: Set to TLS 1.2 or higher

#### Opportunistic Encryption
- Allows HTTP/2 on unencrypted connections
- Recommended: Enabled

#### TLS 1.3
- Latest TLS version (faster, more secure)
- Recommended: Enabled
- No downside to enabling

#### Automatic HTTPS Rewrites
- Rewrites insecure links to HTTPS
- Fixes mixed content warnings
- Recommended: Enabled

### Certificate Transparency Monitoring

**What it is**: Public log of SSL certificate issuance

**Benefits**:
- Detects unauthorized certificate issuance
- Monitors certificate lifecycle
- Alerts on suspicious activity

**Enable**:
1. Dashboard → SSL/TLS → Edge Certificates
2. Enable "Certificate Transparency Monitoring"
3. Configure email alerts

## Best Practices

### Recommended Configuration

**For Production**:
```
SSL/TLS Mode: Full (strict)
Always Use HTTPS: Enabled
HSTS: Enabled (after testing)
  - Max Age: 15768000 (6 months)
  - Include Subdomains: Yes
  - Preload: No (unless submitting to HSTS preload list)
Minimum TLS Version: 1.2
TLS 1.3: Enabled
Automatic HTTPS Rewrites: Enabled
Opportunistic Encryption: Enabled
Certificate Transparency Monitoring: Enabled
```

### Security Headers

**Add to Origin Server** (or via Workers):

```nginx
# Security headers (Nginx)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Certificate Renewal

**Universal SSL**:
- Automatic renewal by Cloudflare
- No action needed
- Renewed ~30 days before expiration

**Custom Certificates**:
- Manual renewal required
- Set calendar reminder 30 days before expiration
- Upload new certificate before old expires

**Origin Certificates**:
- Valid up to 15 years
- Renewal reminder in dashboard
- Generate new certificate before expiration

### Testing SSL Configuration

**SSL Labs Test**:
```
https://www.ssllabs.com/ssltest/analyze.html?d=example.com
```

**Check for**:
- Grade A or A+ rating
- TLS 1.2+ support
- Strong cipher suites
- HSTS enabled
- Certificate chain complete

**Command Line Test**:
```bash
# Test SSL connection
curl -I https://example.com

# Check certificate
openssl s_client -connect example.com:443 -servername example.com

# Test HSTS
curl -I https://example.com | grep -i strict-transport
```

## Troubleshooting

### SSL Certificate Error: "Your connection is not private"

**Causes**:
1. Certificate not yet issued (wait 24 hours)
2. DNS not pointed to Cloudflare
3. SSL mode mismatch
4. Certificate expired

**Solutions**:
```bash
# Check DNS is pointed to Cloudflare
dig example.com

# Verify Cloudflare is serving site
curl -I https://example.com | grep -i cf-ray

# Check certificate
openssl s_client -connect example.com:443 -servername example.com | grep -A 2 "Verify return code"
```

### Mixed Content Warnings

**Problem**: HTTPS page loading HTTP resources

**Symptoms**:
- Browser shows "Not Secure" warning
- Console errors: "Mixed Content: The page was loaded over HTTPS..."

**Solutions**:
1. Enable "Automatic HTTPS Rewrites"
   - Dashboard → SSL/TLS → Edge Certificates

2. Update hardcoded HTTP links to HTTPS:
   ```html
   <!-- Before -->
   <script src="http://example.com/script.js"></script>

   <!-- After -->
   <script src="https://example.com/script.js"></script>

   <!-- Or use protocol-relative URLs -->
   <script src="//example.com/script.js"></script>
   ```

3. Use Content Security Policy:
   ```
   Content-Security-Policy: upgrade-insecure-requests;
   ```

### Too Many Redirects

**Problem**: Infinite redirect loop between HTTP and HTTPS

**Cause**: Origin server is redirecting HTTPS to HTTP

**Solution 1 - Origin Server Fix**:
```nginx
# Nginx - check for Cloudflare header
if ($http_x_forwarded_proto = "http") {
    return 301 https://$host$request_uri;
}
```

```apache
# Apache - check for Cloudflare header
RewriteEngine On
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
```

**Solution 2 - Change SSL Mode**:
- Change from Flexible to Full or Full (strict)

**Solution 3 - Disable Origin HTTPS Redirect**:
- Remove redirect rules from origin server
- Let Cloudflare handle HTTPS redirect

### Origin Server Not Responding (525/526 Errors)

**Error 525**: SSL handshake failed
- Origin certificate invalid or expired
- Verify origin certificate is installed correctly

**Error 526**: Invalid SSL certificate
- Using Full (strict) mode but origin cert is self-signed
- Solution: Use Cloudflare Origin Certificate or change to Full mode

**Debugging**:
```bash
# Test direct connection to origin
openssl s_client -connect origin-ip:443 -servername example.com

# Check certificate expiration
openssl s_client -connect origin-ip:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates
```

### HSTS Issues

**Problem**: Can't access site, HSTS error

**Cause**: HSTS enabled but SSL not working

**Solution**:
1. Fix SSL issues first
2. Clear HSTS in browser:
   - Chrome: chrome://net-internals/#hsts
   - Firefox: Clear history → Clear cookies
3. Wait for HSTS max-age to expire (if short)

**Prevention**: Always test HTTPS fully before enabling HSTS

### CAA Record Blocking Certificate Issuance

**Problem**: Universal SSL stuck in "Pending Validation"

**Cause**: CAA record restricts certificate issuance

**Check**:
```bash
dig CAA example.com
```

**Solution**: Add Cloudflare CAs to CAA records
```
CAA  @  0 issue "letsencrypt.org"
CAA  @  0 issue "pki.goog"
CAA  @  0 issue "digicert.com"
```

## SSL/TLS Configuration Checklist

### Initial Setup
- [ ] Verify domain is active on Cloudflare
- [ ] Universal SSL certificate issued (check status)
- [ ] Choose appropriate SSL/TLS mode
- [ ] Install origin certificate (if using Full/Full strict)
- [ ] Test HTTPS connection

### Security Configuration
- [ ] Set SSL/TLS mode to "Full (strict)"
- [ ] Enable "Always Use HTTPS"
- [ ] Set minimum TLS version to 1.2+
- [ ] Enable TLS 1.3
- [ ] Enable Automatic HTTPS Rewrites
- [ ] Configure HSTS (after testing)
- [ ] Enable Certificate Transparency Monitoring

### Origin Server
- [ ] Install Cloudflare Origin Certificate
- [ ] Configure web server to use certificate
- [ ] Test direct HTTPS connection to origin
- [ ] Configure proper HTTPS redirect handling
- [ ] Add security headers

### Testing
- [ ] Test HTTPS loads correctly
- [ ] Check for mixed content warnings
- [ ] Verify no redirect loops
- [ ] Test SSL Labs score (aim for A+)
- [ ] Verify HSTS header present (if enabled)
- [ ] Test from multiple browsers

### Monitoring
- [ ] Set calendar reminder for certificate renewal (if custom)
- [ ] Monitor certificate expiration alerts
- [ ] Review SSL/TLS analytics monthly
- [ ] Check for any certificate transparency alerts
