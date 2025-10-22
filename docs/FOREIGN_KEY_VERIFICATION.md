# Weryfikacja Foreign Key Names w Supabase

## Problem

Nazwy foreign keys w Supabase mogą się różnić od założonych nazw konwencjonalnych. W kodzie używamy nazw foreign keys do wykonywania joined queries, np.:

```typescript
agent:users!agent_categories_agent_id_fkey(id, name, email)
```

Jeśli nazwa foreign key jest niepoprawna, query zakończy się błędem.

## Lokalizacje Użycia Foreign Keys w Kodzie

### 1. `agent_categories_agent_id_fkey`
**Używane w:**
- `app/lib/services/categories/category-admin.service.ts` (linia 33)
- `app/admin/categories/page.tsx` (linia 26)

**Query:**
```typescript
agent:users!agent_categories_agent_id_fkey(id, name, email)
```

### 2. `audit_logs_user_id_fkey`
**Używane w:**
- `app/admin/logs/page.tsx` (linia 26)

**Query:**
```typescript
user:users!audit_logs_user_id_fkey(name)
```

### 3. `tickets_created_by_id_fkey` & `tickets_assigned_to_id_fkey`
**Używane w:**
- `app/lib/services/users/user-admin.service.ts` (linia 34-35)
- `app/admin/users/page.tsx` (linia 20)

**Query:**
```typescript
ticketsCreated:tickets!tickets_created_by_id_fkey(count)
ticketsAssigned:tickets!tickets_assigned_to_id_fkey(count)
```

## Metody Weryfikacji

### Metoda 1: Użycie Verification Script (Zalecane)

Uruchom dedykowany script weryfikacyjny:

```bash
# Upewnij się, że masz zmienne środowiskowe w .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
npm run verify:foreign-keys
```

Script automatycznie sprawdzi wszystkie foreign keys używane w aplikacji.

### Metoda 2: Zapytanie SQL w Supabase Studio

W Supabase Studio, w zakładce SQL Editor, wykonaj:

```sql
-- Sprawdź foreign keys dla agent_categories
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agent_categories';

-- Sprawdź foreign keys dla audit_logs
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'audit_logs';

-- Sprawdź foreign keys dla tickets
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tickets';
```

### Metoda 3: Test przez API

Wykonaj test query przez Supabase API:

```typescript
// Test w konsoli przeglądarki lub Node REPL
const { data, error } = await supabase
  .from("agent_categories")
  .select("agent:users!agent_categories_agent_id_fkey(id)")
  .limit(1);

if (error) {
  console.error("Foreign key name jest niepoprawny:", error.message);
} else {
  console.log("Foreign key name jest poprawny");
}
```

## Co Zrobić Jeśli Nazwa Jest Niepoprawna?

1. **Zapisz poprawną nazwę** z wyniku query SQL
2. **Zaktualizuj kod** we wszystkich plikach wymienionych powyżej
3. **Uruchom ponownie weryfikację** aby upewnić się, że wszystko działa

### Przykład Korekty

Jeśli rzeczywista nazwa to `agent_categories_user_id_fkey` zamiast `agent_categories_agent_id_fkey`:

```typescript
// ❌ Przed
agent:users!agent_categories_agent_id_fkey(id, name, email)

// ✅ Po
agent:users!agent_categories_user_id_fkey(id, name, email)
```

## Status Weryfikacji

- [ ] **agent_categories_agent_id_fkey** - NIE ZWERYFIKOWANO
- [ ] **audit_logs_user_id_fkey** - NIE ZWERYFIKOWANO
- [ ] **tickets_created_by_id_fkey** - NIE ZWERYFIKOWANO
- [ ] **tickets_assigned_to_id_fkey** - NIE ZWERYFIKOWANO

**Akcja wymagana:** Uruchomić weryfikację przed wdrożeniem na produkcję!

## Dodatkowe Informacje

### Dlaczego To Jest Ważne?

- Niepoprawne nazwy foreign keys spowodują błędy 400 od Supabase API
- Błędy będą widoczne dopiero w runtime, nie w compile time
- Może to całkowicie zablokować działanie admin panelu

### Konwencja Nazewnictwa Supabase

Supabase zazwyczaj tworzy foreign keys w formacie:
```
{table_name}_{column_name}_fkey
```

Ale mogą występować wariacje, szczególnie jeśli:
- Foreign key został utworzony ręcznie z inną nazwą
- Migracje zostały wykonane w innej kolejności
- Database został zaimportowany z innego systemu

---

**Data utworzenia:** 2025-01-22  
**Status:** DOKUMENTACJA UTWORZONA - WYMAGA WERYFIKACJI W PRODUKCJI

