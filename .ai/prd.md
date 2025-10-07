# Product Requirements Document (PRD) - SmartMeal

## 1. Product Overview

SmartMeal is a web application designed to provide users with a centralized ecosystem to store, generate, and organize recipes. The core feature is an AI-powered recipe generator that creates unique, personalized meals based on user-provided ingredients and preferences. The application aims to solve the problem of unreliable recipe bookmarks and links by ensuring recipes are always accessible and owned by the user. The Minimum Viable Product (MVP) will focus on core functionalities like AI recipe generation, manual recipe creation, and user account management for a web-only, mobile-responsive platform.

## 2. User Problem

Users often rely on browser bookmarks or saved links to external recipe sites, which frequently become unavailable or outdated. This leads to a scattered and unreliable collection of recipes. SmartMeal provides a centralized ecosystem to store, generate, and organize recipes — ensuring they’re always accessible and truly owned by the user. Powered by AI, it helps turn ideas and available ingredients into unique, personalized meals that match individual taste.

## 3. Functional Requirements

### 3.1 User Account Management

- Users must be able to register for a new account using an email and password.
- Users must be able to log in to their account.
- The system must provide secure user authentication.
- Users must be able to delete their account. Deleting an account will permanently erase all associated user data, including saved recipes and preferences.

### 3.2 User Profile and Preferences

- Users must have a profile page.
- Users can manage a single list of "ingredients to avoid" in their profile. This is the only user preference for the MVP.

### 3.3 AI-Powered Recipe Generation

- The application will use a third-party API (e.g., GPT-4, OpenRouter.ai) for recipe generation.
- Users must enter a minimum of three ingredients to generate a recipe.
- Ingredient input will be a simple tag-based field without autocomplete for the MVP.
- If a user tries to generate a recipe with an ingredient from their "ingredients to avoid" list, a non-blocking warning will appear, allowing them to proceed if they choose.
- The prompt sent to the AI API will include instructions to encourage creative and varied results.
- If the AI generation service is unavailable, a clear, user-friendly error message must be displayed.

### 3.4 Recipe Management

- Users can accept (save) or reject an AI-generated recipe.
- AI-generated recipes cannot be edited before being saved.
- Users can manually create recipes using a structured form.
- The manual creation form will use structured repeater fields for "Ingredients" and "Preparation Steps," allowing for basic text formatting.
- Users can view all their saved recipes (both AI-generated and manual).
- Saved recipes will be displayed in a card-based layout showing the title and ingredients. No images will be included in the MVP.
- Users can view the detailed page of a saved recipe, which presents ingredients and preparation steps clearly.
- Users can edit their manually created recipes.
- Users can delete any of their saved recipes.

### 3.5 Platform and Design

- The application will be web-only for the MVP.
- The application must have a mobile-responsive design from the start.
- The UI will rely on minimalist cues and placeholder text to guide users, with no formal onboarding tutorial.

## 4. Product Boundaries

### 4.1 In Scope for MVP

- User accounts (register, login, delete) with email and password.
- User profile with an "ingredients to avoid" list.
- AI recipe generation from a minimum of three ingredients.
- Manual recipe creation with structured fields.
- Viewing, editing (manual only), and deleting saved recipes.
- Card-based layout for recipe lists.
- Web-only platform with a mobile-responsive design.

### 4.2 Out of Scope for MVP

- Importing recipes in any format (PDF, DOCX, URL, etc.).
- Recipe sharing, rating, or commenting systems.
- Social features (e.g., following users).
- Advanced recipe filtering or searching functionality.
- Native mobile applications (iOS/Android).
- Recipe images.
- Usage limits on AI generation.
- Privacy Policy (as the app is not for public release initially).
- Data export or "copy to clipboard" features.

## 5. User Stories

### 5.1 User Stories (MVP)

_ID_: US-001
_Title_: New User Registration
_Description_: As a new user, I want to create an account using my email and a password so that I can save my recipes and preferences.
_Acceptance Criteria_:

- Given I am on the registration page,
- When I enter a valid email and a password, and confirm the password,
- Then my account is created and I am automatically logged in.
- And I am redirected to the main recipe page.
- The system must validate that the email is not already in use.
- The system must validate that the password fields match.

_ID_: US-002
_Title_: User Login
_Description_: As a registered user, I want to log in to my account so that I can access my saved recipes.
_Acceptance Criteria_:

- Given I am on the login page,
- When I enter my correct email and password,
- Then I am successfully logged in.
- And I am redirected to my recipe list page.
- If I enter incorrect credentials, I should see an error message.

_ID_: US-003
_Title_: User Logout
_Description_: As a logged-in user, I want to be able to log out of my account to ensure my session is secure.
_Acceptance Criteria_:

- Given I am logged in,
- When I click the logout button,
- Then I am logged out of the application.
- And I am redirected to the login page.

_ID_: US-012
_Title_: Create a Manual Recipe
_Description_: As a user, I want to manually enter my own recipes so I can store my personal collection in one place.
_Acceptance Criteria_:

- Given I am on the "Create Recipe" page,
- When I fill in the title, add at least one ingredient, and at least one preparation step,
- Then I can save the recipe.
- The form should have separate, repeatable fields for ingredients and steps.
- When I save the recipe, it is added to my collection.

_ID_: US-013
_Title_: View List of Saved Recipes
_Description_: As a user, I want to see a list of all my saved recipes so I can browse them.
_Acceptance Criteria_:

- Given I am logged in,
- When I navigate to my recipes page,
- Then I see a card-based layout displaying all my saved recipes.
- Each card should show at least the recipe title and ingredients.

