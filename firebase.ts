import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Populate these via app.config.ts -> extra, or hardcode for quick local testing.
// Never commit real keys to a public repo — Firebase web config isn't a secret
// in the traditional sense (it's designed to be public), but keep it out of
// version control anyway as good hygiene, and lock everything down with
// Firestore Security Rules (see notes at the bottom of this file).
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? "",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? "",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? "",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? "",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? "",
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? "",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// React Native needs an explicit persistence layer, otherwise auth state
// won't survive an app restart.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if it's already been called (e.g. fast refresh) —
  // fall back to the existing instance.
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);

export { app, auth, db };

// ---------------------------------------------------------------------------
// Firestore data model
//   users/{uid}/watchlist/{animeId}   -> { animeId, title, imageUrl, addedAt }
//   users/{uid}/favorites/{animeId}   -> { animeId, title, imageUrl, addedAt }
//   users/{uid}/progress/{animeId}    -> { episodeNumber, positionSeconds, durationSeconds, updatedAt }
// ---------------------------------------------------------------------------

export type WatchlistItem = {
  animeId: string;
  title: string;
  imageUrl?: string;
  addedAt?: unknown;
};

export type WatchProgress = {
  episodeNumber: number;
  positionSeconds: number;
  durationSeconds?: number;
  updatedAt?: unknown;
};

export async function addToWatchlist(uid: string, item: WatchlistItem) {
  const ref = doc(db, "users", uid, "watchlist", item.animeId);
  await setDoc(ref, { ...item, addedAt: serverTimestamp() });
}

export async function removeFromWatchlist(uid: string, animeId: string) {
  const ref = doc(db, "users", uid, "watchlist", animeId);
  await deleteDoc(ref);
}

export async function toggleFavorite(uid: string, item: WatchlistItem, isFavorite: boolean) {
  const ref = doc(db, "users", uid, "favorites", item.animeId);
  if (isFavorite) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { ...item, addedAt: serverTimestamp() });
  }
}

export async function saveWatchProgress(uid: string, animeId: string, progress: WatchProgress) {
  const ref = doc(db, "users", uid, "progress", animeId);
  await setDoc(ref, { ...progress, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getWatchProgress(uid: string, animeId: string) {
  const ref = doc(db, "users", uid, "progress", animeId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as WatchProgress) : null;
}

/**
 * Subscribes to real-time watchlist updates. Returns an unsubscribe function —
 * call it in a useEffect cleanup to avoid leaking listeners.
 */
export function subscribeToWatchlist(uid: string, callback: (items: WatchlistItem[]) => void) {
  const ref = collection(db, "users", uid, "watchlist");
  return onSnapshot(ref, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data() as WatchlistItem));
  });
}

/*
Suggested Firestore Security Rules (Firebase Console > Firestore > Rules):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/
