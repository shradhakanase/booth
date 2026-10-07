import './globals.css';

export const metadata = {
  title: 'Form 20 Booth Analysis & Election Data Analytics Platform',
  description: 'Comprehensive Form 20 booth-level election analysis, margin trends, candidate performance, and demographic insights across all districts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Plus_Jakarta_Sans',sans-serif] bg-[#f8fafc] text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
