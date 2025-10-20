#!/usr/bin/env node

// Production Build Script
// This script handles the complete production build process for mobile apps

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionBuilder {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'dist');
    this.iosDir = path.join(this.projectRoot, 'ios');
    this.androidDir = path.join(this.projectRoot, 'android');
  }

  // Main build process
  async build() {
    console.log('🚀 Starting production build process...');
    
    try {
      // Step 1: Clean previous builds
      await this.cleanBuilds();
      
      // Step 2: Install dependencies
      await this.installDependencies();
      
      // Step 3: Build web app
      await this.buildWebApp();
      
      // Step 4: Sync Capacitor
      await this.syncCapacitor();
      
      // Step 5: Build iOS (if on macOS)
      if (process.platform === 'darwin') {
        await this.buildIOS();
      }
      
      // Step 6: Build Android
      await this.buildAndroid();
      
      // Step 7: Generate build report
      await this.generateBuildReport();
      
      console.log('✅ Production build completed successfully!');
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  // Clean previous builds
  async cleanBuilds() {
    console.log('🧹 Cleaning previous builds...');
    
    const dirsToClean = [this.buildDir, this.iosDir, this.androidDir];
    
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`   Removed ${dir}`);
      }
    }
  }

  // Install dependencies
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('   Dependencies installed successfully');
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  // Build web app
  async buildWebApp() {
    console.log('🌐 Building web app...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('   Web app built successfully');
    } catch (error) {
      throw new Error(`Failed to build web app: ${error.message}`);
    }
  }

  // Sync Capacitor
  async syncCapacitor() {
    console.log('🔄 Syncing Capacitor...');
    
    try {
      execSync('npx cap sync', { stdio: 'inherit' });
      console.log('   Capacitor synced successfully');
    } catch (error) {
      throw new Error(`Failed to sync Capacitor: ${error.message}`);
    }
  }

  // Build iOS app
  async buildIOS() {
    console.log('🍎 Building iOS app...');
    
    try {
      // Open iOS project in Xcode for manual build
      execSync('npx cap open ios', { stdio: 'inherit' });
      console.log('   iOS project opened in Xcode');
      console.log('   Please build and archive in Xcode for App Store submission');
    } catch (error) {
      console.warn(`   iOS build warning: ${error.message}`);
    }
  }

  // Build Android app
  async buildAndroid() {
    console.log('🤖 Building Android app...');
    
    try {
      // Build Android project
      execSync('npx cap build android', { stdio: 'inherit' });
      console.log('   Android app built successfully');
    } catch (error) {
      throw new Error(`Failed to build Android app: ${error.message}`);
    }
  }

  // Generate build report
  async generateBuildReport() {
    console.log('📊 Generating build report...');
    
    const report = {
      buildTime: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      buildDir: this.buildDir,
      iosDir: this.iosDir,
      androidDir: this.androidDir,
      buildSize: this.getBuildSize(),
      files: this.getBuildFiles()
    };
    
    const reportPath = path.join(this.projectRoot, 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`   Build report saved to ${reportPath}`);
  }

  // Get build size
  getBuildSize() {
    if (!fs.existsSync(this.buildDir)) {
      return 0;
    }
    
    let totalSize = 0;
    const files = fs.readdirSync(this.buildDir, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(this.buildDir, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    }
    
    return totalSize;
  }

  // Get build files
  getBuildFiles() {
    if (!fs.existsSync(this.buildDir)) {
      return [];
    }
    
    const files = [];
    const scanDir = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        if (fs.statSync(itemPath).isDirectory()) {
          scanDir(itemPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    };
    
    scanDir(this.buildDir);
    return files;
  }
}

// Run build process
if (require.main === module) {
  const builder = new ProductionBuilder();
  builder.build();
}

module.exports = ProductionBuilder;
