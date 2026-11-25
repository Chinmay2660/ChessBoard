import type { Metadata } from 'next';
import '../styles/tailwind.css';

export const metadata: Metadata = {
  title: '3D Chess',
  description: 'Play chess on a 3D board built with Next.js and Three.js',
};

// Applies the saved (or system) colour mode before first paint to avoid a flash
const themeScript = `(function(){try{var m=localStorage.getItem('chess3d:mode');if(!m){m=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.classList.toggle('dark',m==='dark')}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before hydration */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
