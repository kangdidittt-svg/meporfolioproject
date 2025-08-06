// Build Script for Portfolio TypeScript Project
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build configuration
 */
const config = {
  srcDir: './src',
  distDir: './dist',
  publicDir: './',
  minify: true,
  sourceMaps: true,
  watch: process.argv.includes('--watch'),
  serve: process.argv.includes('--serve')
};

/**
 * Utility functions
 */
const utils = {
  /**
   * Log with timestamp
   */
  log: (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  },

  /**
   * Ensure directory exists
   */
  ensureDir: (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      utils.log(`Created directory: ${dir}`, 'info');
    }
  },

  /**
   * Copy file
   */
  copyFile: (src, dest) => {
    const destDir = path.dirname(dest);
    utils.ensureDir(destDir);
    fs.copyFileSync(src, dest);
    utils.log(`Copied: ${src} -> ${dest}`, 'info');
  },

  /**
   * Read file
   */
  readFile: (filePath) => {
    return fs.readFileSync(filePath, 'utf8');
  },

  /**
   * Write file
   */
  writeFile: (filePath, content) => {
    const dir = path.dirname(filePath);
    utils.ensureDir(dir);
    fs.writeFileSync(filePath, content);
    utils.log(`Written: ${filePath}`, 'info');
  },

  /**
   * Get file size in KB
   */
  getFileSize: (filePath) => {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
  },

  /**
   * Execute command
   */
  exec: (command) => {
    try {
      const result = execSync(command, { encoding: 'utf8' });
      return result;
    } catch (error) {
      utils.log(`Command failed: ${command}`, 'error');
      utils.log(error.message, 'error');
      throw error;
    }
  }
};

/**
 * Build tasks
 */
