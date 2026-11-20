import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Pages are lazy chunks with hashed file names. After a deploy, a tab opened before it still
// runs the old entry chunk, which asks for page chunks by their old names, and those files
// are gone from the new deployment. Vite reports that failed import as vite:preloadError;
// reloading picks up the new build. The time check stops a reload loop when a chunk is
// missing for some other reason: a second failure within 10 seconds is left to surface.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'ppa:chunk-reload-at';
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return; // without storage there is no loop guard, so do not reload
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
