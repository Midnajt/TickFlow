## TickFlow - Product Requirements Document (PRD)
📋 Informacje o dokumencie

Projekt: TickFlow - System zgłaszania ticketów IT
Właściciel: Marcin
Data utworzenia: 6 października 2025
Wersja: MVP 1.0

📖 Szczegóły techniczne (framework, baza danych, setup) znajdują się w pliku .ai/tech-stack.md

### 🎯 1. Cel projektu
#### 1.1 Problem biznesowy

Pracownicy spoza działu IT w firmie nie mają prostego i przejrzystego sposobu zgłaszania problemów technicznych.
Obecne rozwiązania (np. email, Teams) nie pozwalają na:

śledzenie statusu zgłoszenia,

priorytetyzację problemów,

unikanie duplikacji pracy między agentami IT.

#### 1.2 Cel rozwiązania

Stworzyć intuicyjną aplikację webową, która:

umożliwia pracownikom łatwe zgłaszanie problemów IT i śledzenie ich statusu w czasie rzeczywistym,

pozwala agentom IT efektywnie zarządzać zgłoszeniami, widząc w czasie rzeczywistym, kto nad czym pracuje.

#### 1.3 Sukces projektu

Projekt będzie uznany za udany, gdy:

Dział IT faktycznie korzysta z aplikacji,

liczba zdublowanych zgłoszeń spadnie do zera,

użytkownicy mają jasny podgląd statusu swoich zgłoszeń.

### 👥 2. Role użytkowników
#### 2.1 Użytkownik (USER)

Kim jest: pracownik firmy spoza działu IT.
Potrzeby:

szybkie zgłoszenie problemu,

wybór odpowiedniej kategorii (np. sprzęt, sieć, oprogramowanie),

śledzenie statusu swojego zgłoszenia,

informacja o tym, kto zajmuje się sprawą.

Uprawnienia:

może tworzyć zgłoszenia (ticket),

może przeglądać tylko swoje zgłoszenia,

widzi status zgłoszenia w czasie rzeczywistym,

nie ma dostępu do zgłoszeń innych osób.

#### 2.2 Agent IT (AGENT)

Kim jest: członek działu IT, który obsługuje zgłoszenia w swojej specjalizacji.
Potrzeby:

widzieć listę wszystkich otwartych zgłoszeń w swoich kategoriach,

przypisać zgłoszenie do siebie,

aktualizować status (rozpoczęte / w trakcie / zakończone),

mieć podgląd w czasie rzeczywistym, kto nad czym pracuje.

Uprawnienia:

widzi tylko zgłoszenia z przypisanych kategorii,

może przypisać zgłoszenie do siebie,

może zmieniać status zgłoszenia,

może samodzielnie zgłaszać problemy.

Przykład:

Agent Jan Kowalski obsługuje kategorie: Sprzęt i Sieć

Agent Anna Nowak obsługuje: Oprogramowanie i Dostępy
Każde z nich widzi wyłącznie zgłoszenia ze swoich obszarów.

#### 2.3 Administrator (ADMIN)

Kim jest: administrator systemu TickFlow z pełnymi uprawnieniami zarządzania.
Potrzeby:

pełny przegląd wszystkich zgłoszeń w systemie,

zdolność do przypisywania i zarządzania wszystkimi ticketami,

możliwość przejmowania dowolnego zgłoszenia,

podgląd całego systemu bez ograniczeń kategorii.

Uprawnienia:

może tworzyć zgłoszenia,

może przeglądać wszystkie zgłoszenia (zarówno własne, jak i innych użytkowników),

widzi wszystkie kategorie i podkategorie,

może przypisać każde zgłoszenie do siebie lub innego agenta,

może zmieniać status każdego zgłoszenia (bez ograniczeń),

może samodzielnie zgłaszać problemy,

dostęp do wszystkich ticketów niezależnie od kategorii.

Zaimplementowane w MVP (Admin Panel v1):

- Zarządzanie użytkownikami: tworzenie, edycja (nazwa, rola, wymuszenie zmiany hasła), wymuszenie resetu hasła.
- Zarządzanie kategoriami: edycja opisu kategorii i aktualizacja podkategorii (nazwa/opis).
- Audit log: przegląd logów z filtrami (użytkownik, akcja, data) i paginacją; logowanie login/logout oraz akcji administracyjnych.
- UI: ciemny motyw, wspólny nagłówek, aktywne zakładki, loading states i error boundary.

#### 2.4 Porównanie uprawnień

