import { createRoot } from 'react-dom/client';
import { AuthPage } from '../../21-react-auth-page/references/AuthPage.template';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
createRoot(root).render(<AuthPage t={(key) => key} login={async () => {
  throw new Error('Fixture only: no backend configured');
}} />);
