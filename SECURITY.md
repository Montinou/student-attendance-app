# Security Guidelines

## Credential Management

### DO NOT Hardcode Credentials

**NEVER** commit the following to Git:
- API tokens
- Passwords
- Private keys
- Environment variables with sensitive data

### Proper Token Storage

#### Local Development

Store credentials in `.env.local` (already in `.gitignore`):

```bash
# .env.local
VERCEL_TOKEN=your_actual_token_here
NEXT_PUBLIC_SUPABASE_URL=https://elthoicbggstbrjsxuog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

#### Using Vercel CLI with Environment Variables

```bash
# Option 1: Use environment variable
export VERCEL_TOKEN="your_token_here"
vercel --token $VERCEL_TOKEN

# Option 2: Add to shell profile (~/.zshrc or ~/.bashrc)
echo 'export VERCEL_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc

# Then use it
vercel deploy
```

#### CI/CD Pipelines

For GitHub Actions or other CI/CD:
1. Store token in GitHub Secrets (Settings → Secrets → Actions)
2. Reference as `${{ secrets.VERCEL_TOKEN }}`

### How to Rotate Compromised Tokens

If a token is exposed (committed to Git, posted publicly, etc.):

#### 1. Revoke the Compromised Token

**For Vercel:**
1. Go to https://vercel.com/account/tokens
2. Find and delete the compromised token
3. Create a new token with a descriptive name (e.g., "CLI Access 2025")
4. Copy the new token immediately (you can only see it once)

**For Supabase:**
1. Go to https://supabase.com/dashboard/project/elthoicbggstbrjsxuog/settings/api
2. Use "Reset" button for compromised keys
3. Update all instances using the old key

#### 2. Update Local Environment

```bash
# Update .env.local with new token
nano .env.local
# Replace old token with new one

# Update shell profile if exported there
nano ~/.zshrc
source ~/.zshrc
```

#### 3. Update CI/CD Secrets

Update the token in:
- GitHub Actions secrets
- Vercel project settings
- Any other automation tools

#### 4. Remove from Git History (if committed)

**WARNING:** This rewrites Git history and can cause issues for collaborators.

```bash
# Use BFG Repo Cleaner (recommended)
git clone --mirror https://github.com/yourusername/repo.git
bfg --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# OR use git filter-branch (slower)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all
git push --force --all
```

**Better approach:** Treat the token as compromised and rotate it (steps above).

## Incident Response Checklist

If you receive a security alert about exposed credentials:

- [ ] Immediately revoke/rotate the compromised credential
- [ ] Remove the credential from all files in the repository
- [ ] Check git history for other exposed secrets
- [ ] Update all systems using the old credential
- [ ] Review access logs for unauthorized usage
- [ ] Document the incident and remediation steps
- [ ] Update security practices to prevent recurrence

## Prevention Best Practices

1. **Use `.env.local` for all secrets** (never commit this file)
2. **Use `.env.local.example`** to document required variables (safe to commit)
3. **Enable pre-commit hooks** to scan for secrets before commit
4. **Use environment variables** in all documentation, never actual tokens
5. **Regular security audits** of repositories for exposed credentials
6. **Use secret management tools** like 1Password, LastPass, or AWS Secrets Manager

## Tools for Secret Scanning

### Install git-secrets
```bash
brew install git-secrets

# Set up hooks
cd your-repo
git secrets --install
git secrets --register-aws
```

### Install gitleaks
```bash
brew install gitleaks

# Scan repository
gitleaks detect --source . --verbose
```

## Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [How to Rotate Keys](https://howtorotate.com/docs/introduction/getting-started/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
