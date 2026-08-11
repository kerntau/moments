import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  html: {
    template: './public/index.html',
    title: 'Moments',
  },
  output: {
    distPath: {
      root: '../backend/public',
    },
    assetPrefix: '/',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:37892',
      '/upload': 'http://localhost:37892',
      '/rss': 'http://localhost:37892',
      '/swagger': 'http://localhost:37892',
    },
  },
});
