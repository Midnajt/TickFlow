# E2E Tests Update - Authentication Flow Fixes

This document details the changes made to fix failing E2E authentication tests.

## Tests Fixed

### 1. Invalid Email Format Validation Test
**File:** `tests/e2e/auth.spec.ts:66-73`

**Issue:** Test was looking for regex pattern `/nieprawidłowy.*email|prawidłowy adres email/i` but the actual validator returns "Nieprawidłowy format adresu email"

**Fix:** Updated locator to match exact error message:
```typescript
await expect(page.locator('text=/nieprawidłowy format adresu email/i').first()).toBeVisible({ timeout: 5000 })
```

---

### 2. Invalid Credentials Error Test
**File:** `tests/e2e/auth.spec.ts:75-85`

**Issue:** Error message wasn't visible because `.first()` might have been selecting the wrong element

**Fix:** Removed `.first()` from locator:
```typescript
await expect(page.locator('text=/nieprawidłowy email lub hasło/i')).toBeVisible({
  timeout: 10000,
})
```

---

### 3. Password Reset Flow Tests
**File:** `tests/e2e/auth.spec.ts:100-131`

**Issues:** 
- Using `loginUser` helper was abstracting away the actual login flow
- Tests needed to see the actual form interaction and redirect

**Fixes:**
1. **Test: "should redirect to password change on first login"**
   - Changed from using `loginUser` helper to explicit form filling
   - Updated warning message locator to match actual text: "Wymagana zmiana hasła"

2. **Test: "should complete password change flow successfully"**
   - Changed from using `loginUser` helper to explicit form filling
   - Updated success message locator to match actual text: "Sukces!"

---

### 4. Password Validation Tests (Mismatched & Weak Password)
**File:** `tests/e2e/auth.spec.ts:133-176`

**Issue:** Tests were trying to access `/change-password` page directly but normal users need to be authenticated first

**Fixes:**
1. **Test: "should show validation error for mismatched passwords"**
   - Added explicit login flow before navigating to change-password
   - Wait for redirect to dashboard (/)
   - Then navigate to /change-password
   - Removed `.first()` from error message locator

2. **Test: "should show validation error for weak password"**
   - Added explicit login flow before navigating to change-password
   - Wait for redirect to dashboard (/)
   - Then navigate to /change-password
   - Removed `.first()` from error message locator

---

### 5. Non-existent User Error Test
**File:** `tests/e2e/auth.spec.ts:87-96`

**Fix:** Removed `.first()` from locator for consistency:
```typescript
await expect(page.locator('text=/nieprawidłowy email lub hasło/i')).toBeVisible({
  timeout: 10000,
})
```

---

## Key Changes Summary

### Locator Strategy Changes
- **Before:** Using `.first()` on many locators
- **After:** Removed `.first()` for better reliability when only one matching element exists

### Error Message Matching
- **Before:** Using flexible regex patterns that might not match exactly
- **After:** Using exact Polish error messages from validators

### Login Flow in Tests
- **Before:** Using helper function that abstracts form interaction
- **After:** Explicit form filling for tests that need to verify redirect behavior

### Form Access Pattern
- **Before:** Assuming users can access protected pages directly
- **After:** Proper authentication flow before accessing protected pages like /change-password

---

## Validator Error Messages Reference

From `app/lib/validators/auth.ts`:

```typescript
// Login validation
email: "Nieprawidłowy format adresu email"
email: "Email jest wymagany"
password: "Hasło jest wymagane"

// Password change validation
newPassword: "Hasło musi mieć minimum 8 znaków"
confirmPassword: "Hasła muszą być identyczne"
```

From `app/api/auth/login/route.ts`:
```typescript
// Authentication errors
"Nieprawidłowy email lub hasło"
```

From `app/components/ChangePasswordForm.tsx`:
```typescript
// Success message
"✓ Sukces!"
"Hasło zostało pomyślnie zmienione"

// Warning banner
"Wymagana zmiana hasła"
```

---

## Files Modified

1. `tests/e2e/auth.spec.ts` - Fixed all failing authentication tests
2. `docs/E2E_SETUP_GUIDE.md` - Updated with new common issues and fixes
3. `docs/E2E_TESTS_UPDATE.md` - Updated with correct line numbers and test descriptions
