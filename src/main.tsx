import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/styles/index.less';
import { store } from '@/store';
import { Provider } from 'react-redux';
import AppProvider from '@/AppProvider.tsx';
import { BrowserRouter } from 'react-router-dom';
import { initPermission } from '@/permission';
import { isLogin } from '@/utils/auth.ts';

async function bootstrap() {
  const token = isLogin();

  if (token) {
    await initPermission();
  }
  // await initPermission();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <AppProvider />
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  );
}
bootstrap();
