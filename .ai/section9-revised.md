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
5. Export function

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
6. Export all service functions

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

