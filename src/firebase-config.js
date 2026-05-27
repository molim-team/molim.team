import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";

if (typeof window !== "undefined" && import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);

// يجب تهيئة App Check قبل أي خدمة Firebase أخرى (Auth, Firestore)
// ننشئ Promise ينتظر جاهزية أول توكن حتى لا يفشل أول طلب Firestore
let appCheckReady = Promise.resolve();

if (typeof window !== "undefined") {
  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  // شغّل App Check فقط في production وليس localhost
  if (siteKey && !import.meta.env.DEV) {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    appCheckReady = getToken(appCheck, false)
  .then(() => {
    console.log("✅ App Check جاهز");
  })
  .catch((err) => {
    console.warn("⚠️ App Check فشل، المتابعة على أي حال:", err);
  });
  }
}

export { appCheckReady };
export const auth = getAuth(app);
export const db = getFirestore(app);