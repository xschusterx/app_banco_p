import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ContactsPage } from './pages/ContactsPage';
import { HistoryPage, ReportDetailPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NewChecklistPage } from './pages/NewChecklistPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="novo" element={<NewChecklistPage />} />
          <Route path="contatos" element={<ContactsPage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="historico/:id" element={<ReportDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
