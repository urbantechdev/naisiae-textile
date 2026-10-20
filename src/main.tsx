import './services/suppressLogs';
import { initImageOptimizer } from './utils/image';

// Install high-performance WebP interceptors before rendering key app assets
initImageOptimizer();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
