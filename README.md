# GigDesk

A cross-platform SaaS product for Pakistani freelancers to create, manage, and track e-signed invoices in real time.

## Project Structure

```
GigDesk/
├── src/                    # Next.js 15 Web App
│   ├── app/               # App Router pages
│   ├── lib/               # Utilities (Supabase client)
│   └── components/        # React components
├── extension/             # Chrome Extension (Manifest V3)
├── mobile/                # React Native Expo App
├── desktop/               # Tauri Desktop App
├── supabase/              # Database schema
└── gigdesk-screens-mockup.html  # UI Design Reference
```

## Tech Stack

### Web App
- **Next.js 15** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL, Auth, Realtime)

### Mobile App
- **React Native Expo**
- **Expo Router**
- **Supabase**

### Desktop App
- **Tauri** (Rust + Web)
- **React**
- **Vite**
- **Tailwind CSS**

### Chrome Extension
- **Manifest V3**
- **Vanilla JavaScript**

## Database Schema

The Supabase PostgreSQL database includes:

- **profiles** - User profiles linked to auth.users
- **clients** - Client information per freelancer
- **invoices** - Invoice data with e-signature support

### Key Features
- Row Level Security (RLS) enabled
- Realtime subscriptions on invoices table
- Public invoice access via secure API routes
- Automatic profile creation on signup

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Run the storage setup from `supabase/storage-setup.sql` to create the signatures bucket
4. Navigate to Project Settings > API to get your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Web App Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### 3. Chrome Extension Setup

```bash
cd extension

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

### 4. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

### 5. Desktop App Setup

**Prerequisites:**
- Rust and Cargo installed
- Node.js installed

```bash
cd desktop

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development
npm run tauri dev
```

## Environment Variables

### Web App (.env)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Desktop App (.env)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Features

### Public Invoice Access
Public invoice access is handled server-side via `/api/public-invoice/[token]` using the `SUPABASE_SERVICE_ROLE_KEY` to return only the specific invoice without opening public anonymous RLS access to the whole table.

### Realtime Updates
The invoices table has Supabase Realtime enabled, allowing live status updates without page refresh.

### E-Signature
HTML5 Canvas-based e-signature pad on the public client-facing invoice view.

## UI Design Reference

The `gigdesk-screens-mockup.html` file contains the complete UI design mockup with:
- Landing page
- Login/Signup
- Dashboard with live invoice list
- Create/Edit Invoice
- Invoice Detail with status timeline
- Public Client-Facing View with signature pad
- Settings

Use this file as reference for implementing the UI components.

## Development Workflow

1. **Web App**: Primary development target
2. **Mobile App**: Share business logic with web app
3. **Desktop App**: Wrap web app functionality in Tauri
4. **Chrome Extension**: Quick access to dashboard

## Security Notes

- **Never commit** `.env` files or actual API keys
- Service role key should only be used server-side
- RLS policies ensure users can only access their own data
- Public invoice access is controlled via secure API routes

## License

Proprietary - All rights reserved
