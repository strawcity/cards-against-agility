# Cards Against Agility

A multiplayer card game based on Cards Against Humanity, themed around Agile/Scrum development practices. Built with SvelteKit and Socket.io.

## Development

### Prerequisites

- Node.js 18+ (required for Vitest and pnpm)
- pnpm package manager

### Setup

1. Install pnpm (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)

### Testing

Run tests:
```bash
pnpm test          # Run all tests
pnpm test:ui       # Run with UI
pnpm test:coverage # Run with coverage report
```

## Building

Build for production:
```bash
pnpm build
```

Preview production build:
```bash
pnpm preview
```

## Deployment

### Fly.io Deployment

This application is configured for deployment on [Fly.io](https://fly.io).

#### Prerequisites

1. Install Fly CLI:
   ```bash
   brew install flyctl
   # or see https://fly.io/docs/getting-started/installing-flyctl/
   ```

2. Login to Fly.io:
   ```bash
   fly auth login
   ```

#### Initial Setup

1. Connect your repository to Fly.io (via Fly.io dashboard)

2. Launch the app (this will create/update `fly.toml`):
   ```bash
   fly launch
   ```
   - Choose an app name
   - Select a region (e.g., `arn` for Stockholm)
   - Don't deploy yet if prompted

3. Set environment variables:
   ```bash
   fly secrets set JWT_SECRET=your-secret-key-here
   ```
   Generate a strong secret key for production!

4. Deploy:
   ```bash
   fly deploy
   ```

#### Monitoring

- View logs: `fly logs`
- Check status: `fly status`
- Open app: `fly open`

#### Configuration

The `fly.toml` file contains:
- Resource allocation: 256MB RAM, 1 shared CPU
- Health check endpoint: `/api/health`
- HTTP service on port 3000

To adjust resources:
```bash
fly scale vm shared-cpu-1x --memory 512
```

## Environment Variables

- `JWT_SECRET` - Secret key for JWT token generation (required)
- `PORT` - Server port (defaults to 3000, auto-set by Fly.io)

## Project Structure

- `src/lib/server/` - Server-side code (game state, Socket.io handlers)
- `src/routes/` - SvelteKit routes and API endpoints
- `src/components/` - Svelte components
- `src/stores/` - Svelte stores for state management
- `server.js` - Server entry point (Socket.io + SvelteKit)

## Tech Stack

- **Frontend**: SvelteKit, TailwindCSS
- **Backend**: SvelteKit (API routes), Socket.io
- **Testing**: Vitest
- **Deployment**: Fly.io
