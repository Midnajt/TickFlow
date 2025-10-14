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

dział IT faktycznie korzysta z aplikacji,

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

### 🎨 3. Kluczowe funkcjonalności aplikacji
#### 3.1 Zgłaszanie problemu

Prosty formularz do zgłoszenia problemu IT:
użytkownik wybiera kategorię i podkategorię, wpisuje tytuł oraz krótki opis.

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
jeśli agent przypisze zgłoszenie, inni agenci widzą, że zostało przejęte.

Użytkownik natychmiast widzi, że ktoś rozpoczął pracę nad jego problemem lub że został on rozwiązany.

#### 3.5 Kategorie problemów

W aplikacji dostępne będą stałe kategorie i podkategorie (bez możliwości edycji w MVP):

Sprzęt (Hardware) — np. komputer, drukarka, monitor

Oprogramowanie (Software) — np. instalacja, błędy w aplikacjach

Sieć (Network) — np. brak internetu, VPN, dostęp do serwerów

Konta i Dostępy (Account & Access) — np. reset hasła, uprawnienia

Inne (Other) — wszystko spoza powyższych

Każdy agent ma przypisane kategorie, w których może działać.

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


### 📚 7. Zasoby i wsparcie

Konta potrzebne do projektu:

Supabase (baza danych i real-time)

Vercel (hosting)

GitHub (wersjonowanie)

Dostęp do narzędzi AI wspierających development

Dokumentacja techniczna:
Znajduje się w pliku .ai/tech-stack.md.

### ✅ 8. Definicja „Gotowe”

Aplikacja będzie uznana za gotową (MVP), jeśli:

użytkownicy mogą się zalogować i zgłaszać problemy,

system wymusza zmianę hasła przy pierwszym logowaniu,

użytkownicy widzą status swoich zgłoszeń w czasie rzeczywistym,

agenci mogą przejmować i zamykać zgłoszenia,

każdy użytkownik widzi tylko swoje dane,

real-time działa płynnie i niezawodnie.

### 🎉 9. Podsumowanie

TickFlow to wewnętrzny system do obsługi zgłoszeń IT, którego głównym celem jest:

uproszczenie komunikacji między pracownikami a działem IT,

pełna przejrzystość statusów,

eliminacja chaosu mailowego,

automatyczne unikanie duplikacji pracy.

Projekt ma być prosty, czytelny i gotowy do faktycznego użycia w codziennej pracy.