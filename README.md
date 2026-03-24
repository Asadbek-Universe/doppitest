# Doppitest

An educational platform for students in Uzbekistan to prepare for university exams, olympiads, and certifications through interactive tests, video courses, and AI-powered recommendations.

🌐 **Live site:** [doppitest.uz](https://doppitest.uz)

## Tech Stack

- **React** + **TypeScript**
- **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (database, auth)
- **React Query**
- **React Router**

## Getting Started

### Requirements
- Node.js v18+
- npm

### First time setup

```sh
# Clone the repository
git clone https://github.com/Asadbek-Universe/doppitest.git

# Navigate into the project
cd doppitest

# Install dependencies
npm install
```

Create a `.env` file in the root with the following (get values from the team):

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
VITE_SUPER_ADMIN_EMAIL=your-admin-email
```

### Run locally

```sh
npm run dev
```

### Build and deploy

```sh
# Build and deploy to GitHub Pages
npm run build
npm run deploy

# Save changes to main branch
git add .
git commit -m "your message"
git push origin main
```

### Get latest changes from team

```sh
git pull origin main
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level pages
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client and types
├── locales/        # i18n translations (en, ru, uz)
└── lib/            # Utility functions
```