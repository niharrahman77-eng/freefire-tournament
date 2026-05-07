// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 min-h-screen">
        <Component {...pageProps} />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#12121A', color: '#fff', border: '1px solid #1E1E2E' },
          success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
