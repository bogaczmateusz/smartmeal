# UI Architecture for SmartMeal

## 1. UI Structure Overview

The SmartMeal UI should be implemented as a web-only, mobile-responsive application. Use Astro for the static site structure and server-side rendering of initial page shells, and React for interactive “islands” of functionality. The interface should follow a responsive design built with Tailwind CSS and utilize ready-made components from Shadcn/ui for consistency and rapid development.

The architecture is divided into two main areas:
- **Public Area**: Consists of standalone `Login` and `Registration` pages accessible to all users.
- **Authenticated Area**: A single-page application (SPA) experience for logged-in users, protecting all user-specific views like recipe management and profile settings.

Key architectural decisions include:
- **Routing**: Handled by Astro's file-based routing. Navigation from within React components will use standard browser APIs (`window.location.href`).
- **State Management**: Primarily relies on local React component state (`useState`) to manage UI state, including the temporary storage of AI-generated recipes before they are saved. This avoids the complexity of a global state manager for the MVP.
- **Data Fetching**: Occurs on the client-side within React components. Initial page loads will display server-rendered skeleton loaders, which are then replaced by dynamic content fetched from the API.
- **Error Handling**: A dual strategy is employed: non-blocking toast notifications (e.g., using `shadcn/sonner`) for server errors or successful actions, and inline validation messages for form inputs.

## 2. View List

### Registration Page
- **View Path**: `/register`
- **Main Purpose**: To allow new users to create an account.
- **Key Information to Display**: Email input, password input, confirm password input, and a registration button.
- **Key View Components**: `RegistrationForm`, `Header`, `Footer`.
- **UX, Accessibility, and Security**:
  - **UX**: Clear inline validation on input fields (e.g., password mismatch, invalid email format). The "Register" button shows a loading spinner during the API call. Upon success, the user is redirected to the "My Recipes" page.
  - **Accessibility**: All form fields are associated with labels. Focus is managed programmatically.
  - **Security**: This is a public, unauthenticated route.

### Login Page
- **View Path**: `/login`
- **Main Purpose**: To allow existing users to sign in.
- **Key Information to Display**: Email input, password input, and a login button.
- **Key View Components**: `LoginForm`, `Header`, `Footer`.
- **UX, Accessibility, and Security**:
  - **UX**: The "Login" button shows a loading spinner during authentication. Displays a toast notification for incorrect credentials. Upon success, the user is redirected to the "My Recipes" page.
  - **Accessibility**: All form fields are associated with labels.
  - **Security**: This is a public, unauthenticated route.

### My Recipes Page (Dashboard)
- **View Path**: `/app/recipes`
- **Main Purpose**: To display all of a user's saved recipes and serve as the main entry point to the application.
- **Key Information to Display**: A grid of recipe cards. If no recipes exist, an "empty state" message is shown.
- **Key View Components**: `AuthenticatedLayout` (with main navigation), `RecipeCard`, `RecipeGrid`, `EmptyState`.
- **UX, Accessibility, and Security**:
  - **UX**: A skeleton loader is shown while recipes are being fetched. Recipe cards are clickable, leading to the detail view. The header contains prominent "Generate with AI" and "Add Manually" buttons.
  - **Accessibility**: The grid layout is responsive. Each recipe card is a single navigable link.
  - **Security**: This route is protected and requires authentication.

### Recipe Detail Page
- **View Path**: `/app/recipes/:id`
- **Main Purpose**: To display the full details of a single recipe and allow for editing or deletion.
- **Key Information to Display**: Recipe title, a list of ingredients, and numbered preparation steps.
- **Key View Components**: `AuthenticatedLayout`, `RecipeDetailView`, `ConfirmationModal` (for deletion).
- **UX, Accessibility, and Security**:
  - **UX**: A skeleton loader is shown while the recipe is fetched. The header contains "Edit" and "Delete" buttons. Clicking "Edit" enables an in-place editing mode where text fields become input controls. Deletion requires confirmation via a modal.
  - **Accessibility**: Content is structured semantically (headings, lists). All interactive controls have accessible labels.
  - **Security**: This route is protected. The API ensures users can only access their own recipes.

### Create Recipe Page
- **View Path**: `/app/recipes/new`
- **Main Purpose**: To allow users to manually create and save a new recipe.
- **Key Information to Display**: A form with fields for title, a dynamic list of ingredients, and a dynamic list of preparation steps.
- **Key View Components**: `AuthenticatedLayout`, `RecipeForm`.
- **UX, Accessibility, and Security**:
  - **UX**: The form supports dynamically adding and removing ingredient and step fields. The "Save" button is disabled until the form is valid and shows a loading spinner on submission.
  - **Accessibility**: Dynamic form fields are managed with clear "Add" and "Remove" buttons that have accessible labels.
  - **Security**: This route is protected.

