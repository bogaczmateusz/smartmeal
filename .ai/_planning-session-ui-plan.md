<conversation_summary>
<decisions>

1. The main navigation will be built using shadcn/ui and, for the MVP, will contain a link to "My Recipes" and a user dropdown menu with "Profile" and "Logout" options.
2. React's local component state (useState) will be used to manage the temporary state of an AI-generated recipe before it is saved.
3. A dual strategy for error handling will be implemented: toast notifications for non-critical/server errors and inline messages for form validation errors.
4. The post-registration user flow is defined: after client-side registration, a POST request to /api/profiles will be made, followed by a redirection to the main recipe list page.
5. Protected routes will be handled by a client-side wrapper or HOC.
6. Responsiveness will be achieved using Tailwind's utility variants (e.g., :sm, :md, :lg).
7. The UI will prevent editing of AI-generated recipes only in their temporary pre-save state. All saved recipes (both AI and manual) will have an "Edit" button on their detail page.
8. Visual loading indicators are required for all API calls: skeleton loaders for page-level data and spinners within buttons for component-level actions.
9. Accessibility will be a key consideration, following WCAG principles, including the use of descriptive aria-label attributes and programmatic focus management for dynamic forms.
10. Pagination will be excluded from the MVP.
11. The "My Recipes" page will display an "empty state" component with "Generate with AI" and "Create manually" CTAs when no recipes are present.
12. Prominent "Generate with AI" and "Add Manually" buttons will be placed in the header of the "My Recipes" page.
13. Recipe cards will show the title and a truncated ingredient list, functioning as a single link to the detail page without any action buttons.
14. "Edit" and "Delete" buttons will be located in the header of the recipe detail page. Deletion requires confirmation via a modal.
15. The AI recipe preview will be a read-only view with "Save Recipe" and "Reject Recipe" actions, providing user feedback via toast notifications.
16. Recipe creation/editing forms will use dynamic field arrays for ingredients and preparation steps.
17. The profile page will use a tag-based input component for managing the "ingredients to avoid" list.
18. Navigation will be handled by Astro's file-based routing, with window.location.href used for navigation initiated from within React components.
19. Form validation feedback will be provided onBlur and again on form submission.
20. Data fetching on pages like "My Recipes" will be done client-side within a React component, which initially displays a server-rendered skeleton loader.
21. Unauthenticated users will have access to dedicated Login and Registration pages. A successful login or registration will redirect the user to the "My Recipes" page.

</decisions>
<matched_recommendations>

1. Navigation: The main layout will feature a persistent navigation bar with "My Recipes" and a user dropdown ("Profile", "Logout").
2. State Management: Use React's local component state for the temporary AI-generated recipe to keep global state clean.
3. Error Handling: Implement a standardized approach using toast notifications for non-critical errors and inline messages for form validation.
4. Empty State: The "My Recipes" page should display an "empty state" component with clear CTAs when the user has no recipes.
5. Primary Actions: Place prominent "Generate with AI" and "Add Manually" buttons in the header of the "My Recipes" page for easy access.
6. Recipe Cards: Recipe cards should be clean, displaying only the title and truncated ingredients, and function as a link to the detail view.
7. Detail Page Actions: Position "Edit" and "Delete" actions in the header of the recipe detail page, with deletion protected by a confirmation modal.
8. AI Recipe Flow: The AI generation result should be displayed in a read-only preview with clear "Save" and "Reject" actions.
9. Dynamic Forms: Use field arrays with "Add" and "Remove" controls for managing lists of ingredients and preparation steps.
10. Profile UI: A tag-based input component is recommended for managing the "ingredients to avoid" list.
11. Data Fetching: Use a client-side fetching strategy in React components for dynamic data, showing a server-rendered skeleton loader initially.
12. "Edit Mode" Definition: In-place editing on the detail page itself. Change specific parts of text to specific inputs.

</matched_recommendations>
<ui_architecture_planning_summary>

## Main UI Architecture Requirements

The UI will be built using Astro for the static site structure and React for interactive components ("islands"), styled with Tailwind CSS and utilizing shadcn/ui for pre-built components. Navigation is based on Astro's file-based routing. Data fetching for dynamic, user-specific content will occur on the client-side within React components, with server-rendered skeleton loaders providing an initial placeholder UI.

## Key Views, Screens, and User Flows

- My Recipes Page: The main dashboard for authenticated users. It displays a grid of recipe cards. If the user has no recipes, it shows an empty state with CTAs to "Generate with AI" or "Add Manually". Two prominent buttons in the header provide access to these same creation flows.
- Login & Registration Pages: Unauthenticated users will see pages for login and registration. Upon successful authentication, they will be redirected to the "My Recipes" page.
- Recipe Detail Page: Displays the full details of a selected recipe. The header contains "Edit" and "Delete" actions. The delete action triggers a confirmation modal. "Edit Mode" will allow for in-place editing by converting text elements into form inputs. For ingredients it will be simple input. For preparation_steps it will be a textarea.
- Recipe Creation/Editing Flow: A single-page form will be used for both creating a manual recipe and editing an existing one. The form will feature dynamic field arrays for adding/removing ingredients and preparation steps.
- AI Recipe Generation Flow: The user enters ingredients to get a recipe. The result is displayed in a read-only preview state. The user can then "Save" the recipe (which posts it to /api/recipes and redirects) or "Reject" it (which discards the state and redirects). User feedback is provided via toast notifications.
- Profile Page: Will feature a tag-based input field for users to manage their "ingredients to avoid" list.

## API Integration and State Management
- State Management: The primary strategy is to use local React component state (useState) for transient UI state, such as the AI-generated recipe preview. This avoids the need for a more complex global state manager for the MVP.
- API Integration: Client-side React components will be responsible for all interaction with the REST API. useEffect hooks will trigger data fetching for lists (e.g., GET /api/recipes). User actions like save, update, and delete will call the corresponding API endpoints.
- Loading & Error States: The UI will provide clear feedback for asynchronous operations. Skeleton loaders will be used for page-level data fetching. Action buttons will be disabled and show spinners during processing. API errors will be handled gracefully, with toasts for general issues and inline messages for form validation failures.

## Responsiveness, Accessibility, and Security
- Responsiveness: The UI will be fully responsive, adapting to various screen sizes from mobile to desktop using Tailwind's utility variants.
- Accessibility: The application will adhere to WCAG standards. This includes using descriptive aria-label attributes for controls in dynamic forms and managing focus programmatically to ensure a seamless experience for users of assistive technologies.
- Security: Protected pages and components will be secured using a client-side wrapper that verifies the user's session with the Supabase client.

</ui_architecture_planning_summary>
</conversation_summary>