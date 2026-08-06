// firebase.js

const firebaseConfig = {
   apiKey: "AIzaSyBVpFTFkAiNXUBpRGMUZ8ksn4jQQpI87HY",
   authDomain: "farmer-ab5fb.firebaseapp.com",
   projectId: "farmer-ab5fb",
   storageBucket: "farmer-ab5fb.firebasestorage.app",
   messagingSenderId: "939758613260",
   appId: "1:939758613260:web:73db460177075580ea4f29",
   measurementId: "G-SNJ6S61PW2"
 };
 
 
 // Firebase Initialize
 firebase.initializeApp(firebaseConfig);
 
 
 // Firestore
 const db = firebase.firestore();
 
 
 // Collection Name
 const LEAVE_COLLECTION = "leaveApplications";