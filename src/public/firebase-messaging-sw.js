importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCOtYdDIPwwOObdVaxs1wRijJOswk0UExQ",
  authDomain: "boosteryuk.firebaseapp.com",
  projectId: "boosteryuk",
  storageBucket: "boosteryuk.firebasestorage.app",
  messagingSenderId: "201460734565",
  appId: "1:201460734565:web:30e6d635e60be82dc8448c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico'
  });
});