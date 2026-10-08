## 2026-10-08 - Remove plaintext password logging on SignInPage
**Vulnerability:** Plaintext user credentials (email and password) were being logged to the console in `app/auth/signin/page.tsx` during the sign-in attempt.
**Learning:** Client-side event handlers often contain debugging statements (like `console.log`) left over from development. When these handlers process sensitive data like passwords, those logs become a critical security risk by exposing plaintext credentials to anyone with access to the console or potential logging aggregation tools.
**Prevention:** Never log sensitive user input, especially passwords or authentication tokens, in client-side or server-side code. Use secure logging practices that mask or entirely omit sensitive data.