_ID_: US-014
_Title_: View a Single Recipe's Details
_Description_: As a user, I want to view the full details of a specific recipe from my list.
_Acceptance Criteria_:

- Given I am viewing my list of saved recipes,
- When I click on a recipe card,
- Then I am taken to a detailed view of that recipe.
- And I can clearly see the title, full list of ingredients, and all preparation steps.

_ID_: US-016
_Title_: Delete a Saved Recipe
_Description_: As a user, I want to delete a recipe I no longer need from my collection.
_Acceptance Criteria_:

- Given I am viewing a recipe (either on the list or detail view),
- When I choose the delete option,
- Then a confirmation prompt is displayed.
- When I confirm, the recipe is permanently removed from my collection.

### 5.2 User Stories (Post-MVP)

_ID_: US-004
_Title_: Manage "Ingredients to Avoid" List
_Description_: As a user, I want to manage a list of ingredients to avoid in my profile so that the application is aware of my dietary restrictions or preferences.
_Acceptance Criteria_:

- Given I am logged in and on my profile page,
- When I add a new ingredient to my "avoid" list,
- Then the ingredient is saved to my profile.
- When I remove an ingredient from my "avoid" list,
- Then the ingredient is removed from my profile.

_ID_: US-005
_Title_: Delete User Account
_Description_: As a user, I want to permanently delete my account and all associated data so that my personal information is removed from the service.
_Acceptance Criteria_:

- Given I am logged in and on my profile page,
- When I choose to delete my account,
- Then I see a confirmation prompt to prevent accidental deletion.
- When I confirm the deletion,
- Then my account and all my data (recipes, preferences) are permanently erased.
- And I am logged out and redirected to the homepage.

_ID_: US-006
_Title_: Generate a Recipe Using AI
_Description_: As a user, I want to enter a list of ingredients I have and get an AI-generated recipe so I can discover new meal ideas.
_Acceptance Criteria_:

- Given I am on the AI recipe generation page,
- When I enter at least three ingredients (e.g., "chicken", "rice", "broccoli") and click "Generate",
- Then the system sends a request to the AI service.
- And a new recipe is displayed with a title, ingredients list, and preparation steps.
- And I see options to "Save" or "Reject" the recipe.

_ID_: US-007
_Title_: Attempt AI Recipe Generation with Insufficient Ingredients
_Description_: As a user, I want to be informed if I try to generate a recipe with too few ingredients so I can correct my input.
_Acceptance Criteria_:

- Given I am on the AI recipe generation page,
- When I enter fewer than three ingredients and click "Generate",
- Then I see a validation message stating that a minimum of three ingredients is required.
- And no request is sent to the AI service.

_ID_: US-008
_Title_: Generate AI Recipe with a Restricted Ingredient
_Description_: As a user, I want to be warned if I use an ingredient from my "ingredients to avoid" list so I can reconsider my choice.
_Acceptance Criteria_:

- Given I have an ingredient in my "avoid" list,
- When I enter that ingredient for AI generation and click "Generate",
- Then a non-blocking warning message is displayed.
- And I can choose to proceed with the generation or cancel it.

_ID_: US-009
_Title_: Save an AI-Generated Recipe
_Description_: As a user, I want to save an AI-generated recipe that I like so I can access it later.
_Acceptance Criteria_:

- Given an AI-generated recipe is displayed,
- When I click the "Save" button,
- Then the recipe is added to my collection of saved recipes.
- And I am redirected to my recipe list or the recipe's detail page.

_ID_: US-010
_Title_: Reject an AI-Generated Recipe
_Description_: As a user, I want to reject an AI-generated recipe that I don't like so that it is not saved to my account.
_Acceptance Criteria_:

- Given an AI-generated recipe is displayed,
- When I click the "Reject" button,
- Then the recipe is discarded.
- And I am returned to the recipe generation page to try again.

_ID_: US-011
_Title_: Handle AI Service Unavailability
_Description_: As a user, I want to be notified if the recipe generation service is down so I know it's a temporary issue.
_Acceptance Criteria_:

- Given the external AI API is unavailable,
- When I attempt to generate a recipe,
- Then a user-friendly error message is displayed, indicating the service is temporarily down.
- And I am not shown a broken page.

_ID_: US-015
_Title_: Edit a Manually Created Recipe
_Description_: As a user, I want to edit a recipe I created manually to correct mistakes or make adjustments.
_Acceptance Criteria_:

- Given I am viewing the details of a manually created recipe,
- When I click the "Edit" button,
- Then I am taken to the recipe creation form, pre-filled with the recipe's data.
- And I can modify the title, ingredients, and preparation steps.
- When I save my changes, the recipe is updated in my collection.
- The "Edit" option is not available for AI-generated recipes.

_ID_: US-017
_Title_: Responsive UI for Mobile Devices
_Description_: As a user, I want to be able to use the application effectively on my mobile phone so I can access my recipes on the go.
_Acceptance Criteria_:

- Given I open the application on a mobile browser,
- Then all pages and features are usable and legible without horizontal scrolling.
- And UI elements like buttons and input fields are easy to tap.

## 6. Success Metrics

- 6.1: 75% of AI-generated recipes are accepted by users.
  - Measurement: This will be measured by tracking the number of "Save Recipe" clicks versus the total number of recipes generated by the AI.
- 6.2: 75% of all created recipes are generated using AI.
  - Measurement: This will be measured by comparing the count of AI-generated recipes to manually created recipes in the database.
- 6.3: No other KPIs will be tracked for the MVP.
