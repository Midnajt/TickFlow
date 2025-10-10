# Przewodnik po Komponentach Autoryzacji

## Przegląd
Ten dokument zawiera szczegółowy przewodnik po wszystkich komponentach związanych z autoryzacją w projekcie TickFlow.

---

## 📦 Komponenty

### 1. AuthLayout

**Lokalizacja:** `app/components/AuthLayout.tsx`

**Opis:** Layout wrapper dla wszystkich stron autoryzacji (login, change-password, reset-password, etc.)

#### Props
```typescript
interface AuthLayoutProps {
  children: React.ReactNode;  // Zawartość (formularz)
  title?: string;              // Główny tytuł (domyślnie: "TickFlow")
  subtitle?: string;           // Podtytuł (domyślnie: "Zaloguj się do systemu zgłoszeń")
}
```

#### Przykład użycia
```typescript
import { AuthLayout } from '@/app/components/AuthLayout';

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Logowanie" 
      subtitle="Zaloguj się do systemu"
    >
      <LoginForm />
    </AuthLayout>
  );
}
```

#### Style
- Pełnoekranowe tło z gradientem (gray-900 → gray-800)
- Wycentrowana karta z maksymalną szerokością 28rem (448px)
- Zaokrąglone rogi (rounded-2xl)
- Shadow dla efektu głębi

---

### 2. ErrorAlert

**Lokalizacja:** `app/components/ErrorAlert.tsx`

**Opis:** Komponent do wyświetlania komunikatów błędów z pełną dostępnością (A11y)

#### Props
```typescript
interface ErrorAlertProps {
  messages: string[];  // Tablica komunikatów błędów
}
```

#### Przykład użycia
```typescript
import { ErrorAlert } from '@/app/components/ErrorAlert';

function MyForm() {
  const [errors, setErrors] = useState<string[]>([]);
  
  return (
    <form>
      {/* ... fields ... */}
      <ErrorAlert messages={errors} />
    </form>
  );
}
```

#### Funkcje
- Automatyczne ukrycie gdy brak błędów
- Pojedynczy komunikat: wyświetla jako paragraf
- Wiele komunikatów: wyświetla jako lista punktowana
- ARIA: `role="alert"`, `aria-live="polite"`

#### Style
- Czerwone tło z przezroczystością (red-900/30)
- Czerwona ramka (border-red-800)
- Jasny tekst (text-red-200)

---

### 3. LoginForm

**Lokalizacja:** `app/components/LoginForm.tsx`

**Opis:** Formularz logowania z walidacją, obsługą błędów i integracją API

#### Props
Brak (komponent standalone)

#### Funkcje
- ✅ Walidacja formularza (React Hook Form + Zod)
- ✅ Pola: email, password
- ✅ Obsługa błędów API (400, 401, 500)
- ✅ Stan ładowania z spinnerem
- ✅ Automatyczny redirect po zalogowaniu
- ✅ Pełna dostępność (ARIA)

#### Walidacja
```typescript
email: z.string().email().toLowerCase().trim()
password: z.string().min(1)
```

#### Stany
```typescript
const [errorMessages, setErrorMessages] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

#### API Integration
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: LoginResponseDTO
```

#### Redirect Logic
- Jeśli `passwordResetRequired === true` → `/change-password`
- W przeciwnym razie → `/`

#### Przykład użycia
```typescript
import { LoginForm } from '@/app/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
```

---

### 4. ChangePasswordForm

**Lokalizacja:** `app/components/ChangePasswordForm.tsx`

**Opis:** Formularz zmiany hasła z walidacją złożonych reguł i komunikatem sukcesu

#### Props
```typescript
interface ChangePasswordFormProps {
  isForced?: boolean;  // Czy zmiana jest wymuszona (domyślnie: false)
}
```

#### Funkcje
- ✅ Walidacja formularza (React Hook Form + Zod)
- ✅ Pola: currentPassword, newPassword, confirmPassword
- ✅ Obsługa błędów API (400, 401, 500)
- ✅ Stan ładowania z spinnerem
- ✅ Komunikat sukcesu
- ✅ Automatyczny redirect do `/` po 2 sekundach
- ✅ Alert dla wymuszonych zmian hasła
- ✅ Podpowiedź o wymaganiach hasła

#### Walidacja
```typescript
currentPassword: z.string().min(1)
newPassword: z.string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .max(100, "Hasło może mieć maksymalnie 100 znaków")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, "...")
confirmPassword: z.string().min(1)

// Custom refinements:
- newPassword === confirmPassword
- newPassword !== currentPassword
```

