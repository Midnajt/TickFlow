<conversation_summary>
<decisions>
1.  Zaakceptowano implementację triggera w PostgreSQL w celu weryfikacji, czy do `AgentCategory` przypisywani są wyłącznie użytkownicy z rolą `AGENT`.
2.  Zdecydowano, że w przypadku usunięcia użytkownika (`User`), powiązane z nim tickety nie zostaną usunięte. Zamiast tego, referencje w polach `createdById` i `assignedToId` zostaną ustawione na `NULL`.
3.  Zaakceptowano propozycję dodania złożonego indeksu na kolumnach `status` i `assignedToId` w tabeli `Ticket` w celu optymalizacji wydajności zapytań.
4.  Potwierdzono implementację polityk bezpieczeństwa na poziomie wiersza (RLS) w celu ścisłego kontrolowania dostępu do danych dla ról `USER` i `AGENT`.
5.  Podjęto decyzję o pozostaniu przy typach `enum` dla `Role` i `TicketStatus` w ramach MVP, odkładając przejście na osobne tabele na przyszłość.
6.  Odrzucono implementację wyszukiwania pełnotekstowego w MVP.
7.  Odrzucono dodawanie dodatkowych ograniczeń (`CHECK`) na poziomie bazy danych w MVP, polegając na walidacji w warstwie aplikacji.
8.  Potwierdzono, że `USER` nie będzie miał możliwości edycji utworzonych przez siebie ticketów.
9.  Zaakceptowano zmianę zachowania `onDelete` z `Cascade` na `Restrict` dla relacji `Category` -> `Subcategory`, aby zapobiec przypadkowemu usunięciu danych.
10. Potwierdzono, że hasła użytkowników w skrypcie seedującym będą hashowane przy użyciu `bcrypt`.
</decisions>

<matched_recommendations>
1.  **Wymuszenie integralności ról**: Rekomendacja użycia triggera PostgreSQL do zapewnienia, że tylko użytkownicy z rolą `AGENT` mogą być dodawani do tabeli `AgentCategory`, została dopasowana i zaakceptowana.
2.  **Ochrona danych historycznych**: Rekomendacja zmiany `onDelete: Cascade` na `onDelete: SetNull` dla relacji `User` -> `Ticket` została zaakceptowana w celu zachowania historii ticketów.
3.  **Optymalizacja wydajności zapytań**: Rekomendacja stworzenia złożonego indeksu `@@index([status, assignedToId])` w modelu `Ticket` została zaakceptowana w celu przyspieszenia kluczowych zapytań agentów.
4.  **Bezpieczeństwo dostępu do danych**: Rekomendacja implementacji szczegółowych polityk RLS dla ról `USER` i `AGENT` została w pełni zaakceptowana.
5.  **Zapobieganie utracie danych**: Rekomendacja zmiany `onDelete: Cascade` na `onDelete: Restrict` w relacji `Category` -> `Subcategory` została zaakceptowana jako środek bezpieczeństwa.
6.  **Bezpieczeństwo haseł**: Rekomendacja hashowania haseł w skrypcie seedującym za pomocą `bcrypt` została zaakceptowana jako standardowa praktyka bezpieczeństwa.
</matched_recommendations>

<database_planning_summary>
### Podsumowanie planowania bazy danych

Na podstawie dokumentu wymagań produktu (PRD) i specyfikacji technologicznej, przeprowadzono analizę, która doprowadziła do sfinalizowania projektu schematu bazy danych dla MVP aplikacji TickFlow.

#### a. Główne wymagania dotyczące schematu bazy danych
Schemat musi obsługiwać dwie role użytkowników (`USER`, `AGENT`) z różnymi uprawnieniami. Musi umożliwiać tworzenie ticketów w systemie hierarchicznych kategorii i podkategorii. Kluczowym wymaganiem jest zapewnienie, że agenci widzą tylko tickety z przypisanych im kategorii. Baza danych musi również wspierać logikę wymuszenia zmiany hasła przy pierwszym logowaniu.

#### b. Kluczowe encje i ich relacje
Zidentyfikowano pięć głównych modeli: `User`, `Category`, `Subcategory`, `Ticket` oraz tabelę łączącą `AgentCategory`.
-   **`User`**: Przechowuje dane użytkowników, w tym rolę (`USER` lub `AGENT`).
-   **`Category`**: Definiuje główne kategorie zgłoszeń.
-   **`Subcategory`**: Definiuje podkategorie, z relacją `many-to-one` do `Category`. Usunięcie kategorii z przypisanymi podkategoriami jest zablokowane (`onDelete: Restrict`).
-   **`Ticket`**: Główny model aplikacji, przechowujący szczegóły zgłoszeń. Ma relacje do `Subcategory`, `User` (twórca) i `User` (przypisany agent). Usunięcie użytkownika nie usuwa ticketu (`onDelete: SetNull`).
-   **`AgentCategory`**: Tabela `many-to-many` łącząca agentów (`User` z rolą `AGENT`) z kategoriami (`Category`), do których mają dostęp.

#### c. Ważne kwestie dotyczące bezpieczeństwa i skalowalności
-   **Bezpieczeństwo**: Głównym mechanizmem bezpieczeństwa będzie **Row-Level Security (RLS)** w PostgreSQL. Zostaną zdefiniowane ścisłe polityki, które zapewnią, że użytkownicy widzą tylko swoje tickety, a agenci tylko tickety z dozwolonych kategorii. Integralność przypisań agentów do kategorii będzie dodatkowo chroniona przez trigger bazodanowy. Hasła będą bezpiecznie hashowane za pomocą `bcrypt`.
-   **Skalowalność i wydajność**: Dla MVP wybrano prostsze rozwiązania, takie jak `enum` dla ról i statusów. W celu zapewnienia wydajności kluczowych zapytań, dodano złożony indeks na statusie i przypisaniu ticketu. Kwestie takie jak wyszukiwanie pełnotekstowe zostały odłożone na przyszłość.

</database_planning_summary>

<unresolved_issues>
Wszystkie kwestie poruszone na etapie planowania zostały rozwiązane, a plan bazy danych został zaakceptowany. Brak nierozwiązanych problemów przed przejściem do etapu implementacji.
</unresolved_issues>
</conversation_summary>