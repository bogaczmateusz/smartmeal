# SmartMeal

A web application to store, generate, and organize recipes, ensuring they’re always accessible and truly owned by the user. Powered by AI, it helps turn ideas and available ingredients into unique, personalized meals that match individual taste.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

The project uses a modern tech stack to deliver a fast, responsive, and intelligent user experience.

- **Frontend**:
  - [Astro 5](https://astro.build/)
  - [React 19](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind 4](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/)
- **Backend**:
  - [Supabase](https://supabase.io/) (PostgreSQL, Authentication, SDKs)
- **AI**:
  - [OpenRouter.ai](https://openrouter.ai/) for access to various large language models.
- **CI/CD & Hosting**:
  - [GitHub Actions](https://github.com/features/actions)
  - [DigitalOcean](https://www.digitalocean.com/) (via Docker)

## Project Structure

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

## Getting Started Locally

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js `v22.14.0`. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
- `npm` package manager.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/bogaczmateusz/smartmeal.git
    cd smartmeal
    ```

2.  **Set up the correct Node.js version:**
    If you are using `nvm`, run the following command in the project root to switch to the correct Node.js version:

    ```sh
    nvm use
    ```

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```sh
    cp .env.example .env
    ```

    You will need to add your credentials for the following services:

    ```env
    # Supabase
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key

    # OpenRouter.ai
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Runs a local server to preview the production build.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats code using Prettier.

## Project Scope

### In Scope (MVP)

- **User Accounts**: Register, login, and delete account.
- **User Profile**: Manage a list of "ingredients to avoid".
- **AI Recipe Generation**: Generate recipes from a minimum of three ingredients.
- **Manual Recipe Creation**: Manually add recipes with structured fields.
- **Recipe Management**: View, edit (manual only), and delete saved recipes.
- **UI**: Card-based layout for recipe lists and a mobile-responsive design.

### Out of Scope (MVP)

- Importing recipes (e.g., from URL, PDF).
- Social features (sharing, rating, commenting).
- Advanced recipe filtering or searching.
- Native mobile applications (iOS/Android).
- Recipe images.
- AI generation usage limits or privacy policy.

## Project Status

This project is currently in the **MVP development phase**.

## License

This project is licensed under the MIT License.
