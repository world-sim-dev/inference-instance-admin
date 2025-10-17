# Deployment and Maintenance Guide

## Overview

This guide provides comprehensive instructions for deploying and maintaining the React frontend application with enhanced history interface in various environments. It covers build processes, deployment strategies, monitoring, and maintenance procedures.

## Recent Updates - History Interface Enhancement (v2.1.0)

### New Features
- **Enhanced History Modal**: Improved performance with virtualization for large datasets
- **Advanced Comparison**: Side-by-side version comparison with detailed diff visualization  
- **Smart Caching**: Intelligent caching system for improved performance
- **Mobile Optimization**: Touch-friendly interface with responsive design
- **Real-time Updates**: WebSocket integration for live history updates
- **Export Capabilities**: Multiple export formats (JSON, CSV, PDF)

### Performance Improvements
- **Virtual Scrolling**: Handles 1000+ history records smoothly
- **Request Optimization**: Debounced search and request deduplication
- **Memory Management**: Efficient caching with LRU eviction
- **Bundle Optimization**: Code splitting and lazy loading for faster initial load

### Deployment Considerations
- **Increased Bundle Size**: History components add ~150KB to the bundle
- **Memory Requirements**: Recommend minimum 512MB RAM for optimal performance
- **WebSocket Support**: Ensure WebSocket connections are supported in your deployment environment
- **Cache Configuration**: Configure appropriate cache headers for history data

## Table of Contents

1. [Build Process](#build-process)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Strategies](#deployment-strategies)
4. [Production Optimization](#production-optimization)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Development server will be available at http://localhost:5173
```

### Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Build output will be in the 'dist' directory
```

### Build Configuration

The build process is configured in `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          utils: ['axios', 'dayjs'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### Build Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "build:production": "tsc && vite build --mode production",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Environment Configuration

### Environment Files

Create environment-specific configuration files:

```env
# .env.development
VITE_APP_TITLE=Inference Dashboard (Dev)
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true

# .env.staging
VITE_APP_TITLE=Inference Dashboard (Staging)
VITE_API_BASE_URL=https://api-staging.yourdomain.com
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=info
VITE_ENABLE_DEVTOOLS=false

# .env.production
VITE_APP_TITLE=Inference Dashboard
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false
```

### Environment Variable Validation

```typescript
// src/config/env.ts
interface EnvConfig {
  APP_TITLE: string;
  API_BASE_URL: string;
  ENABLE_MOCK_API: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_DEVTOOLS: boolean;
}

const validateEnv = (): EnvConfig => {
  const requiredVars = ['VITE_API_BASE_URL'];
  
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  return {
    APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Inference Dashboard',
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
    LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
    ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  };
};

export const env = validateEnv();
```

## Deployment Strategies

### 1. Static Hosting (Recommended)

Deploy to static hosting services like Netlify, Vercel, or AWS S3:

#### Netlify Deployment

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Vercel Deployment

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### AWS S3 + CloudFront

```bash
# Build the application
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
```

### 3. CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## Production Optimization

### 1. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
});

# Generate bundle analysis
npm run build
```

### 2. Performance Optimization

```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration}ms`);
  } else {
    fn();
  }
};

// Usage in components
const MyComponent = () => {
  useEffect(() => {
    measurePerformance('component-mount', () => {
      // Component initialization logic
    });
  }, []);
};
```

### 3. Code Splitting

```typescript
// Lazy load components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const InstanceDetails = lazy(() => import('@/pages/InstanceDetails'));

// Route-based code splitting
const AppRoutes = () => (
  <Suspense fallback={<SkeletonLoader type="page" />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/instances/:id" element={<InstanceDetails />} />
    </Routes>
  </Suspense>
);
```

### 4. Asset Optimization

```typescript
// vite.config.ts - Asset optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
  },
});
```

## Monitoring and Logging

### 1. Error Tracking

```typescript
// src/utils/errorTracking.ts
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
}

class ErrorTracker {
  private endpoint = '/api/errors';
  
  track(error: Error, context?: Record<string, any>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context,
    };
    
    // Send to error tracking service
    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(console.error);
  }
}

export const errorTracker = new ErrorTracker();

// Global error handler
window.addEventListener('error', (event) => {
  errorTracker.track(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  errorTracker.track(new Error(event.reason));
});
```

### 2. Performance Monitoring

```typescript
// src/utils/performanceMonitor.ts
class PerformanceMonitor {
  private metrics: Record<string, number[]> = {};
  
  measure(name: string, value: number) {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(value);
  }
  
  getMetrics() {
    const summary: Record<string, any> = {};
    
    for (const [name, values] of Object.entries(this.metrics)) {
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
    
    return summary;
  }
  
  reportMetrics() {
    const metrics = this.getMetrics();
    
    // Send to analytics service
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    }).catch(console.error);
    
    // Clear metrics after reporting
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Report metrics every 5 minutes
setInterval(() => {
  performanceMonitor.reportMetrics();
}, 5 * 60 * 1000);
```

### 3. User Analytics

```typescript
// src/utils/analytics.ts
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private batchSize = 10;
  
  track(event: string, properties?: Record<string, any>) {
    this.events.push({
      event,
      properties,
      timestamp: new Date().toISOString(),
    });
    
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }
  
  private flush() {
    if (this.events.length === 0) return;
    
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: this.events }),
    }).catch(console.error);
    
    this.events = [];
  }
}

