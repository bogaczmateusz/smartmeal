# API Endpoint Implementation Plan: Authentication & User Management

## 1. Endpoint Overview

This implementation plan covers four critical endpoints for complete user lifecycle management:

1. **POST /api/auth/register** - Creates a new user account via Supabase Auth and automatically provisions a user profile with an empty `ingredients_to_avoid` array. Returns authentication tokens for immediate session establishment.

2. **POST /api/auth/login** - Authenticates user credentials through Supabase Auth and returns session tokens for authenticated access to protected resources.

3. **POST /api/auth/logout** - Invalidates the current authenticated session, effectively logging out the user by revoking their JWT token.

4. **DELETE /api/users/me** - Permanently deletes the authenticated user's account along with all associated data (profile and recipes) through cascading database operations.

All endpoints leverage Supabase Auth for secure authentication operations, ensuring proper password hashing, token generation, and session management. The implementation follows Astro's API route conventions and adheres to the project's established patterns for error handling, validation, and service layer abstraction.

## 2. Request Details

### 2.1 Register User

- **HTTP Method:** POST
- **URL Structure:** `/api/auth/register`
- **Authentication:** Not required (public endpoint)
- **Parameters:**
  - Required: None (all data in request body)
  - Optional: None
- **Request Body:**
  ```typescript
  {
    "email": "user@example.com",      // Valid email format
    "password": "securePassword123"   // Minimum 6 characters
  }
  ```
- **Headers:**
  - `Content-Type: application/json`

### 2.2 Login User

- **HTTP Method:** POST
- **URL Structure:** `/api/auth/login`
- **Authentication:** Not required (public endpoint)
- **Parameters:**
  - Required: None (all data in request body)
  - Optional: None
- **Request Body:**
  ```typescript
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Headers:**
  - `Content-Type: application/json`

### 2.3 Logout User

- **HTTP Method:** POST
- **URL Structure:** `/api/auth/logout`
- **Authentication:** Required (JWT token)
- **Parameters:**
  - Required: None
  - Optional: None
- **Request Body:** None
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (handled by middleware)

### 2.4 Delete User Account

- **HTTP Method:** DELETE
- **URL Structure:** `/api/users/me`
- **Authentication:** Required (JWT token)
- **Parameters:**
  - Required: None
  - Optional: None
- **Request Body:** None
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (handled by middleware)

## 3. Used Types

### 3.1 Request Types (Command Models)

```typescript
// From types.ts
interface RegisterCommand {
  email: string;
  password: string;
}

interface LoginCommand {
  email: string;
  password: string;
}
```

### 3.2 Response Types (DTOs)

```typescript
// From types.ts
interface AuthUserDTO {
  id: string;
  email: string;
  created_at: string;
}

interface AuthSessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

interface RegisterResponseDTO {
  user: AuthUserDTO;
  session: AuthSessionDTO;
  profile: ProfileDTO;
}

interface LoginResponseDTO {
  user: AuthUserDTO;
  session: AuthSessionDTO;
}

interface SuccessResponseDTO {
  success: true;
  message: string;
}

interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: string | Record<string, string>;
}
```

### 3.3 Validation Schemas (Zod)

Create in `src/lib/validation/auth.validation.ts`:

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});
```

## 4. Response Details

### 4.1 Register User

**Success Response (201 Created):**
```typescript
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1737028800,
    "expires_in": 3600
  },
  "profile": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredients_to_avoid": [],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation errors
- **409 Conflict** - Email already registered
- **500 Internal Server Error** - Server/database errors

### 4.2 Login User

**Success Response (200 OK):**
```typescript
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1737028800,
    "expires_in": 3600
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Invalid credentials
- **500 Internal Server Error** - Server errors

### 4.3 Logout User

**Success Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error** - Server errors

### 4.4 Delete User Account

**Success Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error** - Server errors

## 5. Data Flow

### 5.1 Register User Flow

