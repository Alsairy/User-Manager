import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, '../attached_assets'),
      '@shared': path.resolve(__dirname, './src/lib'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      }
    }
  },
  build: {
    // Enable source maps for production debugging (optional, set to false to reduce build size)
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React libraries - rarely change, cache well
          'vendor-react': ['react', 'react-dom'],
          // UI component library
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // Data fetching and state management
          'vendor-query': ['@tanstack/react-query'],
          // Form handling
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Routing
          'vendor-router': ['wouter'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // Internationalization
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // Utilities
          'vendor-utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
        },
      },
    },
    // Minify options for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter',
      'date-fns',
      'i18next',
      'react-i18next',
      'lucide-react',
    ],
  },
})
