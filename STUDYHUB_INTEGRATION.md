# StudyHub Integration Guide

## Route Access

The converted StudyHub app is now available at:
```
http://localhost:5173/uni-doc
```

## How It Works

### Before
- Clicking "Uni Doc" in the header opened the `StudyHubPage.jsx` component
- This was a placeholder component

### After
- Clicking "Uni Doc" in the header now routes to `/uni-doc`
- This loads the full converted StudyHub app with all features:
  - 📄 PDF Upload & Analysis
  - 🧠 Quiz Generation & Gameplay
  - 💬 Chat with Document Context
  - 🎙️ Podcast Generation & Playback

## File Structure

```
src/components/StudyHub/
├── App.jsx                          # Main entry point (converted from App.tsx)
├── types.js                         # Type definitions (JSDoc)
├── services/
│   └── geminiService.js            # Google Gemini API service
├── components/
│   ├── FileUpload.jsx              # PDF upload component
│   ├── PDFModal.jsx                # PDF viewer modal
│   ├── Dashboard.jsx               # Mode selection dashboard
│   ├── FileQuickView.jsx           # File info viewer
│   ├── Chat/
│   │   └── ChatInterface.jsx       # Chat component
│   ├── Quiz/
│   │   ├── QuizConfig.jsx          # Quiz settings
│   │   ├── QuizGame.jsx            # Quiz gameplay
│   │   └── QuizReview.jsx          # Quiz results
│   └── Podcast/
│       ├── PodcastConfig.jsx       # Podcast settings
│       └── PodcastPlayer.jsx       # Audio playback
```

## Environment Variables

Add to your `.env` file:
```env
VITE_GEMINI_API_KEY=AIzaSyArJAq_AFQEPfB5mT9Pik713STpcpXmVzg
```

This is already added in the main site's .env.

## Features

### 1. File Upload
- Drag-and-drop PDF support
- Automatic topic extraction using Gemini API

### 2. Quiz System
- AI-generated quizzes based on document content
- Interactive gameplay with timer
- Results review with AI feedback
- Topic progress tracking

### 3. Chat System
- Document-aware chat interface
- Citation references to source pages
- Text-to-speech support
- Session history persistence

### 4. Podcast System
- Customizable audio generation
- Multiple speaker voices
- Transcript synchronization
- Playback speed control

## Routing in Main App

The route is already configured in `src/App.jsx`:

```jsx
import StudyHubApp from "./components/StudyHub/App";

// Inside Routes...
<Route path="/uni-doc" element={<StudyHubApp />} />
```

## Header Navigation

The "Uni Doc" link in the header (both desktop and mobile) navigates to `/uni-doc`:

```jsx
// In AppHeader.jsx or Header.jsx
<Link to="/uni-doc">Uni Doc</Link>
```

## Dependencies

All required dependencies are already installed:
- `@google/genai` - Google Gemini API
- `lucide-react` - Icons
- `react` - React framework
- `react-router-dom` - Routing (already in main app)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Responsive design

## Troubleshooting

### "Module not found" errors
- Ensure all files are created in the correct paths
- Clear node_modules and run `npm install` again

### API errors
- Verify `VITE_GEMINI_API_KEY` is in `.env`
- Check network connectivity

### Dark mode not working
- Clear browser localStorage
- Check browser developer tools Console for errors

## Testing

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173/uni-doc`
3. Upload a PDF file
4. Try each feature (Quiz, Chat, Podcast)
5. Check browser console for any errors

---

**StudyHub is now fully integrated into the main Uni Connect application!**
