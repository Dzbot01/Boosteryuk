import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCOtYdDIPwwOObdVaxs1wRijJOswk0UExQ",
  authDomain: "boosteryuk.firebaseapp.com",
  projectId: "boosteryuk",
  storageBucket: "boosteryuk.firebasestorage.app",
  messagingSenderId: "201460734565",
  appId: "1:201460734565:web:30e6d635e60be82dc8448c"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// INI VAPID YANG BENER, JANGAN PAKE YANG e8a355...
const VAPID_KEY = "BJGVzDVRs_0o-japL9BEfNPImnElWo5HBPgYcGsxoZgyGZL5n5VMzlqaIANPWhS3bBi0Nl3YKAKy7z27RXJBaYg";

export const mintaIzinNotif = async () => {
  try {
    console.log("Minta izin... status awal:", Notification.permission);

    const permission = await Notification.requestPermission();
    console.log("Hasil permission:", permission);

    if (permission === 'granted') {
      // WAJIB register SW dulu
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log("SW OK", reg);

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: reg
      });

      if (!token) {
        alert("Gagal dapet token, cek console");
        return null;
      }

      console.log("TOKEN:", token);

      // GANTI JADI save.php BUKAN savetoken.php
      const res = await fetch("https://cekidku.my.id/api/save.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      console.log("Respon save.php:", data);

      alert("Notifikasi aktif!");
      return token;
    } else if (permission === 'denied') {
      alert("Notifikasi diblokir. Klik gembok di address bar > Setelan situs > Izinkan notifikasi");
    } else {
      alert("Izin ditutup");
    }
  } catch (err) {
    console.error("ERROR FCM:", err);
    alert("Error: " + err.message);
  }
}

onMessage(messaging, async (payload) => {
  console.log("Notif foreground masuk:", payload);
  try {
    const title = payload.notification?.title || "Boosteryuk";
    const body = payload.notification?.body || "";
    
    // WAJIB pake SW, bukan new Notification()
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, {
        body: body,
        icon: "/favicon.png",
        badge: "/favicon.png"
      });
    }
  } catch (e) {
    console.log("Skip foreground notif:", e);
  }
});