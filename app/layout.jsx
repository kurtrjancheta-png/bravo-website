import './globals.css';
import { AuthProvider } from './AuthContext';
import LayoutContent from './LayoutContent';

export const metadata = {
  title: 'Bravo Company Board',
  description: 'Digital Bulletin Board System',
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
