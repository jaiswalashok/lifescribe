import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Lifescribe',
  description: 'Preserve your life story across generations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
