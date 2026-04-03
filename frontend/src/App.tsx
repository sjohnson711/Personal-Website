import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticlePage from "./pages/ArticlePage";
import GatewayPage from "./pages/GatewayPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardPage from "./pages/admin/DashboardPage";
import NewArticlePage from "./pages/admin/NewArticlePage";
import EditArticlePage from "./pages/admin/EditArticlePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/gateway" element={<GatewayPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/articles/new" element={<NewArticlePage />} />
          <Route
            path="/admin/articles/:id/edit"
            element={<EditArticlePage />}
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
