# Plan: Kategoria Navireo, podkategoria Inne, przypisania do agentów (plan tylko)

## Cel
- Utworzyć kategorię `Navireo` z podkategorią `Inne`.
- Przypisać kategorię `Navireo` do dwóch agentów (`agent@tickflow.com`, `agent2@tickflow.com`), aby obaj widzieli tickety z tej kategorii w swoich interfejsach.
- Nie wykonywać planu w tym kroku (tylko zapis planu).

## Założenia
- Supabase skonfigurowany i dostępny (użyjemy service role w seedzie).
- W `.env.local` istnieją zmienne: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Konta: `agent@tickflow.com`, `agent2@tickflow.com` mają rolę `AGENT`.

## Dane (tabele)
- `categories(id, name, description, created_at)`
- `subcategories(id, name, category_id)`
- `agent_categories(id, agent_id, category_id, created_at)`

## Plan działań (bez wykonania)
1) Dodać skrypt seedujący `scripts/seed-navireo.ts` (analogiczny do `scripts/seed-categories.ts`):
   - Inicjalizacja klienta Supabase service role.
   - Upsert kategorii `Navireo` (sprawdzenie po `name`).
   - Upsert podkategorii `Inne` dla `Navireo` (sprawdzenie po `name` oraz `category_id`).
   - Pobranie agentów (po emailach: `agent@tickflow.com`, `agent2@tickflow.com`).
   - Upsert przypisań w `agent_categories` dla każdego agenta (jeśli brak, `insert`).
2) Uzułnić `package.json` o skrypt: `seed:navireo: tsx scripts/seed-navireo.ts`.
3) (Po akceptacji) Uruchomienie lokalne przez `npm run seed:navireo`.

## Kryteria akceptacji
- Kategoria `Navireo` istnieje z podkategorią `Inne`.
- Obaj agenci mają wpis w `agent_categories` do kategorii `Navireo`.
- Na liście zgłoszeń agentów pojawiają się tickety z `Navireo > Inne` (real-time aktywne).
- Po przypisaniu ticketu przez jednego agenta, zniknie on z widoku „Otwarte” u drugiego (status ≠ `OPEN`).

## Scenariusz testowy (manualny)
1) Zaloguj `agent@tickflow.com` i `agent2@tickflow.com` w dwóch oknach.
2) Jako `user@tickflow.com` utwórz ticket: kategoria `Navireo`, podkategoria `Inne`.
3) Zweryfikuj, że ticket jest widoczny u obu agentów.
4) U jednego agenta wykonaj „Przypisz” → ticket zmienia status na `IN_PROGRESS` i znika z widoku „Otwarte” u obu.
5) W widoku „Wszystkie” jest widoczny z przypisaniem do agenta, który go przejął.

## Rollback (opcjonalny)
- Usuń przypisania: `delete from agent_categories where category_id = <navireoId>`.
- Usuń podkategorię: `delete from subcategories where category_id = <navireoId>`.
- Usuń kategorię: `delete from categories where id = <navireoId>`.

## Uwagi
- Nie wprowadzamy zmian w API/UI; korzystamy z istniejących serwisów i realtime.
- Service role key wyłącznie w seeding scripts, nie w kliencie przeglądarkowym.