```
1. Client sends POST /api/auth/register with email and password
   ↓
2. API route validates request body using Zod schema
   ↓
3. [VALIDATION FAILS] → Return 400 with validation errors
   ↓
4. [VALIDATION PASSES] → Call auth.service.registerUser()
   ↓
5. auth.service calls supabase.auth.signUp()
   ↓
6. [SIGNUP FAILS - USER EXISTS] → Supabase returns error → Return 409 Conflict
   ↓
7. [SIGNUP FAILS - OTHER ERROR] → Return 500 Internal Server Error
   ↓
8. [SIGNUP SUCCESS] → User created in auth.users table
   ↓
9. auth.service calls profile.service.createProfile() with user_id
   ↓
10. Profile created in public.profiles table with empty ingredients_to_avoid
   ↓
11. [PROFILE CREATION FAILS] → Log error, attempt cleanup (optional), return 500
   ↓
12. [PROFILE SUCCESS] → Format response with user, session, and profile
   ↓
13. Return 201 Created with RegisterResponseDTO
```

**Database Operations:**
- INSERT into `auth.users` (via Supabase Auth)
- INSERT into `public.profiles` (via Supabase client)

### 5.2 Login User Flow

```
1. Client sends POST /api/auth/login with email and password
   ↓
2. API route validates request body using Zod schema
   ↓
3. [VALIDATION FAILS] → Return 400 with validation errors
   ↓
4. [VALIDATION PASSES] → Call auth.service.loginUser()
   ↓
5. auth.service calls supabase.auth.signInWithPassword()
   ↓
6. [LOGIN FAILS - INVALID CREDENTIALS] → Return 401 Unauthorized (generic message)
   ↓
7. [LOGIN FAILS - OTHER ERROR] → Return 500 Internal Server Error
   ↓
8. [LOGIN SUCCESS] → Supabase returns user and session
   ↓
9. Format response with user and session data
   ↓
10. Return 200 OK with LoginResponseDTO
```

**Database Operations:**
- SELECT from `auth.users` (via Supabase Auth)

### 5.3 Logout User Flow

```
1. Client sends POST /api/auth/logout with JWT token
   ↓
2. Middleware validates JWT token
   ↓
3. [TOKEN INVALID] → Middleware returns 401 Unauthorized
   ↓
4. [TOKEN VALID] → Request reaches API route with authenticated supabase client
   ↓
5. API route calls auth.service.logoutUser()
   ↓
6. auth.service calls supabase.auth.signOut()
   ↓
7. [SIGNOUT FAILS] → Return 500 Internal Server Error
   ↓
8. [SIGNOUT SUCCESS] → Session invalidated
   ↓
9. Return 200 OK with SuccessResponseDTO
```

**Database Operations:**
- UPDATE/DELETE session in Supabase Auth (handled internally by Supabase)

### 5.4 Delete User Account Flow

```
1. Client sends DELETE /api/users/me with JWT token
   ↓
2. Middleware validates JWT token and extracts user_id
   ↓
3. [TOKEN INVALID] → Middleware returns 401 Unauthorized
   ↓
4. [TOKEN VALID] → Request reaches API route with authenticated context
   ↓
5. API route calls auth.service.deleteUserAccount()
   ↓
6. auth.service calls supabase.auth.admin.deleteUser(user_id)
   ↓
7. [DELETE FAILS] → Return 500 Internal Server Error
   ↓
8. [DELETE SUCCESS] → User deleted from auth.users
   ↓
9. Database CASCADE triggers automatic deletion:
   - public.profiles record deleted (FK: user_id → auth.users.id)
   - public.recipes records deleted (FK: user_id → auth.users.id)
   ↓
10. Return 200 OK with SuccessResponseDTO
```

**Database Operations:**
- DELETE from `auth.users` (via Supabase Auth Admin API)
- DELETE from `public.profiles` (cascaded automatically)
- DELETE from `public.recipes` (cascaded automatically)

## 6. Security Considerations

### 6.1 Authentication & Authorization

**JWT Token Management:**
- Middleware (defined in `src/middleware/index.ts`) must validate JWT tokens for protected endpoints
- Access JWT from `Authorization: Bearer <token>` header
- Use `supabase.auth.getUser()` to validate token and extract user information
- Protected endpoints: `/api/auth/logout`, `/api/users/me`
- Public endpoints: `/api/auth/register`, `/api/auth/login`

