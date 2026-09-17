import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import ToastContainer from '@/components/ToastContainer';
import { Loader2, CheckSquare } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
          <CheckSquare className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
