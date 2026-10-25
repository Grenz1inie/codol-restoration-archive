import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://grenz1inie.github.io',
  base: '/codol-restoration-archive',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
