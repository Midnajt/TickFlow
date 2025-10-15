# Quick Fix Checklist for E2E Tests

## ✅ Step-by-Step Guide

### Step 1: Reseed Database (REQUIRED!)
```bash
npm run seed:users
npm run seed:categories
```

**Why?** Password for `newuser@tickflow.com` was updated from `TempPass123!` to `Agent123!@#`

### Step 2: Run Tests
```bash
npm run test:e2e
```

### Step 3: Verify Results
All 17 auth tests should pass ✅

---

## 🔍 If Tests Still Fail

### Check 1: Database Users
Verify these users exist with correct passwords:
- newuser@tickflow.com / Agent123!@# (force_password_change: true)
- user@tickflow.com / User123!@#
- agent@tickflow.com / Agent123!@#

### Check 2: Error Messages
Tests now expect these exact messages:
- "Email jest wymagany"
- "Nieprawidłowy email lub hasło"
- "Hasła muszą być identyczne"

### Check 3: Redirect Behavior
After login, app redirects to `/` (root), NOT `/tickets`

---

## 📚 More Info
- Full details: `docs/E2E_SETUP_GUIDE.md`
- Changes summary: `docs/TEST_FIXES_SUMMARY.md`
- Test README: `tests/e2e/README.md`

