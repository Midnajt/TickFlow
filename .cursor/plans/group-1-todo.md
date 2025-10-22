# Grupa 1 - TODO List

## 📊 Status Wykonania
- **BATCH 0:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 1:** ✅ ZAKOŃCZONY (6/6 zadań)
- **BATCH 2:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 3:** ✅ ZAKOŃCZONY (4/4 zadania)
- **BATCH 4:** ✅ ZAKOŃCZONY (5/5 zadań)
- **BATCH 5:** ✅ ZAKOŃCZONY (1/1 zadanie)
- **BATCH 6:** ✅ ZAKOŃCZONY (1/1 zadanie)
- **BATCH 7:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 8:** ✅ ZAKOŃCZONY (4/4 zadania)
- **BATCH 9:** ⏳ OCZEKUJE (0/4 zadania)
- **BATCH 10:** ⏳ OCZEKUJE (0/2 zadania)

**Łącznie:** 30/35 zadań wykonanych (85.7%)

---

## BATCH 0: Migracje SQL

- [x] 0.1: Weryfikacja pola description w subcategories (DONE - exists in database.types.ts)
- [x] 0.2: Utworzenie migracji `supabase/migrations/20251022_create_audit_logs.sql`
- [x] 0.3: Aktualizacja `app/lib/database.types.ts` (dodanie audit_logs i audit_action enum)

## BATCH 1: Typy TypeScript & Walidatory (6 zadań)

- [x] 1.1: Dodanie typów DTO dla Kategorii i Podkategorii w `src/types.ts`
- [x] 1.2: Dodanie typów DTO dla Użytkowników w `src/types.ts`
- [x] 1.3: Dodanie typów DTO dla Audit Logs w `src/types.ts`
- [x] 1.4: Utworzenie walidatorów Zod dla Kategorii w `app/lib/validators/categories.ts`
- [x] 1.5: Utworzenie walidatorów Zod dla Użytkowników w `app/lib/validators/users.ts`
- [x] 1.6: Utworzenie walidatorów Zod dla Audit Logs w `app/lib/validators/audit-logs.ts`

## BATCH 2: Services - Audit Log (3 zadania)

- [x] 2.1: Utworzenie `app/lib/services/audit-log/audit-log.service.ts`
- [x] 2.2: Integracja z Login Endpoint (`app/api/auth/login/route.ts`)
- [x] 2.3: Integracja z Logout Endpoint (`app/api/auth/logout/route.ts`)

## BATCH 3: Services - Category Management (4 zadania)

- [x] 3.1: Utworzenie `app/lib/services/categories/category-admin.service.ts`
- [x] 3.2: Utworzenie `app/api/admin/categories/route.ts` (GET)
- [x] 3.3: Utworzenie `app/api/admin/categories/[categoryId]/route.ts` (PATCH)
- [x] 3.4: Utworzenie `app/api/admin/subcategories/[subcategoryId]/route.ts` (PATCH)

## BATCH 4: Services - User Management (5 zadań)

- [x] 4.1: Utworzenie `app/lib/services/users/user-admin.service.ts`
- [x] 4.2: Utworzenie `app/api/admin/users/route.ts` (GET + POST)
- [x] 4.3: Utworzenie `app/api/admin/users/[userId]/route.ts` (PATCH)
- [x] 4.4: Utworzenie `app/api/admin/users/[userId]/force-password-reset/route.ts` (POST)
- [x] 4.5: Dodanie zabezpieczenia przed self-modification w user endpoints

## BATCH 5: API Endpoint - Audit Logs (1 zadanie)

- [x] 5.1: Utworzenie `app/api/admin/audit-logs/route.ts` (GET)

## BATCH 6: API Client (1 zadanie)

- [x] 6.1: Aktualizacja `app/lib/api-client.ts` (dodanie adminApi)

## BATCH 7: Frontend - Admin Layout & Navigation (3 zadania)

- [x] 7.1: Utworzenie `app/admin/layout.tsx`
- [x] 7.2: Aktualizacja `app/components/DashboardHeader.tsx` (link do admin panelu)
- [x] 7.3: Utworzenie `app/admin/page.tsx` (redirect)

## BATCH 8: Frontend - Categories Management Page (4 zadania)

- [x] 8.1: Utworzenie `app/admin/categories/page.tsx` (Server Component)
- [x] 8.2: Utworzenie `app/admin/categories/CategoriesAdminClient.tsx`
- [x] 8.3: Dodanie inline edycji dla category description
- [x] 8.4: Dodanie edycji dla subcategories (modal lub inline)