**Session Security:**
- Leverage Supabase's built-in session management
- Access tokens expire after configured duration (typically 1 hour)
- Refresh tokens used for obtaining new access tokens
- Consider setting secure session cookies via Supabase client configuration

### 6.2 Password Security

**Password Requirements:**
- Minimum length: 6 characters (as per specification)
- Recommend frontend UX to encourage stronger passwords (consider adding client-side validation for 8+ chars, mix of characters)
- All password hashing handled by Supabase Auth using bcrypt
- Passwords never stored in plain text
- Passwords never logged or exposed in error messages

### 6.3 Input Validation & Sanitization

**Zod Validation Schema (`src/lib/validation/auth.validation.ts`):**
```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});
```

**Validation Process:**
1. Parse request body with Zod schema
2. Return 400 with field-specific errors on validation failure
3. Proceed with validated data only

### 6.4 Attack Prevention

**Brute Force Protection:**
- Consider implementing rate limiting at middleware level
- Supabase Auth includes built-in rate limiting (check configuration)
- Log repeated failed login attempts for monitoring
- Consider implementing temporary account lockout after N failed attempts

**Email Enumeration Prevention:**
- Use generic error messages for login failures: "Invalid email or password"
- Avoid specific messages like "Email not found" or "Invalid password"
- Registration endpoint returns 409 for existing emails (necessary for UX but document risk)

**CSRF Protection:**
- Use `SameSite=Strict` or `SameSite=Lax` for session cookies
- Consider implementing CSRF tokens for state-changing operations
- Leverage Astro's built-in CSRF protection if available

**SQL Injection Prevention:**
- Supabase client uses parameterized queries (no direct SQL concatenation)
- Zod validation ensures input types are correct
- No raw SQL queries in application code

### 6.5 Data Privacy

**Sensitive Data Handling:**
- Never log passwords (even hashed)
- Sanitize error messages to avoid leaking user information
- Use HTTPS for all API communications (enforce at server level)
- Implement proper CORS configuration to restrict origins

**Account Deletion:**
- UI must display confirmation modal before calling DELETE endpoint
- Modal text: "This action cannot be undone. All your recipes and data will be permanently deleted."
- Consider adding email confirmation for account deletion (future enhancement)

### 6.6 Authorization Checks

**User Context Verification:**
- For DELETE /api/users/me, ensure the user_id from JWT matches the account being deleted
- Middleware must attach authenticated user to request context
- Services should validate user_id matches expected user

## 7. Error Handling

### 7.1 Error Handling Strategy

Follow the coding practice guidelines:
1. Handle errors and edge cases at the beginning of functions
2. Use early returns for error conditions
3. Place happy path last in the function
4. Avoid unnecessary else statements

All errors return consistent `ErrorResponseDTO`:
```typescript
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional information or field-specific errors"
}
```

### 7.2 Error Scenarios by Endpoint

#### POST /api/auth/register

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| Missing email | 400 | `{ error: "Validation failed", message: "Request validation failed", details: { email: "Valid email address is required" } }` | Zod validation catches, return formatted error |
| Invalid email format | 400 | `{ error: "Validation failed", message: "Request validation failed", details: { email: "Valid email address is required" } }` | Zod validation catches, return formatted error |
| Password too short | 400 | `{ error: "Validation failed", message: "Request validation failed", details: { password: "Password must be at least 6 characters" } }` | Zod validation catches, return formatted error |
| Email already exists | 409 | `{ error: "Conflict", message: "A user with this email already exists" }` | Supabase signUp returns error with code, map to 409 |
| Profile creation fails | 500 | `{ error: "Internal Server Error", message: "Failed to create user account" }` | Catch database error, log details, return generic message |
| Supabase Auth error | 500 | `{ error: "Internal Server Error", message: "Authentication service error" }` | Catch Supabase error, log details, return generic message |

