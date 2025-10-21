# Grupa 2 - Przewodnik Testów Manualnych

**Aplikacja działa na:** http://localhost:3000

## 🔐 Konta Testowe

| Rola | Email | Hasło |
|------|-------|-------|
| **ADMIN** | admin@tickflow.com | Admin123!@# |
| **AGENT 1** | agent@tickflow.com | Agent123!@# |
| **AGENT 2** | agent2@tickflow.com | Agent2123!@# |
| **USER 1** | user@tickflow.com | User123!@# |
| **USER 2** | user2@tickflow.com | User2123!@# |

---

## ✅ Test 1: USER może przywrócić swój zamknięty ticket

### Kroki:
1. Zaloguj się jako **USER 1** (user@tickflow.com)
2. Utwórz nowy ticket (dowolny tytuł i opis)
3. Wyloguj się
4. Zaloguj jako **AGENT 1** (agent@tickflow.com)
5. Znajdź ticket USER 1 i kliknij "Przypisz do mnie"
6. Kliknij "Oznacz jako rozwiązane" → status: RESOLVED
7. Kliknij "Zamknij" → status: CLOSED
8. Wyloguj się
9. Zaloguj ponownie jako **USER 1**
10. Znajdź swój ticket (status CLOSED)
11. Kliknij na ticket → dialog szczegółów
12. **Kliknij "Przywróć zgłoszenie"** (żółty przycisk)

### Oczekiwany rezultat:
✅ Ticket zmienia status z CLOSED na OPEN  
✅ Przypisanie pozostaje bez zmian (nadal AGENT 1)  
✅ Ticket pojawia się na liście OPEN ticketów

---

## ❌ Test 2: USER nie może przywrócić cudzego ticketu

### Kroki:
1. Zaloguj się jako **USER 2** (user2@tickflow.com)
2. Utwórz ticket i zamknij go (powtórz kroki z Testu 1 z AGENT)
3. Wyloguj się
4. Zaloguj jako **USER 1** (user@tickflow.com)
5. Znajdź ticket USER 2 (CLOSED)
6. Kliknij na ticket → dialog szczegółów

### Oczekiwany rezultat:
✅ **Brak przycisku "Przywróć zgłoszenie"** (USER widzi tylko swoje akcje)  
ℹ️ Jeśli spróbujesz wywołać API bezpośrednio → błąd 403 Forbidden

---

## ✅ Test 3: AGENT może przywrócić ticket ze swojej kategorii

### Kroki:
1. Zaloguj się jako **USER 1**
2. Utwórz ticket w kategorii przypisanej do AGENT 1
3. Zamknij ticket (użyj AGENT 1 do przypisania i zamknięcia)
4. Wyloguj się
5. Zaloguj jako **AGENT 1**
6. Znajdź zamknięty ticket (nawet jeśli nie jest do Ciebie przypisany)
7. Kliknij "Przywróć zgłoszenie"

### Oczekiwany rezultat:
✅ AGENT może przywrócić ticket ze swojej kategorii  
✅ Status zmienia się na OPEN

---

## ✅ Test 4: ADMIN może przywrócić dowolny ticket

### Kroki:
1. Zaloguj się jako **ADMIN** (admin@tickflow.com)
2. Znajdź dowolny zamknięty ticket (dowolnego użytkownika)
3. Kliknij na ticket → dialog szczegółów
4. Kliknij "Przywróć zgłoszenie"

### Oczekiwany rezultat:
✅ ADMIN może przywrócić dowolny ticket CLOSED  
✅ Status zmienia się na OPEN  
✅ Brak błędów autoryzacji

---

## ❌ Test 5: Walidacja - nie można przywrócić ticketu o statusie != CLOSED

### Kroki:
1. Zaloguj się jako **USER 1**
2. Utwórz nowy ticket (status: OPEN)
3. Kliknij na ticket → dialog szczegółów

### Oczekiwany rezultat:
✅ **Brak przycisku "Przywróć zgłoszenie"** (widoczny tylko dla CLOSED)

### Dodatkowe kroki (opcjonalne):
4. Przypisz ticket do AGENT
5. Zmień status na IN_PROGRESS
6. Sprawdź dialog → nadal brak przycisku "Przywróć zgłoszenie"
7. Zmień status na RESOLVED
8. Sprawdź dialog → nadal brak przycisku

ℹ️ Przycisk pojawia się **tylko** dla statusu CLOSED

---

## ✅ Test 6: AGENT może przekazać swój ticket

### Kroki:
1. Zaloguj się jako **AGENT 1** (agent@tickflow.com)
2. Znajdź ticket przypisany do Ciebie
3. Kliknij na ticket → dialog szczegółów
4. **Kliknij "Przekaż zgłoszenie"** (fioletowy przycisk)
5. W dialogu wybierz **AGENT 2** z listy
6. Kliknij "Przekaż"