## BATCH 9: Frontend - Users Management Page (4 zadania)

- [ ] 9.1: Utworzenie `app/admin/users/page.tsx` (Server Component)
- [ ] 9.2: Utworzenie `app/admin/users/UsersAdminClient.tsx`
- [ ] 9.3: Utworzenie `app/components/admin/CreateUserModal.tsx`
- [ ] 9.4: Utworzenie `app/components/admin/EditUserModal.tsx`

## BATCH 10: Frontend - Audit Logs Page (2 zadania)

- [ ] 10.1: Utworzenie `app/admin/logs/page.tsx` (Server Component)
- [ ] 10.2: Utworzenie `app/admin/logs/AuditLogsClient.tsx`

## REFACTORING & FIXES

- [ ] FIX: Usunięcie hasła z audit log details w UserAdminService.createUser (CRITICAL)
- [ ] FIX: Weryfikacja i korekta foreign key names w Supabase queries
- [ ] FIX: Testowanie RLS policy dla audit_logs (auth.uid() vs Supabase auth)
- [ ] REFACTOR: Dodanie active state dla navigation tabs w AdminLayout
- [ ] REFACTOR: Optymalizacja query dla user statistics (GROUP BY zamiast nested count)
- [ ] SECURITY: Dodanie rate limiting dla admin endpoints (tworzenie użytkowników max 10/min)
- [ ] SECURITY: Dodanie walidacji zapobiegającej self-modification (admin nie może zmienić własnej roli)
- [ ] UX: Dodanie Error Boundary dla admin layout
- [ ] UX: Dodanie loading states w server components

## TESTING

### Unit Tests
- [ ] Test: AuditLogService.createLog
- [ ] Test: AuditLogService.getLogs (filtering, pagination)
- [ ] Test: CategoryAdminService.getCategoriesWithAgents
- [ ] Test: CategoryAdminService.updateCategoryDescription
- [ ] Test: CategoryAdminService.updateSubcategory
- [ ] Test: UserAdminService.getAllUsers
- [ ] Test: UserAdminService.createUser (including duplicate email check)
- [ ] Test: UserAdminService.updateUser
- [ ] Test: UserAdminService.forcePasswordReset
- [ ] Test: Walidatory Zod (categories, users, audit-logs)

### Integration Tests
- [ ] Test: POST /api/admin/users (create user)
- [ ] Test: GET /api/admin/users (list users)
- [ ] Test: PATCH /api/admin/users/:userId (update user)
- [ ] Test: POST /api/admin/users/:userId/force-password-reset
- [ ] Test: GET /api/admin/categories (with agents)
- [ ] Test: PATCH /api/admin/categories/:categoryId
- [ ] Test: PATCH /api/admin/subcategories/:subcategoryId
- [ ] Test: GET /api/admin/audit-logs (with filters)
- [ ] Test: Auth middleware dla admin endpoints (403 for non-admin)
- [ ] Test: Audit logging w login/logout endpoints

### E2E Tests (Playwright)
- [ ] Test: Admin login → redirect to /admin/categories
- [ ] Test: Admin navigation (categories → users → logs)
- [ ] Test: Create new user workflow (form validation, success)
- [ ] Test: Update category description
- [ ] Test: Update subcategory name and description
- [ ] Test: Force password reset for user
- [ ] Test: Audit logs filtering (by user, by action, by date)
- [ ] Test: Audit logs pagination
- [ ] Test: Non-admin user cannot access /admin/* (redirect to /tickets)
- [ ] Test: Agent user cannot access /admin/* (403)

### Manual Testing Checklist
- [ ] Weryfikacja: Audit logs zapisują IP i User Agent
- [ ] Weryfikacja: RLS policy blokuje non-admin od audit_logs
- [ ] Weryfikacja: Foreign key names w Supabase queries
- [ ] Weryfikacja: Nowy użytkownik ma force_password_change = true
- [ ] Weryfikacja: Email unikalność przy tworzeniu użytkownika
- [ ] Weryfikacja: Admin nie może zmienić własnej roli na USER
- [ ] Weryfikacja: Navigation tabs pokazują active state
- [ ] Weryfikacja: Error boundary catchuje błędy w admin panelu
- [ ] Weryfikacja: Audit logs details nie zawierają haseł

