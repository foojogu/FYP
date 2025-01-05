// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2BUwMReoEFinav9UChdgks_ybmgQyiVg",
  authDomain: "learning-app-82ff0.firebaseapp.com",
  projectId: "learning-app-82ff0",
  storageBucket: "learning-app-82ff0.firebasestorage.app",
  messagingSenderId: "728726677098",
  appId: "1:728726677098:web:ce7d7804998b62a4a60c13",
  measurementId: "G-T1WZ59J0HT"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();