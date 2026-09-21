import { createRoot } from 'react-dom/client';

import App from './App';
import { registerServiceWorker } from './lib/push-notifications';

import './index.css';

if (typeof window !== 'undefined' && !('AndroidLocalNotifications' in window)) void registerServiceWorker();
createRoot(document.getElementById('root')!).render(<App />);