| Uprawnienie | USER | AGENT | ADMIN |
|---|---|---|---|
| **Podstawowe** | | | |
| Logowanie | ✅ | ✅ | ✅ |
| Tworzenie ticketu | ✅ | ✅ | ✅ |
| Podgląd własnych ticketów | ✅ | ✅ | ✅ |
| **Tickety** | | | |
| Podgląd ticketów z kategorii | ❌ | ✅ | ✅ (wszystkie) |
| Podgląd wszystkich ticketów | ❌ | ❌ | ✅ |
| Przypisywanie ticketu | ❌ | ✅ (z kategorii) | ✅ (wszystkie) |
| Zmiana statusu ticketu | ❌ | ✅ (przypisane) | ✅ (wszystkie) |
| **Kategorie** | | | |
| Podgląd przypisanych kategorii | ❌ | ✅ | ✅ (wszystkie) |
| **Przyszłe funkcjonalności** | | | |
| Zarządzanie kategoriami | ❌ | ❌ | ✅ (edycja) |
| Zarządzanie agentami | ❌ | ❌ | ⏳ |
| Raportowanie i analityka | ❌ | ❌ | ⏳ |
| Zarządzanie użytkownikami | ❌ | ❌ | ✅ |
| Audit log | ❌ | ❌ | ✅ |

---

### 🎨 3. Kluczowe funkcjonalności aplikacji
#### 3.1 Zgłaszanie problemu

Prosty formularz do zgłoszenia problemu IT:
Użytkownik wybiera kategorię i podkategorię, wpisuje tytuł oraz krótki opis.

Ograniczenie długości opisu, by zgłoszenia były konkretne i zwięzłe.

Po wysłaniu zgłoszenia użytkownik widzi je na liście swoich ticketów.

Dodatkowo, formularz jest wyposażony w funkcję **Sugestia AI** (opartą o OpenRouter), która po wpisaniu opisu problemu automatycznie proponuje kategorię, podkategorię i tytuł, co znacznie przyspiesza proces.

#### 3.2 Śledzenie statusu

Użytkownik może w każdej chwili sprawdzić status swojego zgłoszenia.

Gdy agent przejmie lub zamknie ticket, status aktualizuje się automatycznie w czasie rzeczywistym.

#### 3.3 Widok agenta IT

Agent ma dostęp do listy otwartych zgłoszeń tylko z przypisanych kategorii (np. sieć, sprzęt).

Może przypisać zgłoszenie do siebie, co automatycznie ukrywa je przed innymi agentami z tej kategorii (uniknięcie duplikacji pracy).

Widzi swoje przypisane tickety i może zmieniać ich status:
Nowe → W trakcie → Zakończone.

#### 3.4 Aktualizacje w czasie rzeczywistym

Aplikacja reaguje natychmiast na zmiany statusu:
Jeśli agent przypisze zgłoszenie, inni agenci widzą, że zostało przejęte.

Użytkownik natychmiast widzi, że ktoś rozpoczął pracę nad jego problemem lub że został on rozwiązany.

#### 3.5 Kategorie problemów

W aplikacji dostępne będą stałe kategorie i podkategorie (bez możliwości edycji w MVP):

Sprzęt (Hardware) — np. komputer, drukarka, monitor

Oprogramowanie (Software) — np. instalacja, błędy w aplikacjach

Sieć (Network) — np. brak internetu, VPN, dostęp do serwerów

Konta i Dostępy (Account & Access) — np. reset hasła, uprawnienia

Inne (Other) — wszystko spoza powyższych

Każdy agent ma przypisane kategorie, w których może działać.

#### 3.6 Panel administratora (MVP v1 – wdrożone)

- Strony: `Kategorie`, `Użytkownicy`, `Logi` (audit logs) z nawigacją i aktywnymi zakładkami.
- Użytkownicy: lista z filtrami, tworzenie i edycja w modalach, wymuszenie resetu hasła.
- Kategorie: edycja opisu kategorii i aktualizacja podkategorii (nazwa/opis).
- Audit Logs: przegląd, filtrowanie (użytkownik/akcja/daty), paginacja, szczegóły JSON.
- Bezpieczeństwo: dostęp tylko dla roli `ADMIN` (middleware + RLS na `audit_logs`).
- UX: ciemny motyw, wspólny `DashboardHeader`, loading states i error boundary.

### 🚀 4. Scenariusze użycia
#### 4.1 Pierwsze logowanie

Użytkownik loguje się przy pomocy otrzymanych danych.

System wymusza zmianę hasła przy pierwszym logowaniu.

