import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('accessToken');

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
