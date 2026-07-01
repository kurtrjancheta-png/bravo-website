import './globals.css';
import { AuthProvider } from './AuthContext';
import LayoutContent from './LayoutContent';

export const metadata = {
  title: 'Bravo Bulls',
  description: 'Digital Bulletin Board System',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-square.png?v=2',
    apple: '/logo-square.png?v=2',
    shortcut: '/logo-square.png?v=2',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bravo Bulls',
    startupImage: '/logo-square.png?v=2',
  },
};


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
