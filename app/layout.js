import './globals.css';

export const metadata = {
  title: 'Silsilah Keluarga',
  description: 'Pohon silsilah keluarga yang bisa diedit bersama',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
