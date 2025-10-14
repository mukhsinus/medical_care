# Medicare - Medical Supplies Wholesaler

Professional multilingual website for Medicare, a medical supplies wholesaler in Uzbekistan.

## Features

- **Multilingual Support**: Instant language switching between Russian, Uzbek, and English
- **SEO Optimized**: International SEO with hreflang tags, sitemap, and structured data
- **Responsive Design**: Mobile-first approach with beautiful medical-themed UI
- **Static Site**: No backend required, pure client-side application
- **Contact Integration**: Direct links to email, Telegram, and WhatsApp

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6
- **UI Components**: shadcn/ui
- **SEO**: React Helmet Async

## Project Structure

```
src/
├── assets/           # Images and static assets
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   └── SEO.tsx
├── contexts/        # React contexts
│   └── LanguageContext.tsx
├── locales/         # Translation files (en.json, ru.json, uz.json)
├── pages/           # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Catalog.tsx
│   ├── Contacts.tsx
│   ├── Privacy.tsx
│   └── Terms.tsx
└── App.tsx          # Main app component with routing
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd medicare

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory.

## Deployment

### Cloudflare Pages

1. **Connect Repository**: Link your GitHub/GitLab repository to Cloudflare Pages
2. **Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
3. **Deploy**: Cloudflare Pages will automatically build and deploy

### Other Static Hosts

The `dist/` directory can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## Localization

### Adding a New Language

1. Create a new translation file in `src/locales/{locale}.json`
2. Add the locale to the `Locale` type in `src/contexts/LanguageContext.tsx`
3. Import and add the translations to the `translations` object
4. Update the `LanguageSwitcher` component with the new locale
5. Add routes for the new locale in `src/App.tsx`
6. Update `sitemap.xml` with the new locale URLs

### Updating Translations

Edit the respective JSON file in `src/locales/` directory:
- `en.json` - English translations
- `ru.json` - Russian translations
- `uz.json` - Uzbek translations

## Customization

### Design System

The design system is defined in:
- `src/index.css` - CSS variables for colors, gradients, and shadows
- `tailwind.config.ts` - Tailwind configuration

### Contact Information

Update contact details in:
- Translation files (`src/locales/*.json`)
- Contact page component (`src/pages/Contacts.tsx`)
- Footer component (`src/components/Footer.tsx`)

### SEO Configuration

Update meta tags and structured data in:
- `index.html` - Base meta tags
- `src/components/SEO.tsx` - Dynamic SEO component
- `public/sitemap.xml` - Sitemap with all routes

## Performance

The application is optimized for performance:
- Lazy loading of images
- Code splitting by route
- Optimized assets with Vite
- Minimal JavaScript bundle
- Efficient CSS with Tailwind

## License

Copyright © 2025 Medicare. All rights reserved.

## Support

For support, email info@medicare.uz or contact via Telegram.
