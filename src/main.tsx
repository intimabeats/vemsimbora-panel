import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import App from './App.tsx'
    import './index.css'
    import * as Mapboxgl from 'mapbox-gl' // Import mapbox-gl

    // Set the Mapbox access token globally BEFORE rendering the app
    (Mapboxgl as any).accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
