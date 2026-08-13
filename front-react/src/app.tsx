import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppRouter } from '@/router';
import '@/styles/globals.css';
import '@/styles/simple-markdown.scss';

export const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppRouter />
      <Toaster position="top-center" gap={8} visibleToasts={2} />
    </ThemeProvider>
  );
};
