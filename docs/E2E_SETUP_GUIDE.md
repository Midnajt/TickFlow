# E2E Tests Setup Guide

## Automatic Database Setup

E2E tests now automatically seed the database before running via `globalSetup` in `playwright.config.ts`.

The setup script (`tests/e2e/global-setup.ts`) will:
- Create or update test users with correct passwords
- Seed categories into the database
- Ensure the database is in a known state

### Test Users (Auto-seeded)

- **newuser@tickflow.com** / Agent123!@# (USER role, force_password_change: true)
- **user@tickflow.com** / User123!@# (USER role, force_password_change: false)
- **agent@tickflow.com** / Agent123!@# (AGENT role, force_password_change: false)

### Running Tests

```bash
npm run test:e2e
```

The database will be automatically seeded before tests run.

### Manual Database Seeding (Optional)

If you need to manually seed the database:

```bash
npm run seed:users
npm run seed:categories
```

## Changes Made to Fix Tests

### 1. Automatic Database Seeding
**File:** `tests/e2e/global-setup.ts` (NEW)
- **Added:** Global setup script that runs before all tests
- **Purpose:** Automatically seeds test users and categories
- **Reason:** Tests were failing because database wasn't seeded

**File:** `playwright.config.ts`
- **Changed:** Enabled globalSetup to run `tests/e2e/global-setup.ts`
- **Reason:** Automate database seeding before tests

### 2. Form Validation Messages
**File:** `app/lib/validators/auth.ts`
- **Changed:** loginSchema now uses `.min(1)` validation for empty fields
- **Before:** `z.string({ message: "Email jest wymagany" })`
- **After:** `z.string({ required_error: "Email jest wymagany" }).min(1, "Email jest wymagany")`
- **Reason:** Zod's `message` parameter on `z.string()` doesn't catch empty strings, `.min(1)` does

### 3. API Error Handling
**File:** `app/api/auth/login/route.ts`
- **Added:** Try-catch block around `request.json()` parsing
- **Reason:** Provides better error messages when request body is invalid or empty

**File:** `app/components/LoginForm.tsx`
- **Added:** Try-catch block around `response.json()` parsing
- **Reason:** Handles cases where API response isn't valid JSON

### 4. Logout Redirect
**File:** `app/components/LogoutButton.tsx`
- **Changed:** Use `window.location.href` instead of `router.push()`
- **Reason:** Forces full page reload, ensuring middleware runs and redirects to login

### 5. Test Helpers
**File:** `tests/e2e/helpers/auth-helpers.ts`
- **Exists:** Helper functions for authentication in tests
- **Purpose:** Consistent test user credentials and login/logout helpers

## Test User Credentials

All test credentials are defined in `tests/e2e/helpers/auth-helpers.ts` and match the global setup script in `tests/e2e/global-setup.ts`.

**DO NOT** modify credentials in one place without updating the other!

## Summary of Login Flow

1. User submits login form
2. LoginForm redirects to '/' if passwordResetRequired is false
3. LoginForm redirects to '/change-password' if passwordResetRequired is true
4. Root page (/) shows dashboard
5. User clicks "Moje zgłoszenia" to navigate to '/tickets'

## Summary of Logout Flow

1. User clicks logout button
2. LogoutButton calls /api/auth/logout API
3. API deletes auth-token cookie
4. LogoutButton uses `window.location.href = '/login'` to force full page reload
5. Middleware detects missing auth token and keeps user on login page

## Common Issues (RESOLVED)

### ~~Issue: "Nieprawidłowy email lub hasło" errors in tests~~
**FIXED:** Global setup now automatically seeds the database with correct passwords

### ~~Issue: "should redirect to password change" test fails~~
**FIXED:** Global setup ensures `newuser@tickflow.com` has `force_password_change: true`

### ~~Issue: Validation errors not showing~~
**FIXED:** Changed Zod schema to use `.min(1)` validation, forms use `mode: 'onSubmit'`

### ~~Issue: Logout doesn't redirect to login~~
**FIXED:** Changed logout to use `window.location.href` instead of `router.push()`

### ~~Issue: Tests can't find error messages~~
**FIXED:** Updated test locators to match exact Polish error messages:
- Email validation: "Nieprawidłowy format adresu email"
- Password mismatch: "Hasła muszą być identyczne"
- Removed unnecessary `.first()` from locators for better reliability

### ~~Issue: Normal users can't access /change-password page~~
**FIXED:** Tests now properly login first before navigating to /change-password page

