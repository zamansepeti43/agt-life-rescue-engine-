import { createRoot } from 'react-dom/client';

import App from './App';
import { registerServiceWorker } from './lib/push-notifications';

import './index.css';

registerServiceWorker();
createRoot(document.getElementById('root')!).render(<App />);