const tasks = {
  /**
   * Clean dist directory
   */
  clean: () => {
    utils.log('🧹 Cleaning dist directory...', 'info');
    if (fs.existsSync(config.distDir)) {
      fs.rmSync(config.distDir, { recursive: true, force: true });
    }
    utils.ensureDir(config.distDir);
    utils.log('✅ Dist directory cleaned', 'success');
  },

  /**
   * Compile TypeScript
   */
  compile: () => {
    utils.log('🔨 Compiling TypeScript...', 'info');
    
    try {
      // Check if TypeScript is available
      utils.exec('npx tsc --version');
      
      // Compile TypeScript
      const tscCommand = config.sourceMaps ? 'npx tsc' : 'npx tsc --sourceMap false';
      utils.exec(tscCommand);
      
      utils.log('✅ TypeScript compilation completed', 'success');
    } catch (error) {
      utils.log('❌ TypeScript compilation failed', 'error');
      throw error;
    }
  },

  /**
   * Minify JavaScript files
   */
  minify: () => {
    if (!config.minify) {
      utils.log('⏭️ Skipping minification', 'info');
      return;
    }

    utils.log('🗜️ Minifying JavaScript files...', 'info');
    
    const jsFiles = [
      path.join(config.distDir, 'script.js'),
      path.join(config.distDir, 'admin-script.js'),
      path.join(config.distDir, 'utils.js')
    ];

    jsFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          const originalSize = utils.getFileSize(filePath);
          
          // Use terser for minification
          const minifiedPath = filePath.replace('.js', '.min.js');
          const terserCommand = `npx terser ${filePath} -o ${minifiedPath} --compress --mangle --source-map`;
          utils.exec(terserCommand);
          
          const minifiedSize = utils.getFileSize(minifiedPath);
          const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
          
          utils.log(`Minified: ${path.basename(filePath)} (${originalSize}KB -> ${minifiedSize}KB, ${savings}% smaller)`, 'success');
        } catch (error) {
          utils.log(`Failed to minify: ${path.basename(filePath)}`, 'warning');
        }
      }
    });
    
    utils.log('✅ Minification completed', 'success');
  },

  /**
   * Update HTML files to use compiled JS
   */
  updateHTML: () => {
    utils.log('📝 Updating HTML files...', 'info');
    
    const htmlFiles = [
      { src: 'index.html', useMinified: config.minify },
      { src: 'admin.html', useMinified: config.minify }
    ];

    htmlFiles.forEach(({ src, useMinified }) => {
      const srcPath = path.join(config.publicDir, src);
      const destPath = path.join(config.distDir, src);
      
      if (fs.existsSync(srcPath)) {
        let content = utils.readFile(srcPath);
        
        // Replace TypeScript imports with compiled JavaScript
        if (src === 'index.html') {
          const scriptTag = useMinified 
            ? '<script src="dist/script.min.js"></script>'
            : '<script src="dist/script.js"></script>';
          
          // Remove any existing script tags and add new one
          content = content.replace(/<script[^>]*src=["'][^"']*script[^"']*["'][^>]*><\/script>/gi, '');
          content = content.replace('</body>', `  ${scriptTag}\n</body>`);
        }
        
        if (src === 'admin.html') {
          const scriptTag = useMinified 
            ? '<script src="dist/admin-script.min.js"></script>'
            : '<script src="dist/admin-script.js"></script>';
          
          // Remove any existing script tags and add new one
          content = content.replace(/<script[^>]*src=["'][^"']*admin-script[^"']*["'][^>]*><\/script>/gi, '');
          content = content.replace('</body>', `  ${scriptTag}\n</body>`);
        }
        
        utils.writeFile(destPath, content);
      }
    });
    
    utils.log('✅ HTML files updated', 'success');
  },

  /**
   * Copy static assets
   */
  copyAssets: () => {
    utils.log('📁 Copying static assets...', 'info');
    
    const assetFiles = [
      'styles.css',
      'admin-styles.css',
      'favicon.ico'
    ];

    assetFiles.forEach(file => {
      const srcPath = path.join(config.publicDir, file);
      const destPath = path.join(config.distDir, file);
      
      if (fs.existsSync(srcPath)) {
        utils.copyFile(srcPath, destPath);
      }
    });
    
    // Copy images directory if exists
    const imagesDir = path.join(config.publicDir, 'images');
    if (fs.existsSync(imagesDir)) {
      const destImagesDir = path.join(config.distDir, 'images');
      utils.exec(`xcopy "${imagesDir}" "${destImagesDir}" /E /I /Y`);
      utils.log('Copied images directory', 'info');
    }
    
    utils.log('✅ Static assets copied', 'success');
  },

  /**
   * Generate service worker
   */
  generateServiceWorker: () => {
    utils.log('⚙️ Generating service worker...', 'info');
    
    const swContent = `
// Service Worker for Portfolio Website
const CACHE_NAME = 'portfolio-v1.0.0';
const urlsToCache = [
  '/',
  '/dist/script.min.js',
  '/dist/admin-script.min.js',
  '/styles.css',
  '/admin-styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
    
    utils.writeFile(path.join(config.distDir, 'sw.js'), swContent.trim());
    utils.log('✅ Service worker generated', 'success');
  },

  /**
   * Optimize CSS
   */
  optimizeCSS: () => {
    utils.log('🎨 Optimizing CSS...', 'info');
    
    const cssFiles = [
      path.join(config.distDir, 'styles.css'),
      path.join(config.distDir, 'admin-styles.css')
    ];

    cssFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        let content = utils.readFile(filePath);
        
        // Basic CSS optimization
        content = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
          .replace(/\s*{\s*/g, '{') // Clean up braces
          .replace(/;\s*/g, ';') // Clean up semicolons
          .trim();
        
        const optimizedPath = filePath.replace('.css', '.min.css');
        utils.writeFile(optimizedPath, content);
        
        const originalSize = utils.getFileSize(filePath);
        const optimizedSize = utils.getFileSize(optimizedPath);
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        utils.log(`Optimized: ${path.basename(filePath)} (${originalSize}KB -> ${optimizedSize}KB, ${savings}% smaller)`, 'success');
      }
    });
    
    utils.log('✅ CSS optimization completed', 'success');
  },

  /**
   * Generate build report
   */
  generateReport: () => {
    utils.log('📊 Generating build report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      config: config,
      files: []
    };

    // Scan dist directory
    const scanDir = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          report.files.push({
            path: relativePath,
            size: utils.getFileSize(fullPath) + 'KB',
            type: path.extname(item).substring(1) || 'unknown'
          });
        }
      });
    };

    if (fs.existsSync(config.distDir)) {
      scanDir(config.distDir);
    }

    const reportPath = path.join(config.distDir, 'build-report.json');
    utils.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Log summary
    const totalFiles = report.files.length;
    const totalSize = report.files.reduce((sum, file) => {
      return sum + parseFloat(file.size.replace('KB', ''));
    }, 0).toFixed(2);
    
    utils.log(`📊 Build Report:`, 'info');
    utils.log(`   Files: ${totalFiles}`, 'info');
    utils.log(`   Total Size: ${totalSize}KB`, 'info');
    utils.log(`   Report saved: ${reportPath}`, 'info');
    
    utils.log('✅ Build report generated', 'success');
  }
};

/**
 * Watch mode
 */
const watch = () => {
  utils.log('👀 Starting watch mode...', 'info');
  
  const chokidar = require('chokidar');
  
  const watcher = chokidar.watch(config.srcDir, {
    ignored: /node_modules/,
    persistent: true
  });

  watcher.on('change', (filePath) => {
    utils.log(`📝 File changed: ${filePath}`, 'info');
    
    try {
      tasks.compile();
      if (config.minify) {
        tasks.minify();
      }
      tasks.updateHTML();
      utils.log('🔄 Rebuild completed', 'success');
    } catch (error) {
      utils.log('❌ Rebuild failed', 'error');
    }
  });

  utils.log('✅ Watch mode started. Press Ctrl+C to stop.', 'success');
};

/**
 * Serve mode
 */
const serve = () => {
  utils.log('🌐 Starting development server...', 'info');
  
  const http = require('http');
  const url = require('url');
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Try dist directory first, then public
    let filePath = path.join(config.distDir, pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(config.publicDir, pathname);
    }
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = mime[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  const port = 3000;
  server.listen(port, () => {
    utils.log(`🚀 Server running at http://localhost:${port}`, 'success');
  });
};

/**
 * Main build function
 */
const build = async () => {
  const startTime = Date.now();
  
  utils.log('🚀 Starting build process...', 'info');
  
  try {
    // Run build tasks
    tasks.clean();
    tasks.compile();
    
    if (config.minify) {
      tasks.minify();
      tasks.optimizeCSS();
    }
    
    tasks.updateHTML();
    tasks.copyAssets();
    tasks.generateServiceWorker();
    tasks.generateReport();
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    utils.log(`🎉 Build completed successfully in ${buildTime}s`, 'success');
    
    // Start watch mode if requested
    if (config.watch) {
      watch();
    }
    
    // Start dev server if requested
    if (config.serve) {
      serve();
    }
    
  } catch (error) {
    utils.log('❌ Build failed', 'error');
    console.error(error);
    process.exit(1);
  }
};

// Run build
if (require.main === module) {
  build();
}

module.exports = { build, tasks, utils };