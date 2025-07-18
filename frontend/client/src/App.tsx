import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { InputPage } from '@/pages/InputPage';
import { HistoryPage } from '@/pages/HistoryPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <InputPage />,
      },
      {
        path: '/history',
        element: <HistoryPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
