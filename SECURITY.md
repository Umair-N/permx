# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in PermX, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the maintainers (see package.json for contact)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Security Considerations

PermX is an authorization library. When using it:

- Always validate user input before passing to `authorize()` or `authorizeApi()`
- Use HTTPS for all API communication
- Store permission data in a secured database
- Use the `superAdmin` check sparingly and audit its usage
- Enable multi-tenancy isolation when serving multiple tenants
- Rotate any exposed secrets immediately
