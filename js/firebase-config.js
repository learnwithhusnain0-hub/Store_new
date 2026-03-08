// Firebase Configuration - UK Store
const firebaseConfig = {
    apiKey: "AIzaSyDvpwrivywDoS4KrEKDjJfHvrVLTDHMHJQ",
    authDomain: "ukstore-147e3.firebaseapp.com",
    projectId: "ukstore-147e3",
    storageBucket: "ukstore-147e3.firebasestorage.app",
    messagingSenderId: "682218466479",
    appId: "1:682218466479:web:2cf15486de7a18efb0b85a",
    measurementId: "G-7HKSC1GQNK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Google Auth Provider - YAHAN DEFINE HUA HAI
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Enable analytics
const analytics = firebase.analytics();
