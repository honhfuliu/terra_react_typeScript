import { createRoot } from 'react-dom/client';
import '@/assets/styles/index.less';
import { store } from '@/store';
import { Provider } from 'react-redux';
import AppProvider from '@/AppProvider.tsx';
import { initPermission } from '@/permission';
import { isLogin } from '@/utils/auth.ts';

async function bootstrap() {
  const token = isLogin();

  if (token) {
    await initPermission();
  }
  createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
      <AppProvider />
    </Provider>,
  );
}

void bootstrap();
