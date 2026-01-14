// Firebase 配置檢查工具
export const checkFirebaseConfig = () => {
  // console.log('=== Firebase 配置檢查 ===');
  
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // 檢查每個配置項
  Object.entries(config).forEach(([, value]) => {
    if (!value || value === 'undefined' || value.includes('your_')) {
      // console.error(`未設置或使用預設值`);
    } else {
      // console.log(`${key}: ${value.substring(0, 20)}...`);
    }
  });

  // 特別檢查 Auth Domain
  if (config.authDomain && !config.authDomain.includes('.firebaseapp.com')) {
    // console.warn(`authDomain 格式可能不正確: ${config.authDomain}`);
    // console.warn(`應該是: your-project-id.firebaseapp.com`);
  }

  // console.log('=========================');
  
  return config;
};
