// firebaseConfig.js

export const firebaseConfig = {
  // Kunci API untuk otentikasi
  apiKey: "AIzaSyCbZQCYvpgxIi0XHR3_kziDR65uRN_SR34",

  // Domain untuk otentikasi Firebase (misal: halaman login)
  // Perbaikan: Typo 'firebassapp' menjadi 'firebaseapp'
  authDomain: "mahasiswaapp-e791f.firebaseapp.com",

  // URL untuk Realtime Database
  // Perbaikan: Placeholder diganti dengan projectId-mu
  databaseURL: "https://mahasiswaapp-e791f-default-rtdb.firebaseio.com",

  // ID unik untuk proyek Firebase kamu
  // Perbaikan: Dihapus '.fu' di akhir
  projectId: "mahasiswaapp-e791f",

  // Lokasi penyimpanan file (misal: gambar, video)
  // Perbaikan: Menggunakan format standar '.appspot.com'
  storageBucket: "mahasiswaapp-e791f.appspot.com",

  // ID pengirim untuk layanan pesan (FCM)
  messagingSenderId: "61296272751",

  // ID unik untuk aplikasi Android-mu di dalam proyek Firebase
  appId: "1:61296272751:android:4a58a65d9972bb5e58f49a",
};