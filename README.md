# Definition Detective

This is a Next.js word puzzle game created with Firebase Studio.

## Features

- **Endless Puzzles**: Procedurally generated levels for a new challenge every time.
- **Definition Scrambler**: Unscramble definitions to guess the hidden word.
- **Smart AI Hints**: Get intelligent hints from a GenAI model that knows which letters you've already tried.
- **Score & Progress Tracking**: Compete on leaderboards and track your stats.
- **User Profiles**: Customize your profile and view your achievements.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Google Generative AI API key:
   ```
   GOOGLE_GENAI_API_KEY=your_actual_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   
   Navigate to [http://localhost:9003](http://localhost:9003) in your browser.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Troubleshooting

### AI Model Errors

If you see errors like "Model not found" or "AI model request failed":

1. Verify your `GOOGLE_GENAI_API_KEY` is set correctly in `.env.local`
2. Make sure the API key is valid and has access to Gemini models
3. Check that you have billing enabled on your Google Cloud project (if required)

The app will automatically try multiple model variants:
- `googleai/gemini-1.5-flash` (fastest, recommended)
- `googleai/gemini-1.5-pro` (more capable)
- `googleai/gemini-pro` (fallback)
