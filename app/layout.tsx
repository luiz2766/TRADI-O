import type {Metadata} from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EventMaster Pro | Gestão de Eventos',
  description: 'Sistema profissional de gestão de eventos',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-brand-bg text-[#e0e0e0] font-sans selection:bg-amber-500/30 overflow-x-hidden min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#e0e0e0',
                border: '1px solid #242424',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600'
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