export const analytics = new Analytics();

// Track page views
export const trackPageView = (path: string) => {
  analytics.track('page_view', { path });
};

// Track user actions
export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  analytics.track('user_action', { action, ...properties });
};
```

## Maintenance Procedures

### 1. Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

### 2. Health Checks

```typescript
// src/utils/healthCheck.ts
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}

export const performHealthCheck = async (): Promise<HealthStatus> => {
  const checks: Record<string, boolean> = {};
  
  // Check API connectivity
  try {
    await fetch('/api/health', { method: 'HEAD' });
    checks.api = true;
  } catch {
    checks.api = false;
  }
  
  // Check local storage
  try {
    localStorage.setItem('health-check', 'test');
    localStorage.removeItem('health-check');
    checks.localStorage = true;
  } catch {
    checks.localStorage = false;
  }
  
  // Check performance
  checks.performance = performance.now() < 1000;
  
  const allHealthy = Object.values(checks).every(Boolean);
  const someHealthy = Object.values(checks).some(Boolean);
  
  return {
    status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
};
```

### 3. Cache Management

```typescript
// src/utils/cacheManager.ts
class CacheManager {
  private caches = ['api-cache', 'asset-cache'];
  
  async clearAll() {
    for (const cacheName of this.caches) {
      try {
        await caches.delete(cacheName);
        console.log(`Cleared cache: ${cacheName}`);
      } catch (error) {
        console.error(`Failed to clear cache ${cacheName}:`, error);
      }
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
  }
  
  async getSize() {
    let totalSize = 0;
    
    for (const cacheName of this.caches) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      } catch (error) {
        console.error(`Failed to calculate cache size for ${cacheName}:`, error);
      }
    }
    
    return totalSize;
  }
}

export const cacheManager = new CacheManager();
```

### 4. Backup and Recovery

```bash
#!/bin/bash
# backup.sh - Backup deployment artifacts

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup build artifacts
cp -r dist/ $BACKUP_DIR/

# Backup configuration
cp .env.production $BACKUP_DIR/
cp nginx.conf $BACKUP_DIR/

# Create archive
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/

# Upload to backup storage (example: AWS S3)
aws s3 cp $BACKUP_DIR.tar.gz s3://your-backup-bucket/frontend/

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check TypeScript errors
npm run type-check
```

#### 2. Runtime Errors

```typescript
// Debug runtime errors
const debugInfo = {
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString(),
  localStorage: Object.keys(localStorage),
  sessionStorage: Object.keys(sessionStorage),
};

console.log('Debug info:', debugInfo);
```

#### 3. Performance Issues

```typescript
// Performance debugging
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) {
      console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });
```

### Debugging Tools

1. **React Developer Tools**: Browser extension for React debugging
2. **Redux DevTools**: State management debugging (if using Redux)
3. **Network Tab**: Monitor API requests and responses
4. **Performance Tab**: Analyze runtime performance
5. **Lighthouse**: Audit performance, accessibility, and SEO

### Log Analysis

```bash
# Analyze nginx access logs
tail -f /var/log/nginx/access.log | grep "GET /api"

# Monitor error logs
tail -f /var/log/nginx/error.log

# Filter by status code
awk '$9 >= 400' /var/log/nginx/access.log
```

## Security Considerations

### 1. Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com;
  font-src 'self';
">
```

### 2. Environment Variable Security

```typescript
// Never expose sensitive data in environment variables
// Use server-side proxy for sensitive API calls

// Good: Public configuration
const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  appName: import.meta.env.VITE_APP_NAME,
};

// Bad: Sensitive data (never do this)
// const apiKey = import.meta.env.VITE_API_KEY; // ❌
```

### 3. Secure Headers

```nginx
# nginx.conf security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### 4. HTTPS Configuration

```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

## Maintenance Schedule

### Daily
- Monitor error logs
- Check application health
- Review performance metrics

### Weekly
- Update dependencies (patch versions)
- Review security alerts
- Analyze user feedback

### Monthly
- Update dependencies (minor versions)
- Performance audit
- Security scan
- Backup verification

### Quarterly
- Major dependency updates
- Architecture review
- Disaster recovery testing
- Security audit