#### Wymagania Hasła
- ✅ Minimum 8 znaków
- ✅ Maximum 100 znaków
- ✅ Co najmniej jedna mała litera (a-z)
- ✅ Co najmniej jedna wielka litera (A-Z)
- ✅ Co najmniej jedna cyfra (0-9)
- ✅ Co najmniej jeden znak specjalny (@$!%*?&)
- ✅ Musi różnić się od starego hasła

#### API Integration
```typescript
POST /api/auth/change-password
Body: { 
  currentPassword: string,
  newPassword: string,
  confirmPassword: string 
}
Response: ChangePasswordResponseDTO
```

#### Przykład użycia
```typescript
import { ChangePasswordForm } from '@/app/components/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <AuthLayout 
      title="Zmiana hasła"
      subtitle="Utwórz nowe, bezpieczne hasło"
    >
      <ChangePasswordForm isForced={true} />
    </AuthLayout>
  );
}
```

---

## 🔧 Utility Functions

### getAuthToken()

**Lokalizacja:** `app/lib/utils/auth.ts`

**Opis:** Pobiera token JWT z requesta (cookie lub Authorization header)

```typescript
function getAuthToken(request: NextRequest): string | null
```

**Priorytet:**
1. HTTP-only cookie `auth-token`
2. Authorization header `Bearer <token>`

---

### requireAuth()

**Lokalizacja:** `app/lib/utils/auth.ts`

**Opis:** Weryfikuje autentykację i zwraca dane sesji użytkownika

```typescript
async function requireAuth(request: NextRequest): Promise<UserSessionDTO>
```

**Rzuca błąd jeśli:**
- Brak tokena
- Token nieprawidłowy
- Token wygasł

**Przykład użycia:**
```typescript
import { requireAuth } from '@/app/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

### withAuth()

**Lokalizacja:** `app/lib/utils/auth.ts`

**Opis:** Wrapper dla route handlerów wymagających autentykacji

```typescript
function withAuth(
  handler: (request: NextRequest, user: UserSessionDTO) => Promise<Response>
): (request: NextRequest) => Promise<Response>
```

**Przykład użycia:**
```typescript
import { withAuth } from '@/app/lib/utils/auth';

export const GET = withAuth(async (request, user) => {
  return NextResponse.json({ 
    message: `Hello ${user.name}` 
  });
});
```

---

### withRole()

**Lokalizacja:** `app/lib/utils/auth.ts`

**Opis:** Wrapper dla route handlerów wymagających określonej roli

```typescript
function withRole(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, user: UserSessionDTO) => Promise<Response>
): (request: NextRequest) => Promise<Response>
```

**Przykład użycia:**
```typescript
import { withRole } from '@/app/lib/utils/auth';

export const GET = withRole(['AGENT', 'ADMIN'], async (request, user) => {
  return NextResponse.json({ 
    message: "Only agents and admins can see this" 
  });
});
```

---

## 🛡️ Middleware

### Next.js Middleware

**Lokalizacja:** `middleware.ts` (root)

**Opis:** Globalne middleware do ochrony tras i przekierowań

#### Funkcje
- ✅ Weryfikacja tokenu JWT
- ✅ Ochrona prywatnych tras
- ✅ Redirect niezalogowanych → `/login`
- ✅ Redirect zalogowanych z `/login` → `/`
- ✅ Wymuszenie zmiany hasła
- ✅ Automatyczne usuwanie nieprawidłowych tokenów

#### Konfiguracja
```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

#### Ścieżki
```typescript
// Publiczne (dostępne bez logowania)
const publicPaths = ['/login'];

// Chronione (wymagają tokenu)
const protectedPaths = ['/', '/tickets', '/categories', '/change-password'];
```

#### Flow
1. Sprawdź czy użytkownik jest na publicznej ścieżce + ma token → redirect do `/`
2. Sprawdź czy użytkownik jest na chronionej ścieżce + NIE ma tokenu → redirect do `/login`
3. Sprawdź czy użytkownik ma `passwordResetRequired` → wymuszenie `/change-password`
4. Usuń nieprawidłowe tokeny z cookie

---

## 📝 Schematy Walidacji (Zod)

### loginSchema

**Lokalizacja:** `app/lib/validators/auth.ts`

