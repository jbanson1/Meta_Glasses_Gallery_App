export const metadata = {
  title: 'Confidential Gallery - Meta Glasses API',
  description: 'AR art recognition API for Confidential Gallery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
