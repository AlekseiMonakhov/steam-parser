import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useUserStore } from './storage/userStore';
import MainPage from './pages/mainPage/mainPage';
import NotFound from './pages/notFound/notFound';
import Login from './components/auth/login';
import Registration from './components/auth/registration';

const PrivateRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user } = useUserStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{element}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute element={<MainPage />} />} />
      <Route path="/registration" element={<Registration />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