```typescript
export const loginSchema = z.object({
  email: z
    .string({ message: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: "Hasło jest wymagane" })
    .min(1, "Hasło nie może być puste"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

---

### changePasswordSchema

**Lokalizacja:** `app/lib/validators/auth.ts`

```typescript
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Aktualne hasło jest wymagane" })
      .min(1, "Aktualne hasło nie może być puste"),
    newPassword: z
      .string({ message: "Nowe hasło jest wymagane" })
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .max(100, "Hasło może mieć maksymalnie 100 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Hasło musi zawierać: małą literę, wielką literę, cyfrę i znak specjalny"
      ),
    confirmPassword: z
      .string({ message: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła nie może być puste"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi różnić się od obecnego",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

---

## 🎨 Styling & Tailwind Classes

### Wspólne Klasy

#### Input Fields
```typescript
className={`
  appearance-none relative block w-full 
  px-4 py-3 
  border ${errors.field ? 'border-red-500' : 'border-gray-600'} 
  placeholder-gray-400 text-white bg-gray-700 
  rounded-lg 
  focus:outline-none focus:ring-2 
  ${errors.field ? 'focus:ring-red-500' : 'focus:ring-indigo-500'} 
  focus:border-transparent 
  transition-all
`}
```

#### Submit Button
```typescript
className="
  group relative w-full 
  flex justify-center 
  py-3 px-4 
  border border-transparent 
  text-sm font-medium 
  rounded-lg 
  text-white bg-indigo-600 
  hover:bg-indigo-700 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
  disabled:opacity-50 disabled:cursor-not-allowed 
  transition-all
"
```

#### Error Message
```typescript
className="mt-1 text-sm text-red-400"
role="alert"
```

---

## ♿ Dostępność (A11y)

### Implementowane Funkcje

#### ARIA Attributes
- `aria-invalid`: Oznacza nieprawidłowe pola formularza
- `aria-describedby`: Łączy pola z komunikatami błędów
- `role="alert"`: Komunikaty błędów i sukcesu
- `aria-live="polite"`: Dynamiczne aktualizacje dla screen readerów
- `aria-hidden="true"`: Ukrywa dekoracyjne elementy (SVG)

#### HTML Semantyczny
- Używamy `<label>` dla wszystkich pól
- `<button type="submit">` zamiast div z onClick
- Odpowiednie atrybuty `type` na inputach

#### Keyboard Navigation
- Tab/Shift+Tab: Nawigacja między polami
- Enter: Submit formularza
- Focus states na wszystkich interaktywnych elementach

#### Autocomplete
```html
<input autocomplete="email" />
<input autocomplete="current-password" />
<input autocomplete="new-password" />
```

---

## 🔐 Bezpieczeństwo

### Best Practices

1. **HTTP-only Cookies**
   - Token przechowywany w HTTP-only cookie
   - Niedostępny dla JavaScript (XSS protection)

2. **Secure Flag**
   - Włączony w production
   - Cookie przesyłane tylko przez HTTPS

3. **SameSite: Strict**
   - Ochrona przed CSRF

4. **Token Expiration**
   - 7 dni
   - Automatyczne usuwanie wygasłych tokenów

5. **Rate Limiting**
   - Implementowane na endpoint `/api/auth/login`
   - Ochrona przed brute-force

6. **Walidacja**
   - Po stronie frontendu (UX)
   - Po stronie backendu (Security)

7. **Hasła**
   - Nigdy nie logowane
   - Hashowane (bcrypt)
   - Złożone wymagania

---

## 🧪 Testowanie

### Quick Test
```bash
# 1. Uruchom serwer
npm run dev

# 2. Otwórz http://localhost:3000/login

# 3. Użyj testowego konta
admin@tickflow.com / Admin123!@#
```

### Scenariusze Testowe
Zobacz szczegółowy plan: [documentation/login-testing-plan.md](./login-testing-plan.md)

---

## 📖 Dodatkowe Zasoby

- **[Login Implementation Complete](./login-implementation-complete.md)** - Pełna dokumentacja implementacji
- **[Login Testing Plan](./login-testing-plan.md)** - Plan testów manualnych
- **[Auth API Documentation](./auth-api-documentation.md)** - Dokumentacja API

---

## 💡 Tips & Tricks

### Custom Hook dla Auth Form
```typescript
import { useAuthForm } from '@/app/hooks/useAuthForm';

// Można stworzyć custom hook do reużycia logiki formularza
function useAuthForm<T>(schema: ZodSchema<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });
  
  return form;
}
```

### Error Boundary
```typescript
// Można dodać Error Boundary dla lepszej obsługi błędów
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <LoginForm />
</ErrorBoundary>
```

### Loading State Global
```typescript
// Można stworzyć globalny context dla loading state
const AuthContext = createContext<{
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}>({ isLoading: false, setIsLoading: () => {} });
```

---

**Ostatnia aktualizacja:** 10 października 2025  
**Wersja:** 1.0.0  
**Status:** ✅ Kompletna