### AI Recipe Generator Page
- **View Path**: `/app/recipes/generate`
- **Main Purpose**: To generate a recipe from user-provided ingredients and display a preview.
- **Key Information to Display**: An input field for ingredients (tag-based), and a preview area for the generated recipe.
- **Key View Components**: `AuthenticatedLayout`, `IngredientInput`, `RecipePreview`.
- **UX, Accessibility, and Security**:
  - **UX**: A minimum of three ingredients is required. The "Generate" button shows a loading spinner. The generated recipe is displayed in a read-only preview with "Save" and "Reject" actions. Warnings for avoided ingredients are shown as non-blocking alerts.
  - **Accessibility**: The ingredient input provides clear instructions. The preview content is structured semantically.
  - **Security**: This route is protected.

### Profile Page
- **View Path**: `/app/profile`
- **Main Purpose**: To allow users to manage their preferences.
- **Key Information to Display**: A field for managing the "ingredients to avoid" list.
- **Key View Components**: `AuthenticatedLayout`, `AvoidListInput`.
- **UX, Accessibility, and Security**:
  - **UX**: A tag-based input component allows for easy addition and removal of ingredients. A "Save" button becomes active when changes are made and shows a spinner on submission.
  - **Accessibility**: The tag input is keyboard-navigable.
  - **Security**: This route is protected.

## 3. User Journey Map

### Main Use Case: AI Recipe Generation and Saving
1.  **Login**: User lands on `/login`, enters credentials, and is redirected to `/app/recipes`.
2.  **Navigate to Generator**: From the `/app/recipes` page, the user clicks the "Generate with AI" button in the header, navigating to `/app/recipes/generate`.
3.  **Enter Ingredients**: On the generator page, the user enters at least three ingredients (e.g., "chicken", "rice", "broccoli") into the tag-based input field.
4.  **Generate Recipe**: User clicks the "Generate" button. A loading indicator appears while the API call to `/api/recipes/generate` is in progress.
5.  **Preview Recipe**: The generated recipe (title, ingredients, steps) appears in the preview area on the same page. Any warnings (e.g., for using an ingredient from their "avoid" list) are displayed.
6.  **Save Recipe**: The user likes the recipe and clicks the "Save" button. A loading indicator appears while the client sends the recipe data via a `POST` request to `/api/recipes`.
7.  **Confirmation and Redirect**: A success toast notification appears. The user is redirected to the detail page for the newly created recipe at `/app/recipes/:new_id`, where they can see their saved recipe.

## 4. Layout and Navigation Structure

The application utilizes a primary layout component for all authenticated views.

- **`AuthenticatedLayout`**: This layout contains the main application header and a content area.
  - **Header**: The header is persistent across all authenticated views. It contains:
    - The **SmartMeal Logo**, which links back to the "My Recipes" page (`/app/recipes`).
    - A **User Dropdown Menu** at the top right. This menu provides navigation links to:
      - **Profile** (`/app/profile`)
      - **Logout** (triggers logout action and redirects to `/login`)

Unauthenticated views (`/login`, `/register`) use a simpler layout with a minimal header and footer.

## 5. Key Components

- **`RecipeCard`**: A component used on the "My Recipes" page to display a summary of a recipe (title, truncated ingredients). The entire card acts as a single link to the recipe's detail page.
- **`RecipeForm`**: A reusable form component for creating and editing recipes. It manages dynamic field arrays for ingredients and preparation steps.
- **`IngredientInput`**: A tag-based input component used on the AI Generator page for entering ingredients and on the Profile page for managing the "ingredients to avoid" list.
- **`RecipePreview`**: A read-only component that displays a formatted, AI-generated recipe before it is saved. It includes "Save" and "Reject" action buttons.
- **`ConfirmationModal`**: A dialog component used to confirm destructive actions, such as deleting a recipe. It requires explicit user confirmation before proceeding.
- **`SkeletonLoader`**: A component that mimics the layout of content (e.g., recipe cards, recipe details) to provide a visual placeholder while data is being fetched, improving perceived performance.
- **`EmptyState`**: A component displayed on the "My Recipes" page when the user has no saved recipes. It provides a helpful message and clear call-to-action buttons ("Generate with AI", "Add Manually").