#### POST /api/auth/login

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| Missing email | 400 | `{ error: "Validation failed", message: "Request validation failed", details: { email: "Email is required" } }` | Zod validation catches, return formatted error |
| Missing password | 400 | `{ error: "Validation failed", message: "Request validation failed", details: { password: "Password is required" } }` | Zod validation catches, return formatted error |
| Invalid credentials | 401 | `{ error: "Unauthorized", message: "Invalid email or password" }` | Supabase signIn returns error, map to 401 with generic message |
| Account not verified | 401 | `{ error: "Unauthorized", message: "Invalid email or password" }` | Treat same as invalid credentials (prevent enumeration) |
| Supabase Auth error | 500 | `{ error: "Internal Server Error", message: "Authentication service error" }` | Catch Supabase error, log details, return generic message |

#### POST /api/auth/logout

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| Missing JWT token | 401 | `{ error: "Unauthorized", message: "Authentication required" }` | Middleware catches, returns 401 |
| Invalid JWT token | 401 | `{ error: "Unauthorized", message: "Invalid or expired token" }` | Middleware validates token, returns 401 if invalid |
| Supabase signOut error | 500 | `{ error: "Internal Server Error", message: "Failed to logout" }` | Catch Supabase error, log details, return generic message |

#### DELETE /api/users/me

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| Missing JWT token | 401 | `{ error: "Unauthorized", message: "Authentication required" }` | Middleware catches, returns 401 |
| Invalid JWT token | 401 | `{ error: "Unauthorized", message: "Invalid or expired token" }` | Middleware validates token, returns 401 if invalid |
| User not found | 500 | `{ error: "Internal Server Error", message: "Failed to delete account" }` | Treat as internal error (shouldn't happen with valid token) |
| Database deletion error | 500 | `{ error: "Internal Server Error", message: "Failed to delete account" }` | Catch database error, log details, return generic message |
| Cascade deletion error | 500 | `{ error: "Internal Server Error", message: "Failed to delete account" }` | Catch database error, log details, return generic message |

### 7.3 Error Logging

**Logging Strategy:**
```typescript
// Structure: [LEVEL] [CONTEXT] message - details
console.error('[ERROR] [AUTH:REGISTER]', error.message, { userId, email });
console.error('[ERROR] [AUTH:LOGIN]', error.message);
console.error('[ERROR] [AUTH:LOGOUT]', error.message, { userId });
console.error('[ERROR] [USER:DELETE]', error.message, { userId });
```

**What to Log:**
- Error type and message
- User identifier (if available and not sensitive)
- Timestamp (automatic with console)
- Stack trace for unexpected errors
- Request metadata (method, path)

**What NOT to Log:**
- Passwords (plain or hashed)
- Full JWT tokens
- Sensitive user data (beyond IDs)
- Complete request bodies with credentials

### 7.4 Error Response Helper

Create helper function in `src/lib/utils.ts`:

```typescript
export function createErrorResponse(
  status: number,
  error: string,
  message: string,
  details?: string | Record<string, string>
): Response {
  const body: ErrorResponseDTO = { error, message };
  if (details) {
    body.details = details;
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes:**
- `profiles.user_id` should have index (foreign key) - verify in migration
- `recipes.user_id` should have index (foreign key) - verify in migration
- `auth.users.email` indexed by Supabase Auth automatically

**Cascading Deletes:**
- ON DELETE CASCADE configured for `profiles.user_id` → `auth.users.id`
- ON DELETE CASCADE configured for `recipes.user_id` → `auth.users.id`
- Database handles cascading efficiently in single transaction
- For users with thousands of recipes, deletion may take several seconds

### 8.2 Query Optimization

**Registration:**
- 2 INSERT operations: auth.users + profiles
- Consider using Supabase transaction/batch if supported
- Profile insert is lightweight (only ingredients_to_avoid array)

**Login:**
- Single SELECT from auth.users by email (indexed)
- Fast lookup via email index
- Session generation handled by Supabase Auth

**Logout:**
- Session invalidation handled by Supabase (internal operations)
- Minimal performance impact

**Deletion:**
- Single DELETE from auth.users
- Cascades automatically handle related records
- For large datasets (many recipes), may want to implement batch deletion or background job
- Monitor deletion performance for users with 1000+ recipes

### 8.3 Caching Considerations

**Session Caching:**
- Supabase Auth handles session caching internally
- JWT tokens are stateless (no server-side session storage needed)
- No additional caching required for these endpoints

**Rate Limiting:**
- Implement in-memory rate limiting for auth endpoints
- Use Redis for distributed rate limiting in production
- Suggested limits:
  - Register: 5 requests per hour per IP
  - Login: 10 requests per 15 minutes per IP
  - Logout: 20 requests per minute per user
  - Delete: 2 requests per hour per user

### 8.4 Bottlenecks & Mitigation

**Potential Bottlenecks:**
1. **Registration during profile creation**: If profile creation is slow, consider async processing
2. **Account deletion with many recipes**: Cascading deletes may timeout
   - Mitigation: Implement soft delete or background job for large accounts
3. **Supabase Auth API latency**: External service dependency
   - Mitigation: Monitor Supabase status, implement timeout handling

**Monitoring:**
- Track response times for each endpoint
- Alert on >2s response times for auth operations
- Monitor Supabase Auth error rates
- Track registration completion rates (successful profile creation)

## 9. Implementation Steps

### Step 1: Update Type Definitions

**File:** `src/types.ts`

1. Add Auth DTOs and Command Models section
2. Define command models:
   - `RegisterCommand` - email and password fields
   - `LoginCommand` - email and password fields
3. Define response DTOs:
   - `AuthUserDTO` - id, email, created_at
   - `AuthSessionDTO` - tokens and expiration info
   - `RegisterResponseDTO` - user, session, profile
   - `LoginResponseDTO` - user, session
4. Add JSDoc comments for each interface

### Step 2: Create Validation Schemas

**File:** `src/lib/validation/auth.validation.ts` (new file)

1. Create new file for auth validation schemas
2. Import Zod
3. Define validation schemas:
   - `registerSchema` - email (valid format), password (min 6 chars)
   - `loginSchema` - email (required, valid format), password (required)
4. Export type-safe command types inferred from schemas
5. Add JSDoc comments for each schema

### Step 3: Create Profile Service

**File:** `src/lib/services/profile.service.ts` (new file if it doesn't exist)

1. Create new file for profile service
2. Import necessary types (SupabaseClient, ProfileDTO)
3. Implement `createProfile(supabase, userId)` function:
   - Insert profile with user_id and empty ingredients_to_avoid array
   - Return created profile data
   - Handle database errors with logging
   - Throw error if creation fails
4. Add JSDoc comments with parameter descriptions
5. Export class based service

### Step 4: Create Error Response Helper

**File:** `src/lib/utils.ts` (add to existing file)

1. Import ErrorResponseDTO type
2. Implement `createErrorResponse(status, error, message, details?)` helper:
   - Build ErrorResponseDTO object
   - Conditionally add details if provided
   - Return Response with JSON body and appropriate headers
3. Add JSDoc comments
4. Export function

### Step 5: Create Auth Service

**File:** `src/lib/services/auth.service.ts` (new file)

1. Create new file for auth service
2. Import necessary types and dependencies
3. Implement helper mapper functions:
   - `mapUserToDTO(user)` - convert Supabase user to AuthUserDTO
   - `mapSessionToDTO(session)` - convert Supabase session to AuthSessionDTO
4. Implement service functions:

   **a. `registerUser(supabase, email, password)`**
   - Call supabase.auth.signUp() with credentials
   - Handle auth errors (check for USER_EXISTS vs generic errors)
   - Call createProfile() with new user's ID
   - Handle profile creation errors with optional cleanup
   - Return RegisterResponseDTO with mapped user, session, and profile
   - Add error logging with context
   
   **b. `loginUser(supabase, email, password)`**
   - Call supabase.auth.signInWithPassword() with credentials
   - Handle errors with generic message (prevent email enumeration)
   - Return LoginResponseDTO with mapped user and session
   - Add error logging
   
   **c. `logoutUser(supabase)`**
   - Call supabase.auth.signOut()
   - Handle errors with logging
   - Throw LOGOUT_ERROR on failure
   
   **d. `deleteUserAccount(supabase, userId)`**
   - Call supabase.auth.admin.deleteUser() with userId
   - Handle errors with logging
   - Note: Cascading deletes automatically handle profiles and recipes
   - Throw DELETE_ERROR on failure

5. Add JSDoc comments for all functions
6. Export class based service

### Step 6: Implement POST /api/auth/register

**File:** `src/pages/api/auth/register.ts` (new file)

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types, validation schemas, services
4. Implement POST handler:
   - Parse request body
   - Validate using registerSchema.safeParse()
   - Return 400 with field-specific errors if validation fails
   - Call registerUser() service with validated data
   - Return 201 Created with RegisterResponseDTO
   - Handle specific errors (USER_EXISTS → 409, PROFILE_CREATE_ERROR → 500)
   - Handle generic errors with 500 and logging
5. Export POST function

**Code Structure:**
```typescript
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parse request body
  // 2. Validate using Zod schema (early return if invalid)
  // 3. Call service with validated data
  // 4. Handle errors (try-catch with specific error types)
  // 5. Return success response (201)
};
```

### Step 7: Implement POST /api/auth/login

**File:** `src/pages/api/auth/login.ts` (new file)

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types, validation schemas, services
4. Implement POST handler:
   - Parse request body
   - Validate using loginSchema.safeParse()
   - Return 400 with field-specific errors if validation fails
   - Call loginUser() service with validated data
   - Return 200 OK with LoginResponseDTO
   - Handle INVALID_CREDENTIALS error with 401
   - Handle generic errors with 500 and logging
5. Export POST function

### Step 8: Implement POST /api/auth/logout

**File:** `src/pages/api/auth/logout.ts` (new file)

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types and services
4. Implement POST handler:
   - Check authentication with locals.supabase.auth.getUser()
   - Return 401 if user not authenticated (early return)
   - Call logoutUser() service
   - Return 200 OK with SuccessResponseDTO
   - Handle errors with 500 and logging
5. Export POST function

### Step 9: Implement DELETE /api/users/me

**File:** `src/pages/api/users/me.ts` (new file)

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types and services
4. Implement DELETE handler:
   - Check authentication with locals.supabase.auth.getUser()
   - Return 401 if user not authenticated (early return)
   - Call deleteUserAccount() service with user.id
   - Return 200 OK with SuccessResponseDTO
   - Handle errors with 500 and logging
5. Export DELETE function

### Step 10: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

1. Verify middleware creates Supabase client and attaches to locals
2. (Optional) Add authentication checks for protected routes:
   - Define protectedRoutes array with ['/api/auth/logout', '/api/users/me']
   - Check if request URL matches protected route
   - Verify user authentication with supabase.auth.getUser()
   - Return 401 if authentication fails
3. Ensure middleware returns next() for non-protected routes

### Step 11: Testing & Validation

**Manual Testing Checklist:**

1. **POST /api/auth/register**
   - [ ] Test successful registration with valid email and password
   - [ ] Verify profile is created with empty ingredients_to_avoid
   - [ ] Test duplicate email returns 409
   - [ ] Test invalid email format returns 400
   - [ ] Test password < 6 characters returns 400
   - [ ] Test missing fields return appropriate 400 errors

2. **POST /api/auth/login**
   - [ ] Test successful login with correct credentials
   - [ ] Test invalid credentials return 401
   - [ ] Test missing fields return 400
   - [ ] Verify session tokens are returned

3. **POST /api/auth/logout**
   - [ ] Test successful logout with valid token
   - [ ] Test logout without token returns 401
   - [ ] Test logout with invalid token returns 401

4. **DELETE /api/users/me**
   - [ ] Test successful account deletion
   - [ ] Verify profile is deleted (cascade)
   - [ ] Verify recipes are deleted (cascade)
   - [ ] Test deletion without token returns 401
   - [ ] Test deletion with invalid token returns 401

**Integration Testing:**
- Create automated tests using your preferred testing framework
- Test complete user lifecycle: register → login → create recipe → delete account
- Verify cascade deletes work correctly
- Test error scenarios with mocked Supabase responses

**Security Testing:**
- Attempt SQL injection in email/password fields
- Test rate limiting (if implemented)
- Verify passwords are never logged or exposed
- Test CORS restrictions
- Verify JWT token validation
