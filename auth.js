import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Konfigurasi Firebase Proyek Anda (Terkunci)
const firebaseConfig = {
  apiKey: "AIzaSyDLW7h2_pYK5eRA-Fy9aeQzF5t01UdZXjU",
  authDomain: "keuangan-app-f2c87.firebaseapp.com",
  projectId: "keuangan-app-f2c87",
  storageBucket: "keuangan-app-f2c87.firebasestorage.app",
  messagingSenderId: "527746323919",
  appId: "1:527746323919:web:096cebf5babc903b12eeba"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Kunci sesi login agar tertanam di browser lokal (Local Storage)
setPersistence(auth, browserLocalPersistence);

// Logika penanganan Submit Form Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Mencegah browser melakukan refresh halaman otomatis
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorText = document.getElementById('auth-error');
        
        errorText.innerText = ""; 

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                // Sesi Sukses: Simpan tanggal login detik ini ke penyimpanan lokal browser
                localStorage.setItem('login_timestamp', Date.now().toString());
                window.location.href = 'index.html'; 
            })
            .catch(error => { 
                console.error("Firebase Auth Error:", error.code, error.message);
                
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    errorText.innerText = "Email atau kata sandi yang Anda masukkan salah.";
                } else if (error.code === 'auth/invalid-email') {
                    errorText.innerText = "Format penulisan email tidak valid.";
                } else {
                    errorText.innerText = "Gagal masuk. Periksa jaringan internet Anda atau konfigurasi Firebase.";
                }
            });
    });
}

// Sistem Validasi Sesi Maksimal 1 Minggu (7 Hari)
onAuthStateChanged(auth, (user) => {
    const isAuthPage = window.location.pathname.includes('login.html');
    const loginTimestamp = localStorage.getItem('login_timestamp');
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // Hitungan milidetik dalam 1 minggu
    
    const isSessionValid = loginTimestamp && (Date.now() - parseInt(loginTimestamp) < oneWeek);

    if (!isAuthPage && (!user || !isSessionValid)) {
        handleLogout();
    } else if (isAuthPage && user && isSessionValid) {
        window.location.href = 'index.html';
    }
});

function handleLogout() {
    localStorage.removeItem('login_timestamp');
    signOut(auth).then(() => {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    });
}

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
}

export { auth };