Po zmianie hasła użytkownik trafia do panelu głównego.

#### 4.2 Zgłoszenie problemu przez użytkownika

Użytkownik wybiera opcję „Nowe zgłoszenie”.

Wybiera kategorię i podkategorię, wpisuje tytuł i opis problemu.

Po wysłaniu zgłoszenie pojawia się na jego liście z oznaczeniem „Oczekuje”.

#### 4.3 Przejęcie zgłoszenia przez agenta

Agent loguje się i widzi zgłoszenia z przypisanych kategorii.

Klikając „Weź ticket”, przypisuje zgłoszenie do siebie.

Zgłoszenie znika z listy innych agentów z tej kategorii.

Po zakończeniu pracy agent zamyka zgłoszenie.

Użytkownik natychmiast widzi zmianę statusu na „Rozwiązano”.

#### 4.4 Współpraca między agentami

Jeśli kilku agentów ma dostęp do tej samej kategorii (np. „Sprzęt”), system automatycznie ukrywa zgłoszenia, które ktoś już przejął — w czasie rzeczywistym.
Zapobiega to sytuacji, w której dwie osoby pracują nad tym samym problemem.

#### 4.5 Zgłoszenie przez agenta

Agenci również mogą tworzyć zgłoszenia – np. jeśli mają problem techniczny spoza swojej specjalizacji (np. problem z oprogramowaniem).
Wtedy zgłoszenie trafia do odpowiednich agentów z danej kategorii.

#### 4.6 Zarządzanie przez administratora (MVP v1)

- Tworzenie/edycja użytkowników, wymuszenie resetu hasła.
- Edycja opisów kategorii i podkategorii.
- Przegląd i filtrowanie audit logów (login/logout i akcje admina).

### 🎯 5. Kluczowe założenia projektu

Prosty i intuicyjny interfejs – ma być zrozumiały bez szkolenia.

Jasny podział ról i dostępów: każdy widzi tylko to, co powinien.

Aktualizacje w czasie rzeczywistym dla przejrzystości i efektywności.

Minimalny czas potrzebny na zgłoszenie problemu (maks. kilka kliknięć).

Brak nadmiarowych opcji – tylko niezbędne funkcje MVP.

### 📊 6. Kryteria sukcesu

Z punktu widzenia użytkownika:

mogę łatwo zgłosić problem,

wiem, że ktoś się nim zajmuje,

mogę sprawdzić postęp bez kontaktu z IT.

Z punktu widzenia działu IT:

nie ma duplikacji zgłoszeń,

każda osoba widzi tylko swoje zgłoszenia,

real-time działa płynnie (zmiany widoczne natychmiast).

Z punktu widzenia administratora (MVP v1):

- Mogę utworzyć i edytować użytkownika (rola, wymuszenie zmiany hasła).
- Mogę przeglądać i filtrować audit logi (login/logout i akcje admina).
- Mogę edytować opisy kategorii i podkategorii.


### 📚 7. Zasoby i wsparcie

Konta potrzebne do projektu:

Supabase (baza danych i real-time)

Vercel (hosting)

GitHub (wersjonowanie)

Dostęp do narzędzi AI wspierających development

Dokumentacja techniczna:
Znajduje się w pliku .ai/tech-stack.md.

### ✅ 8. Definicja „Gotowe"

Aplikacja będzie uznana za gotową (MVP), jeśli:

użytkownicy mogą się zalogować i zgłaszać problemy,

system wymusza zmianę hasła przy pierwszym logowaniu,

użytkownicy widzą status swoich zgłoszeń w czasie rzeczywistym,

agenci mogą przejmować i zamykać zgłoszenia,

każdy użytkownik widzi tylko swoje dane (zgodnie z przypisaną rolą),

administrator widzi wszystkie tickety bez ograniczeń kategorii,

administrator może przypisać każde zgłoszenie do siebie lub innego agenta,

real-time działa płynnie i niezawodnie,

Admin Panel v1 działa: tworzenie/edycja użytkowników, wymuszenie resetu hasła, edycja opisów kategorii/podkategorii, przegląd audit logów z filtrami i paginacją.

### 🎉 9. Podsumowanie

TickFlow to wewnętrzny system do obsługi zgłoszeń IT, którego głównym celem jest:

uproszczenie komunikacji między pracownikami a działem IT,

pełna przejrzystość statusów,

eliminacja chaosu mailowego,

automatyczne unikanie duplikacji pracy.

Projekt ma być prosty, czytelny i gotowy do faktycznego użycia w codziennej pracy.