### Oczekiwany rezultat:
✅ Ticket zmienia przypisanie z AGENT 1 na AGENT 2  
✅ Status pozostaje bez zmian (np. IN_PROGRESS → IN_PROGRESS)  
✅ Dialog zamyka się automatycznie  
✅ W szczegółach ticketu widać: "Przypisane do: Agent 2"

### Weryfikacja:
7. Wyloguj się
8. Zaloguj jako **AGENT 2** (agent2@tickflow.com)
9. Znajdź przekazany ticket na swojej liście
10. Sprawdź czy ticket jest przypisany do AGENT 2

---

## ✅ Test 7: ADMIN może przekazać dowolny ticket

### Kroki:
1. Zaloguj się jako **AGENT 1**
2. Przypisz ticket do siebie
3. Wyloguj się
4. Zaloguj jako **ADMIN** (admin@tickflow.com)
5. Znajdź ticket przypisany do AGENT 1
6. Kliknij "Przekaż zgłoszenie"
7. Wybierz **AGENT 2** z listy
8. Kliknij "Przekaż"

### Oczekiwany rezultat:
✅ ADMIN może przekazać ticket należący do innego agenta  
✅ Ticket zmienia przypisanie na AGENT 2  
✅ Brak błędów autoryzacji

---

## ❌ Test 8: Nie można przekazać nieprzypisanego ticketu

### Kroki:
1. Zaloguj się jako **USER 1**
2. Utwórz nowy ticket (nieprzypisany)
3. Wyloguj się
4. Zaloguj jako **AGENT 1**
5. Znajdź nieprzypisany ticket
6. Kliknij na ticket → dialog szczegółów

### Oczekiwany rezultat:
✅ **Brak przycisku "Przekaż zgłoszenie"** (widoczny tylko dla przypisanych)  
✅ Widoczny przycisk "Przypisz do mnie"

---

## ✅ Test 9: Dialog przekazywania pokazuje listę agentów

### Kroki:
1. Zaloguj się jako **AGENT 1**
2. Przypisz ticket do siebie
3. Kliknij "Przekaż zgłoszenie"

### Oczekiwany rezultat:
✅ Pojawia się modal z tłem overlay  
✅ Select pokazuje listę agentów/adminów:
   - Agent 2 (agent2@tickflow.com) - AGENT
   - Admin (admin@tickflow.com) - ADMIN
✅ **Lista NIE zawiera** AGENT 1 (aktualnie przypisany jest filtrowany)  
✅ Każdy agent wyświetla: Imię, email, rolę  
✅ Przycisk "Przekaż" jest wyłączony dopóki nie wybierzesz agenta  
✅ Przycisk "Anuluj" zamyka dialog

---

## ✅ Test 10: Status ticketu nie zmienia się po przekazaniu

### Kroki:
1. Zaloguj się jako **AGENT 1**
2. Przypisz ticket do siebie
3. Zmień status na **IN_PROGRESS**
4. Kliknij "Przekaż zgłoszenie"
5. Wybierz AGENT 2
6. Kliknij "Przekaż"
7. Sprawdź status ticketu

### Oczekiwany rezultat:
✅ Status pozostaje **IN_PROGRESS** (nie zmienia się)  
✅ Zmienia się tylko "Przypisane do: Agent 2"

### Powtórz test dla innych statusów:
- Status: RESOLVED → po przekazaniu: RESOLVED
- Status: OPEN → po przekazaniu: OPEN

---

## 📊 Checklist wszystkich testów

### Funkcjonalność: Przywróć ticket
- [ ] USER może przywrócić swój zamknięty ticket
- [ ] USER nie może przywrócić cudzego ticketu (brak przycisku)
- [ ] AGENT może przywrócić ticket ze swojej kategorii
- [ ] ADMIN może przywrócić dowolny ticket
- [ ] Nie można przywrócić ticketu != CLOSED (brak przycisku)
- [ ] Przywrócony ticket ma status OPEN
- [ ] Przywrócony ticket zachowuje przypisanie

### Funkcjonalność: Przekaż ticket
- [ ] AGENT może przekazać swój ticket
- [ ] ADMIN może przekazać dowolny przypisany ticket
- [ ] Nie można przekazać nieprzypisanego ticketu (brak przycisku)
- [ ] Dialog pokazuje listę agentów (bez aktualnie przypisanego)
- [ ] Przekazany ticket zachowuje status
- [ ] Przekazany ticket zmienia tylko przypisanie

### Bugfix
- [ ] Admin może przypisać ticket do siebie (kliknij "Przypisz do mnie" jako ADMIN)

---

## 🐛 Zgłaszanie błędów

Jeśli którykolwiek test nie przejdzie:
1. Sprawdź konsolę przeglądarki (F12) - czy są błędy JS?
2. Sprawdź terminal z `npm run dev` - czy są błędy backendu?
3. Sprawdź Network tab (F12) - jaki status HTTP zwraca API?
4. Sprawdź dane w bazie (Supabase Dashboard)

---

**Wszystkie testy weryfikacji kodu (16/16) przeszły pomyślnie!**  
Testy manualne potwierdzą działanie w rzeczywistym UI.

