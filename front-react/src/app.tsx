import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppRouter } from '@/router';
import '@/styles/globals.css';
import '@/styles/simple-markdown.scss';

export const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppRouter />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
};
