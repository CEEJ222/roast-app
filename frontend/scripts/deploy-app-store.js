#!/usr/bin/env node

// App Store Deployment Script
// This script handles the deployment process for both iOS and Android app stores

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AppStoreDeployer {
  constructor() {
    this.projectRoot = process.cwd();
    this.iosDir = path.join(this.projectRoot, 'ios');
    this.androidDir = path.join(this.projectRoot, 'android');
  }

  // Main deployment process
  async deploy() {
    console.log('🚀 Starting App Store deployment process...');
    
    try {
      // Step 1: Validate build requirements
      await this.validateRequirements();
      
      // Step 2: Prepare iOS deployment
      await this.prepareIOSDeployment();
      
      // Step 3: Prepare Android deployment
      await this.prepareAndroidDeployment();
      
      // Step 4: Generate deployment checklist
      await this.generateDeploymentChecklist();
      
      console.log('✅ Deployment preparation completed successfully!');
      console.log('📋 Please follow the deployment checklist for manual steps');
      
    } catch (error) {
      console.error('❌ Deployment preparation failed:', error.message);
      process.exit(1);
    }
  }

  // Validate build requirements
  async validateRequirements() {
    console.log('🔍 Validating build requirements...');
    
    // Check if build directories exist
    if (!fs.existsSync(this.iosDir)) {
      throw new Error('iOS build directory not found. Please run build first.');
    }
    
    if (!fs.existsSync(this.androidDir)) {
      throw new Error('Android build directory not found. Please run build first.');
    }
    
    // Check for required files
    const requiredFiles = [
      'capacitor.config.json',
      'package.json'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    
    console.log('   ✅ Build requirements validated');
  }

  // Prepare iOS deployment
  async prepareIOSDeployment() {
    console.log('🍎 Preparing iOS deployment...');
    
    try {
      // Check if Xcode is available
      execSync('xcodebuild -version', { stdio: 'pipe' });
      console.log('   ✅ Xcode is available');
      
      // Generate iOS deployment instructions
      const iosInstructions = this.generateIOSInstructions();
      const iosPath = path.join(this.projectRoot, 'ios-deployment-instructions.md');
      fs.writeFileSync(iosPath, iosInstructions);
      console.log(`   📋 iOS instructions saved to ${iosPath}`);
      
    } catch (error) {
      console.warn(`   ⚠️  iOS deployment warning: ${error.message}`);
      console.log('   📋 Please install Xcode and follow manual iOS deployment steps');
    }
  }

  // Prepare Android deployment
  async prepareAndroidDeployment() {
    console.log('🤖 Preparing Android deployment...');
    
    try {
      // Check if Android SDK is available
      execSync('adb version', { stdio: 'pipe' });
      console.log('   ✅ Android SDK is available');
      
      // Generate Android deployment instructions
      const androidInstructions = this.generateAndroidInstructions();
      const androidPath = path.join(this.projectRoot, 'android-deployment-instructions.md');
      fs.writeFileSync(androidPath, androidInstructions);
      console.log(`   📋 Android instructions saved to ${androidPath}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Android deployment warning: ${error.message}`);
      console.log('   📋 Please install Android SDK and follow manual Android deployment steps');
    }
  }

  // Generate iOS deployment instructions
  generateIOSInstructions() {
    return `# iOS App Store Deployment Instructions

## Prerequisites
- [ ] Apple Developer Account
- [ ] Xcode installed
- [ ] iOS project built successfully

## Step 1: Open iOS Project
\`\`\`bash
npx cap open ios
\`\`\`

## Step 2: Configure App Settings
1. Select the project in Xcode
2. Go to "Signing & Capabilities"
3. Select your development team
4. Enable "Automatically manage signing"
5. Set Bundle Identifier: com.roastbuddy.app

## Step 3: Build and Archive
1. Select "Any iOS Device" as target
2. Go to Product → Archive
3. Wait for archive to complete

## Step 4: Upload to App Store Connect
1. In Xcode Organizer, select your archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload"
5. Follow the upload process

## Step 5: App Store Connect Configuration
1. Go to App Store Connect
2. Create new app listing
3. Upload screenshots and metadata
4. Set pricing and availability
5. Submit for review

## Required Assets
- App icons (all required sizes)
- Screenshots for different device sizes
- App description and keywords
- Privacy policy URL
- Terms of service URL

## App Store Guidelines
- Follow Apple Human Interface Guidelines
- Ensure app provides value to users
- Respect user privacy
- Don't violate App Store guidelines
- Have proper metadata and descriptions
- Include privacy policy URL

## Troubleshooting
- If signing fails, check your Apple Developer Account
- If upload fails, check your internet connection
- If review is rejected, address the feedback and resubmit
`;
  }

  // Generate Android deployment instructions
  generateAndroidInstructions() {
    return `# Android Play Store Deployment Instructions

## Prerequisites
- [ ] Google Play Console Account
- [ ] Android Studio installed
- [ ] Android project built successfully

## Step 1: Generate Signed APK/AAB
\`\`\`bash
npx cap build android
\`\`\`

## Step 2: Open Android Studio
\`\`\`bash
npx cap open android
\`\`\`

## Step 3: Generate Signed Bundle
1. In Android Studio, go to Build → Generate Signed Bundle/APK
2. Select "Android App Bundle"
3. Create new keystore or use existing
4. Fill in keystore details
5. Select release build variant
6. Click "Create"

## Step 4: Upload to Play Console
1. Go to Google Play Console
2. Create new app listing
3. Upload the generated AAB file
4. Fill in app information
5. Upload screenshots and assets
6. Set pricing and distribution
7. Submit for review

## Required Assets
- App icons (all required sizes)
- Screenshots for different device sizes
- Feature graphic (1024x500)
- App description and keywords
- Privacy policy URL

## Play Store Guidelines
- Follow Material Design guidelines
- Target appropriate API level
- Have proper permissions
- Don't violate Play Store policies
- Have complete store listing
- Include privacy policy

## Troubleshooting
- If build fails, check your Android SDK
- If upload fails, check your internet connection
- If review is rejected, address the feedback and resubmit
`;
  }

  // Generate deployment checklist
  async generateDeploymentChecklist() {
    console.log('📋 Generating deployment checklist...');
    
    const checklist = `# App Store Deployment Checklist

## Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security validated
- [ ] App store assets ready
- [ ] Descriptions written
- [ ] Privacy policy complete
- [ ] Terms of service complete

## iOS App Store
- [ ] App follows Apple Human Interface Guidelines
- [ ] App doesn't crash on launch
- [ ] App provides value to users
- [ ] App respects user privacy
- [ ] App doesn't violate App Store guidelines
- [ ] App has proper metadata and descriptions
- [ ] App has appropriate age rating
- [ ] App has privacy policy URL

## Google Play Store
- [ ] App follows Material Design guidelines
- [ ] App targets appropriate API level
- [ ] App has proper permissions
- [ ] App doesn't violate Play Store policies
- [ ] App has complete store listing
- [ ] App has appropriate content rating
- [ ] App has privacy policy

## Post-Deployment
- [ ] Monitor app performance
- [ ] Collect user feedback
- [ ] Plan future updates
- [ ] Set up analytics and monitoring
- [ ] Implement crash reporting
- [ ] Set up user support system

## Success Criteria
- [ ] Apps submitted to both app stores
- [ ] Apps pass app store review
- [ ] Apps are published and available for download
- [ ] Analytics and monitoring are set up
- [ ] User feedback collection is implemented
- [ ] Post-deployment monitoring is active
`;
    
    const checklistPath = path.join(this.projectRoot, 'deployment-checklist.md');
    fs.writeFileSync(checklistPath, checklist);
    console.log(`   📋 Deployment checklist saved to ${checklistPath}`);
  }
}

// Run deployment process
if (require.main === module) {
  const deployer = new AppStoreDeployer();
  deployer.deploy();
}

module.exports = AppStoreDeployer;
