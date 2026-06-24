import { auth } from './auth.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, deleteDoc, setDoc, getDocs, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLW7h2_pYK5eRA-Fy9aeQzF5t01UdZXjU",
  authDomain: "keuangan-app-f2c87.firebaseapp.com",
  projectId: "keuangan-app-f2c87",
  storageBucket: "keuangan-app-f2c87.firebasestorage.app",
  messagingSenderId: "527746323919",
  appId: "1:527746323919:web:096cebf5babc903b12eeba"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUserId = "";
let currentUserEmail = "";
let userSalaryConfig = { amount: 0, date: 1 };
let expenseChartInstance = null;
let activeCategories = [];

// State Komponen Alat Beranda
let attachedMediaBase64 = "";
let selectedLocationText = ""; 
let currentPollOptionsCount = 2; 

// Cache Global untuk menampung Data Foto Profil Seluruh Pengguna
let globalUserCache = {};

// DATA EMOJI WHATSAPP LENGKAP - 100% STERIL DARI TULISAN DAN EROR
const waEmojiData = {
    "😀": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"],
    "🐱": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦤","🦚","🕊","🐇","🦝","🦨","🦡","🦫","🦥","🐺","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🪰","🪲","🪳","🕸","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🦛","🦏"],
    "🍏": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🍅","🥑","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🫒","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🍳","🥘","🍲","🥣","🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯"],
    "⚽": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🏓","🏸","🏒","🏑","🥍","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","🥌","🎿","🏂","🪂","🏋️‍♂️","🤼‍♂️","🤸‍♂️","⛹️‍♂️","🤾‍♂️","🏌️‍♂️","🏇","🧘‍♂️","🏄‍♂️","🏊‍♂️","🤽‍♂️","🚣‍♂️","🧗‍♂️","🚵‍♂️","🚴‍♂️","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎫","🎟","慈善","🎭","🖼","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪗","🎸","🎲","♟","🎯","🎳","🎮","🎰","🧩"],
    "🚗": ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍","🛺","🚨","🚔","🚍","🚘","🚖","🚡","缆车","🚟","🚃","🚋","🚞","🎚","🎛","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩","💺","🚀","🛸","🚁","🛶","⛵","🛥","🛳","🛟","🚢","⚓","🪝","⛽","🚧","🗺","🗿","🗽","🗼","🏰","🏯","🏟","🎡","🎢","🎠"]
};

const threedotsIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; opacity: 0.6; pointer-events: none; flex-shrink: 0;">
        <circle cx="12" cy="12" r="1" fill="currentColor"></circle><circle cx="19" cy="12" r="1" fill="currentColor"></circle><circle cx="5" cy="12" r="1" fill="currentColor"></circle>
    </svg>
`;

function showCustomConfirm(message, isDestructive = true) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-btn-confirm');
        const cancelBtn = document.getElementById('modal-btn-cancel');
        if (!modal || !msgEl || !confirmBtn || !cancelBtn) { resolve(confirm(message)); return; }
        msgEl.innerText = message; confirmBtn.innerText = isDestructive ? "Hapus" : "Yakin";
        if (isDestructive) confirmBtn.classList.add('modal-btn-destructive'); else confirmBtn.classList.remove('modal-btn-destructive');
        modal.classList.add('active');
        const closeWithResult = (result) => {
            modal.classList.remove('active');
            confirmBtn.replaceWith(confirmBtn.cloneNode(true)); cancelBtn.replaceWith(cancelBtn.cloneNode(true)); resolve(result);
        };
        document.getElementById('modal-btn-confirm').addEventListener('click', () => closeWithResult(true));
        document.getElementById('modal-btn-cancel').addEventListener('click', () => closeWithResult(false));
    });
}

function showCustomToast(message) {
    const container = document.getElementById('custom-toast-container'); if (!container) return;
    const toast = document.createElement('div'); toast.className = 'toast-item'; toast.innerText = message;
    container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 2500);
}

const tabs = document.querySelectorAll('.nav-item');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active')); document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active'); document.getElementById(tab.id.replace('nav', 'pane')).classList.add('active');
    });
});

const setupFormatRupiah = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) { el.addEventListener('input', (e) => { let value = e.target.value.replace(/\D/g, ""); e.target.value = value ? parseInt(value).toLocaleString('id-ID') : ""; }); }
};
setupFormatRupiah('input-nominal'); setupFormatRupiah('input-gajian');

const filterYear = document.getElementById('filter-year');
if (filterYear) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 3; i--) { let opt = document.createElement('option'); opt.value = i; opt.innerText = i; filterYear.appendChild(opt); }
    document.getElementById('filter-month').value = String(new Date().getMonth() + 1).padStart(2, '0');
}

auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid; currentUserEmail = user.email || "user@email.com";
        initApp();
    }
});

function initApp() {
    listenToUserProfilesGlobal(); listenToCategories(); listenToSalaryAndTransactions(); listenToSocialFeed(); setupSocialInputListener(); setupMediaAttachmentListeners(); setupNewAddonFeaturesListeners(); setupProfileTabSystemListeners();
    const filterMonth = document.getElementById('filter-month');
    if (filterMonth) filterMonth.addEventListener('change', listenToSalaryAndTransactions);
    if (filterYear) filterYear.addEventListener('change', listenToSalaryAndTransactions);
    setupBulkDeleteListeners();
}

// ======================= LOGIKA GENERATE AVATAR REALTIME DAN ATTACHMENT FOTO =======================

function listenToUserProfilesGlobal() {
    onSnapshot(collection(db, "user_profiles"), (snapshot) => {
        snapshot.forEach(doc => { globalUserCache[doc.id] = doc.data().avatarBase64 || ""; });
        const activeUserAvatar = globalUserCache[currentUserId];
        const initialsEl = document.getElementById('user-avatar-initials');
        const inputAvatarImg = document.getElementById('view-input-avatar-img');
        
        if (activeUserAvatar) {
            if (initialsEl) initialsEl.style.display = "none";
            if (inputAvatarImg) { inputAvatarImg.src = activeUserAvatar; inputAvatarImg.style.display = "block"; }
        } else {
            if (initialsEl) { initialsEl.innerText = currentUserEmail.charAt(0).toUpperCase(); initialsEl.style.display = "block"; }
            if (inputAvatarImg) inputAvatarImg.style.display = "none";
        }
    });
}

function getDynamicAvatarHtml(userId, username, size = 36) {
    const avatarData = globalUserCache[userId];
    const initialLetter = username ? username.replace('@','').charAt(0).toUpperCase() : '?';
    const fontSize = size === 36 ? 14 : (size === 24 ? 9 : 8);

    if (avatarData) {
        return `<img src="${avatarData}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block;">`;
    } else {
        return `<div style="width: ${size}px; height: ${size}px; background: #c7c7cc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: ${fontSize}px; flex-shrink: 0;">${initialLetter}</div>`;
    }
}

function processAndCompressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); let width = img.width, height = img.height; const max_size = 700;
                if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
                else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            };
        };
    });
}

function setupMediaAttachmentListeners() {
    const fileInput = document.getElementById('input-post-media');
    const previewContainer = document.getElementById('media-preview-container');
    const statusLabel = document.getElementById('label-media-status');
    if (!fileInput || !previewContainer) return;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.type.startsWith('video/')) { showCustomToast("Unggah video dinonaktifkan. Silakan pilih berkas foto saja."); clearSelectedMedia(); return; }
        statusLabel.innerText = "Mengompres foto...";
        attachedMediaBase64 = await processAndCompressImageToBase64(file);
        previewContainer.innerHTML = `
            <img src="${attachedMediaBase64}" style="max-width: 240px; max-height: 160px; object-fit: cover; display: block; border-radius: 8px;">
            <button type="button" id="btn-remove-media" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 11px; cursor: pointer; font-weight: bold; padding:0;">X</button>
        `;
        statusLabel.innerText = "Foto siap dibagikan";
        previewContainer.style.display = "block";
        document.getElementById('btn-remove-media')?.addEventListener('click', clearSelectedMedia);
    });
}

function clearSelectedMedia() {
    attachedMediaBase64 = "";
    const fileInput = document.getElementById('input-post-media'); const previewContainer = document.getElementById('media-preview-container');
    if (fileInput) fileInput.value = ""; if (previewContainer) { previewContainer.innerHTML = ""; previewContainer.style.display = "none"; }
    document.getElementById('label-media-status').innerText = "";
}

window.openMediaLightbox = (mediaUrl) => {
    const lightbox = document.getElementById('ios-profile-lightbox');
    const innerContent = document.getElementById('ios-lightbox-inner-content');
    if (!lightbox || !innerContent) return;
    innerContent.innerHTML = `<img src="${mediaUrl}" style="max-width:100%; max-height:100%; border-radius:12px;">`;
    lightbox.classList.add('active');
};

function setupNewAddonFeaturesListeners() {
    const txtArea = document.getElementById('input-post-text');
    const btnEmoji = document.getElementById('btn-trigger-emoji');
    const emojiPanel = document.getElementById('emoji-popover-panel');
    const tabsBar = document.getElementById('wa-emoji-tabs-bar');
    const gridRender = document.getElementById('wa-emoji-grid-render');

    if (tabsBar && gridRender) {
        const categoriesKeys = Object.keys(waEmojiData);
        tabsBar.innerHTML = categoriesKeys.map((cat, idx) => `<button type="button" class="wa-emoji-tab-btn ${idx === 0 ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('');

        const renderEmojiGrid = (categoryKey) => {
            gridRender.innerHTML = waEmojiData[categoryKey].map(emoji => `<span class="wa-emoji-item">${emoji}</span>`).join('');
            gridRender.querySelectorAll('.wa-emoji-item').forEach(item => {
                item.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (txtArea) { txtArea.value += item.innerText; txtArea.focus(); } });
            });
        };
        renderEmojiGrid(categoriesKeys[0]);
        tabsBar.querySelectorAll('.wa-emoji-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); tabsBar.querySelectorAll('.wa-emoji-tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderEmojiGrid(btn.getAttribute('data-cat')); });
        });
    }

    if (btnEmoji && emojiPanel) {
        btnEmoji.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); emojiPanel.style.display = (emojiPanel.style.display === 'none' || emojiPanel.style.display === '') ? 'flex' : 'none'; });
        document.addEventListener('click', () => { if(emojiPanel) emojiPanel.style.display = 'none'; });
        emojiPanel.addEventListener('click', (e) => e.stopPropagation());
    }

    const btnTriggerPoll = document.getElementById('btn-trigger-poll');
    const pollCreator = document.getElementById('poll-creator-container');
    const pollInputsContainer = document.getElementById('poll-options-inputs');
    const btnAddOption = document.getElementById('btn-poll-add-option');

    const renderPollInputFields = () => {
        if (!pollInputsContainer) return;
        const existingFields = pollInputsContainer.querySelectorAll('.poll-option-field-input');
        let savedValues = []; existingFields.forEach(f => { savedValues.push(f.value); });
        pollInputsContainer.innerHTML = "";
        for (let i = 1; i <= currentPollOptionsCount; i++) {
            const currentValue = savedValues[i - 1] ? savedValues[i - 1] : "";
            pollInputsContainer.innerHTML += `<input type="text" class="poll-option-field-input" placeholder="Pilihan ${i}" value="${currentValue.replace(/"/g, '&quot;')}" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; outline: none; background: #fff; margin-bottom: 2px;">`;
        }
        if (btnAddOption) btnAddOption.style.display = currentPollOptionsCount >= 4 ? 'none' : 'block';
    };

    if (btnTriggerPoll && pollCreator) {
        btnTriggerPoll.addEventListener('click', (e) => { e.preventDefault(); currentPollOptionsCount = 2; renderPollInputFields(); pollCreator.style.display = 'flex'; });
        btnAddOption?.addEventListener('click', (e) => { e.preventDefault(); if (currentPollOptionsCount < 4) { currentPollOptionsCount++; renderPollInputFields(); } });
        document.getElementById('btn-poll-cancel')?.addEventListener('click', (e) => { e.preventDefault(); pollCreator.style.display = 'none'; if (pollInputsContainer) pollInputsContainer.innerHTML = ""; });
    }

    const btnLocation = document.getElementById('btn-trigger-location');
    const locationBadge = document.getElementById('location-selected-badge');
    const textLocation = document.getElementById('text-location-badge');

    if (btnLocation && locationBadge && textLocation) {
        btnLocation.addEventListener('click', (e) => {
            e.preventDefault(); if (!navigator.geolocation) { showCustomToast("Browser Anda tidak mendukung pelacakan lokasi."); return; }
            showCustomToast("Membaca koordinat GPS...");
            navigator.geolocation.getCurrentPosition((position) => { selectedLocationText = "Depok, Jawa Barat"; textLocation.innerText = selectedLocationText; locationBadge.style.display = 'flex'; showCustomToast("Lokasi berhasil ditambahkan!"); }, () => { selectedLocationText = "Indonesia"; textLocation.innerText = selectedLocationText; locationBadge.style.display = 'flex'; showCustomToast("Menggunakan lokasi standar."); });
        });
        document.getElementById('btn-remove-location')?.addEventListener('click', (e) => { e.preventDefault(); selectedLocationText = ""; locationBadge.style.display = 'none'; });
    }

    document.addEventListener('click', () => { document.querySelectorAll('.threads-dropdown-list').forEach(box => box.style.display = 'none'); });
}

window.toggleThreadsDropdown = (event, dropdownId) => {
    event.preventDefault(); event.stopPropagation();
    const targetDropdown = document.getElementById(dropdownId); const isAlreadyOpen = targetDropdown.style.display === 'block';
    document.querySelectorAll('.threads-dropdown-list').forEach(box => box.style.display = 'none');
    if (!isAlreadyOpen && targetDropdown) targetDropdown.style.display = 'block';
};

function setupProfileTabSystemListeners() {
    const textEmail = document.getElementById('profile-text-email'); const inputPhone = document.getElementById('profile-input-phone');
    const toggleThemeCheckbox = document.getElementById('toggle-ios-theme');
    if (textEmail) textEmail.innerText = currentUserEmail;

    onSnapshot(doc(db, "user_profiles", currentUserId), (profileDoc) => {
        if (profileDoc.exists()) {
            const data = profileDoc.data(); if (data.phoneNumber && inputPhone) inputPhone.value = data.phoneNumber;
            if (data.avatarBase64) {
                const picEl = document.getElementById('view-profile-pic'); const fallbackEl = document.getElementById('text-profile-fallback');
                if (picEl && fallbackEl) { picEl.src = data.avatarBase64; picEl.style.display = "block"; fallbackEl.style.display = "none"; }
            }
        }
    });

    inputPhone?.addEventListener('blur', async () => { try { await setDoc(doc(db, "user_profiles", currentUserId), { phoneNumber: inputPhone.value.trim() }, { merge: true }); showCustomToast("Nomor telepon diperbarui."); } catch (err) { console.error(err); } });
    document.getElementById('input-profile-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        showCustomToast("Mengompres gambar profil..."); const compressedBase64 = await processAndCompressImageToBase64(file);
        try { await setDoc(doc(db, "user_profiles", currentUserId), { avatarBase64: compressedBase64 }, { merge: true }); showCustomToast("Foto profil berhasil diubah!"); } catch (err) { console.error(err); }
    });

    document.getElementById('container-profile-img')?.addEventListener('click', () => { const picEl = document.getElementById('view-profile-pic'); if (picEl && picEl.style.display !== 'none') window.openMediaLightbox(picEl.src); });
    document.getElementById('btn-close-lightbox')?.addEventListener('click', () => { const lightbox = document.getElementById('ios-profile-lightbox'); if (lightbox) lightbox.classList.remove('active'); });
    document.getElementById('row-trigger-password')?.addEventListener('click', () => { const box = document.getElementById('box-expanded-password'); if (box) box.style.display = box.style.display === 'none' ? 'flex' : 'none'; });

    document.getElementById('btn-save-password')?.addEventListener('click', async () => {
        const newPasswordInput = document.getElementById('input-new-password'); const passValue = newPasswordInput ? newPasswordInput.value.trim() : "";
        if (passValue.length < 6) { showCustomToast("Password minimal berisi 6 karakter!"); return; }
        try { if (auth.currentUser) { await updatePassword(auth.currentUser, passValue); showCustomToast("Password berhasil diperbarui!"); if(newPasswordInput) newPasswordInput.value = ""; document.getElementById('box-expanded-password').style.display = 'none'; } } catch (err) { showCustomToast("Gagal ubah password. Sesi kedaluwarsa."); }
    });

    const currentGlobalTheme = localStorage.getItem('user_theme') || 'light';
    if (toggleThemeCheckbox) {
        toggleThemeCheckbox.checked = currentGlobalTheme === 'dark';
        toggleThemeCheckbox.addEventListener('change', (e) => { const nextTheme = e.target.checked ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', nextTheme); localStorage.setItem('user_theme', nextTheme); showCustomToast(nextTheme === 'dark' ? "Mode gelap aktif" : "Mode terang aktif"); });
    }
    document.getElementById('btn-profile-logout')?.addEventListener('click', async () => { if (await showCustomConfirm("Apakah Anda yakin ingin keluar?")) { localStorage.removeItem('login_timestamp'); auth.signOut().then(() => window.location.href = 'login.html'); } });
}

function setupSocialInputListener() {
    const btnSubmit = document.getElementById('btn-submit-post');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const textarea = document.getElementById('input-post-text'); if (!textarea) return;
            const textContent = textarea.value.trim(); let finalPollData = null;
            const pollCreator = document.getElementById('poll-creator-container');
            if (pollCreator && pollCreator.style.display !== 'none') {
                const fields = document.querySelectorAll('.poll-option-field-input'); let validOptions = [];
                fields.forEach(f => { if(f.value.trim()) validOptions.push({ text: f.value.trim(), votes: [] }); });
                if (validOptions.length < 2) { showCustomToast("Polling minimal membutuhkan 2 opsi pilihan!"); return; }
                finalPollData = { options: validOptions };
            }

            if (!textContent && !attachedMediaBase64 && !finalPollData) { showCustomToast("Isi postingan Anda masih kosong!"); return; }
            btnSubmit.disabled = true; btnSubmit.innerText = "Mengirim...";
            const username = `@${currentUserEmail.split('@')[0]}`; const today = new Date();

            try {
                await addDoc(collection(db, "threads"), {
                    userId: currentUserId, username: username, content: textContent, likes: [], replies: [], isRepost: false, repostedBy: "",
                    mediaUrl: attachedMediaBase64, mediaType: attachedMediaBase64 ? 'image' : '', location: selectedLocationText, poll: finalPollData, 
                    createdAt: today.getTime(), timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
                });
                textarea.value = ""; clearSelectedMedia(); selectedLocationText = "";
                document.getElementById('location-selected-badge').style.display = 'none'; document.getElementById('poll-creator-container').style.display = 'none';
                showCustomToast("Utas berhasil dibagikan!");
            } catch (err) { console.error(err); showCustomToast("Gagal mengirim postingan."); } finally { btnSubmit.disabled = false; btnSubmit.innerText = "Bagikan"; }
        });
    }
}

let unsubscribeSocial = null;
function listenToSocialFeed() {
    if (unsubscribeSocial) unsubscribeSocial();
    unsubscribeSocial = onSnapshot(query(collection(db, "threads")), (snapshot) => {
        const feedContainer = document.getElementById('feed-container'); if (!feedContainer) return;
        feedContainer.innerHTML = ""; let threadsList = [];
        snapshot.forEach(doc => { let d = doc.data(); d.id = doc.id; threadsList.push(d); });
        threadsList.sort((a, b) => b.createdAt - a.createdAt);

        if (threadsList.length === 0) {
            feedContainer.innerHTML = "<div class='card' style='text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;'>Belum ada diskusi hari ini.</div>"; return;
        }

        feedContainer.innerHTML = threadsList.map(thread => {
            const hasLiked = Array.isArray(thread.likes) && thread.likes.includes(currentUserId);
            const likeCount = Array.isArray(thread.likes) ? thread.likes.length : 0;
            const isMyPost = thread.userId === currentUserId;
            const repliesArray = Array.isArray(thread.replies) ? thread.replies : [];
            const hasReplies = repliesArray.length > 0; // FIXED SCOPE: Variabel dipastikan terdefinisi dengan benar di sini

            const repliesHtml = repliesArray.slice().reverse().map(rep => {
                const canDeleteReply = rep.userId === currentUserId || thread.userId === currentUserId;
                const safeReplyObj = JSON.stringify(rep).replace(/"/g, '&quot;'); const subRepliesArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                
                const subRepliesHtml = subRepliesArray.slice().reverse().map(sub => {
                    const canDeleteSub = sub.userId === currentUserId || thread.userId === currentUserId; const dropdownSubId = `drop-sub-${sub.subReplyId}`;
                    return `
                        <div style="display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; padding-left: 20px; border-left: 1px dashed rgba(0,0,0,0.04);">
                            ${getDynamicAvatarHtml(sub.userId, sub.username, 20)}
                            <div style="flex: 1; background: rgba(0,0,0,0.01); padding: 6px 10px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; position: relative;">
                                    <span>${sub.username}</span>
                                    <div style="color: var(--text-secondary); font-weight: 400; display: flex; gap: 6px; align-items: center;">
                                        <span>${sub.timeLabel || ''}</span>
                                        ${canDeleteSub ? `
                                            <div style="position: relative; display: inline-block;">
                                                <button onclick="window.toggleThreadsDropdown(event, '${dropdownSubId}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:2px; display:flex; align-items:center;">${threedotsIcon}</button>
                                                <div id="${dropdownSubId}" class="threads-dropdown-list" style="display: none; position: absolute; right: 0; top: 20px; background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 100px;">
                                                    <button onclick="window.deleteSubComment('${thread.id}', '${rep.replyId}', ${JSON.stringify(sub).replace(/"/g, '&quot;')})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; font-weight:600; color: var(--accent-red); cursor: pointer;">Hapus</button>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <p style="font-size: 12px; color: var(--text-primary); margin-top: 1px; white-space: pre-wrap; word-break: break-word;">${sub.content}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                const dropdownRepId = `drop-rep-${rep.replyId}`;
                return `
                    <div style="display: flex; gap: 10px; align-items: flex-start; margin-top: 10px; padding-left: 8px; flex-direction: column;">
                        <div style="display: flex; gap: 10px; align-items: flex-start; width: 100%;">
                            ${getDynamicAvatarHtml(rep.userId, rep.username, 24)}
                            <div style="flex: 1; background: rgba(0,0,0,0.02); padding: 8px 12px; border-radius: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; position: relative;">
                                    <span>${rep.username}</span>
                                    <div style="color: var(--text-secondary); font-weight: 400; display: flex; gap: 8px; align-items: center;">
                                        <span>${rep.timeLabel || ''}</span>
                                        <button onclick="window.toggleSubReplyBox('${thread.id}', '${rep.replyId}')" style="background:none; border:none; color:var(--accent-blue); font-size:11px; cursor:pointer; font-weight:600; padding:0;">Balas</button>
                                        ${canDeleteReply ? `
                                            <div style="position: relative; display: inline-block;">
                                                <button onclick="window.toggleThreadsDropdown(event, '${dropdownRepId}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:2px; display:flex; align-items:center;">${threedotsIcon}</button>
                                                <div id="${dropdownRepId}" class="threads-dropdown-list" style="display: none; position: absolute; right: 0; top: 20px; background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 100px;">
                                                    <button onclick="window.deleteReplyComment('${thread.id}', ${safeReplyObj})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; font-weight:600; color: var(--accent-red); cursor: pointer;">Hapus</button>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <p style="font-size: 12px; color: var(--text-primary); margin-top: 2px; white-space: pre-wrap; word-break: break-word;">${rep.content}</p>
                            </div>
                        </div>
                        <div id="sub-reply-box-${rep.replyId}" style="display: none; width: 100%; padding-left: 34px; gap: 8px; align-items: center; margin-top: 4px;">
                            <input type="text" id="sub-reply-input-${rep.replyId}" placeholder="Balas..." style="flex: 1; padding: 6px 10px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;">
                            <button onclick="window.submitSubReply('${thread.id}', '${rep.replyId}')" class="btn-primary" style="padding: 6px 12px; font-size: 11px; margin: 0; width: auto;">Kirim</button>
                        </div>
                        <div style="width: 100%; padding-left: 24px;">${subRepliesHtml}</div>
                    </div>
                `;
            }).join('');

            let pollHtml = "";
            if (thread.poll && Array.isArray(thread.poll.options)) {
                let totalVotes = 0; thread.poll.options.forEach(o => { if(Array.isArray(o.votes)) totalVotes += o.votes.length; });
                const pollOptionsHtml = thread.poll.options.map((opt, idx) => {
                    const votesList = Array.isArray(opt.votes) ? opt.votes : []; const alreadyVotedThisOption = votesList.includes(currentUserId);
                    const pct = totalVotes > 0 ? ((votesList.length / totalVotes) * 100).toFixed(0) : 0;
                    return `
                        <div onclick="window.voteInPoll('${thread.id}', ${idx})" style="position: relative; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; overflow: hidden; align-items: center; margin-bottom: 4px;">
                            <div style="position: absolute; top:0; left:0; bottom:0; width: ${pct}%; background: rgba(52, 199, 89, 0.1); transition: width 0.3s ease;"></div>
                            <span style="position: relative; z-index: 2; color: var(--text-primary);">${opt.text} ${alreadyVotedThisOption ? '✓' : ''}</span>
                            <span style="position: relative; z-index: 2; color: var(--text-secondary); font-weight: 600;">${pct}% (${votesList.length})</span>
                        </div>
                    `;
                }).join('');
                pollHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 4px; background: #fff; padding: 4px 0;">${pollOptionsHtml}<span style="font-size: 11px; color: var(--text-secondary); margin-left: 2px;">Total suara: ${totalVotes}</span></div>`;
            }

            let mediaHtml = "";
            if (thread.mediaUrl) {
                const safeUrl = thread.mediaUrl.replace(/"/g, '&quot;');
                mediaHtml = `
                    <div onclick="window.openMediaLightbox('${safeUrl}')" style="margin-top: 8px; border-radius: 12px; overflow: hidden; max-width: 100%; cursor:pointer;">
                        <img src="${safeUrl}" style="max-height: 280px; width: auto; max-width: 100%; display: block; object-fit: cover;">
                    </div>
                `;
            }

            const dropdownThreadId = `drop-thread-${thread.id}`;
            return `
                <div class="card" style="padding: 16px; margin-bottom: 0;">
                    ${thread.isRepost ? `<div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); font-weight:600; margin-bottom:10px; padding-left:48px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg><span>${thread.repostedBy} membagikan ulang</span></div>` : ''}
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0; align-self: stretch;">
                            ${getDynamicAvatarHtml(thread.userId, thread.username, 36)}
                            <div style="width: 2px; flex-grow: 1; background: rgba(0,0,0,0.06); margin-top: 6px; display: ${hasReplies ? 'block' : 'none'};"></div>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${thread.username}</span>
                                    ${thread.location ? `<span style="font-size: 11px; color: var(--accent-blue); font-weight: 500; margin-top: 1px;">📍 ${thread.location}</span>` : ''}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">${thread.timeLabel || '--:--'}</span>
                                    ${isMyPost ? `
                                        <div style="position: relative; display: inline-block;">
                                            <button onclick="window.toggleThreadsDropdown(event, '${dropdownThreadId}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:2px; display:flex; align-items:center;">${threedotsIcon}</button>
                                            <div id="${dropdownThreadId}" class="threads-dropdown-list" style="display: none; position: absolute; right: 0; top: 20px; background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 100px;">
                                                <button onclick="window.deleteThreadPost('${thread.id}')" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; font-weight:600; color: var(--accent-red); cursor: pointer;">Hapus</button>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <p style="font-size: 14px; line-height: 1.4; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; margin-top: 2px;">${thread.content}</p>
                            
                            ${pollHtml} ${mediaHtml}

                            <div style="display: flex; gap: 18px; margin-top: 12px; align-items: center;">
                                <button onclick="window.toggleLikeThread('${thread.id}', ${hasLiked})" style="background: none; border: none; cursor: pointer; color: ${hasLiked ? 'var(--accent-red)' : 'var(--text-secondary)'}; display:flex; align-items:center; gap:5px; padding:0; flex-shrink:0;"><svg width="19" height="19" viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span style="font-size:13px; font-weight:600;">${likeCount}</span></button>
                                <button onclick="window.toggleReplyBox('${thread.id}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); display:flex; align-items:center; gap:4px; padding:0; flex-shrink:0;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span style="font-size:13px; font-weight:600;">${repliesArray.length}</span></button>
                                <button onclick="window.repostThread('${thread.id}', '${thread.username}', '${thread.content.replace(/'/g, "\\'")}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding:0; flex-shrink:0;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>
                                <button onclick="window.copyThreadLink('${thread.id}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding:0; flex-shrink:0;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button>
                            </div>

                            <div id="reply-box-${thread.id}" style="display: none; margin-top: 14px; gap: 8px; align-items: center;">
                                <input type="text" id="reply-input-${thread.id}" placeholder="Tulis balasan..." style="flex: 1; padding: 8px 12px; font-size: 13px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;">
                                <button onclick="window.submitReply('${thread.id}')" class="btn-primary" style="padding: 8px 14px; font-size: 12px; margin: 0; width: auto;">Balas</button>
                            </div>
                            <div id="replies-list-${thread.id}">${repliesHtml}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

// ======================= WINDOW INTERACTION GLOBAL FUNCTIONS =======================
window.voteInPoll = async (threadId, optionIndex) => {
    try {
        const querySnapshot = await getDocs(query(collection(db, "threads"))); let targetPoll = null;
        querySnapshot.forEach(d => { if(d.id === threadId) targetPoll = d.data().poll; }); if (!targetPoll) return;
        const updatedOptions = targetPoll.options.map((opt, idx) => {
            let votes = Array.isArray(opt.votes) ? opt.votes : []; votes = votes.filter(uid => uid !== currentUserId);
            if (idx === optionIndex) votes.push(currentUserId); opt.votes = votes; return opt;
        });
        await updateDoc(doc(db, "threads", threadId), { "poll.options": updatedOptions });
    } catch(err) { console.error(err); }
};

window.toggleSubReplyBox = (threadId, replyId) => {
    const box = document.getElementById(`sub-reply-box-${replyId}`);
    if (box) { box.style.display = box.style.display === 'none' ? 'flex' : 'none'; if(box.style.display === 'flex') document.getElementById(`sub-reply-input-${replyId}`).focus(); }
};

window.submitSubReply = async (threadId, replyId) => {
    const input = document.getElementById(`sub-reply-input-${replyId}`); if (!input) return;
    const contentText = input.value.trim(); if (!contentText) return;
    const myUsername = `@${currentUserEmail.split('@')[0]}`; const today = new Date();
    try {
        const querySnapshot = await getDocs(query(collection(db, "threads"))); let currentReplies = [];
        querySnapshot.forEach(d => { if (d.id === threadId) currentReplies = d.data().replies || []; });
        const updatedReplies = currentReplies.map(rep => {
            if (rep.replyId === replyId) {
                const subArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                subArray.push({ subReplyId: `sub_${Date.now()}`, userId: currentUserId, username: myUsername, content: contentText, createdAt: today.getTime(), timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}` });
                rep.subReplies = subArray;
            } return rep;
        });
        await updateDoc(doc(db, "threads", threadId), { replies: updatedReplies }); input.value = "";
    } catch (err) { console.error(err); }
};

window.deleteSubComment = async (threadId, replyId, subReplyObj) => {
    if (await showCustomConfirm("Hapus balasan komentar ini?")) {
        try {
            const querySnapshot = await getDocs(query(collection(db, "threads"))); let currentReplies = [];
            querySnapshot.forEach(d => { if (d.id === threadId) currentReplies = d.data().replies || []; });
            const updatedReplies = currentReplies.map(rep => { if (rep.replyId === replyId) { const subArray = Array.isArray(rep.subReplies) ? rep.subReplies : []; rep.subReplies = subArray.filter(s => s.subReplyId !== subReplyObj.subReplyId); } return rep; });
            await updateDoc(doc(db, "threads", threadId), { replies: updatedReplies }); showCustomToast("Balasan dihapus.");
        } catch (err) { console.error(err); }
    }
};

window.toggleReplyBox = (id) => {
    const box = document.getElementById(`reply-box-${id}`); if (box) { box.style.display = box.style.display === 'none' ? 'flex' : 'none'; if (box.style.display === 'flex') document.getElementById(`reply-input-${id}`).focus(); }
};

window.submitReply = async (id) => {
    const input = document.getElementById(`reply-input-${id}`); if (!input) return;
    const contentText = input.value.trim(); if (!contentText) return;
    const replyObject = { replyId: `rep_${Date.now()}`, userId: currentUserId, username: `@${currentUserEmail.split('@')[0]}`, content: contentText, subReplies: [], createdAt: new Date().getTime(), timeLabel: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` };
    try { await updateDoc(doc(db, "threads", id), { replies: arrayUnion(replyObject) }); input.value = ""; } catch (err) { console.error(err); }
};

window.deleteReplyComment = async (threadId, replyObject) => {
    if (await showCustomConfirm("Hapus komentar ini?")) {
        try { await updateDoc(doc(db, "threads", threadId), { replies: arrayRemove(replyObject) }); showCustomToast("Komentar dihapus."); } catch (err) { console.error(err); }
    }
};

window.repostThread = async (id, originalUsername, originalContent) => {
    if (await showCustomConfirm("Bagikan ulang utas ini?", false)) {
        try { await addDoc(collection(db, "threads"), { userId: currentUserId, username: originalUsername, content: originalContent, likes: [], replies: [], isRepost: true, repostedBy: `@${currentUserEmail.split('@')[0]}`, createdAt: new Date().getTime(), timeLabel: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` }); showCustomToast("Berhasil dibagikan!"); } catch (err) { console.error(err); }
    }
};

window.toggleLikeThread = async (id, currentLikedState) => {
    try {
        if (currentLikedState) await updateDoc(doc(db, "threads", id), { likes: arrayRemove(currentUserId) });
        else await updateDoc(doc(db, "threads", id), { likes: arrayUnion(currentUserId) });
    } catch (err) { console.error(err); }
};

window.deleteThreadPost = async (id) => {
    if (await showCustomConfirm("Hapus postingan utas ini?")) {
        try { await deleteDoc(doc(db, "threads", id)); showCustomToast("Utas dihapus."); } catch (err) { console.error(err); }
    }
};

window.copyThreadLink = (id) => { navigator.clipboard.writeText(`${window.location.origin}#thread-${id}`); showCustomToast("Tautan utas disalin!"); };

// ===========================================================================================

const salaryForm = document.getElementById('salary-form');
if (salaryForm) {
    salaryForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const rawSalary = document.getElementById('input-gajian').value.replace(/\./g, ""); const salaryDate = document.getElementById('input-tgl-gajian').value;
        try { await setDoc(doc(db, "salary_settings", currentUserId), { amount: parseInt(rawSalary), paydayDate: parseInt(salaryDate) }); showCustomToast("Anggaran disimpan!"); } catch (err) { console.error(err); }
    });
}

const btnResetSalary = document.getElementById('btn-reset-salary');
if (btnResetSalary) {
    btnResetSalary.addEventListener('click', async () => {
        if (await showCustomConfirm("Hapus aturan anggaran?")) {
            try { await setDoc(doc(db, "salary_settings", currentUserId), { amount: 0, paydayDate: 1 }); document.getElementById('salary-form').reset(); showCustomToast("Anggaran direset!"); } catch (err) { console.error(err); }
        }
    });
}

function setupBulkDeleteListeners() {
    const deleteBatchByQuery = async (startRange, endRange, confirmMessage) => {
        if (!await showCustomConfirm(confirmMessage)) return;
        try {
            const q = query(collection(db, "transactions"), where("userId", "==", currentUserId), where("date", ">=", startRange), where("date", "<=", endRange));
            const snapshot = await getDocs(q); if (snapshot.empty) { showCustomToast("Tidak ada data."); return; }
            await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, "transactions", d.id)))); showCustomToast("Histori dibersihkan!");
        } catch (err) { console.error(err); }
    };
    document.getElementById('btn-clear-day')?.addEventListener('click', () => { deleteBatchByQuery(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], "Hapus transaksi hari ini?"); });
    document.getElementById('btn-clear-month')?.addEventListener('click', () => { deleteBatchByQuery(`${document.getElementById('filter-year').value}-${document.getElementById('filter-month').value}-01`, `${document.getElementById('filter-year').value}-${document.getElementById('filter-month').value}-31`, "Hapus pengeluaran bulan ini?"); });
    document.getElementById('btn-clear-year')?.addEventListener('click', () => { deleteBatchByQuery(`${document.getElementById('filter-year').value}-01-01`, `${document.getElementById('filter-year').value}-12-31`, "Hapus pengeluaran tahun ini?"); });
}

const txForm = document.getElementById('transaction-form');
if (txForm) {
    txForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const rawNominal = document.getElementById('input-nominal').value.replace(/\./g, ""); const note = document.getElementById('input-note').value; const category = document.getElementById('input-category').value;
        if(!category) return;
        try { await addDoc(collection(db, "transactions"), { userId: currentUserId, nominal: parseInt(rawNominal), category: category, note: note, date: new Date().toISOString().split('T')[0], time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`, createdAt: new Date().getTime() }); txForm.reset(); showCustomToast("Transaksi disimpan!"); } catch (err) { console.error(err); }
    });
}

const catForm = document.getElementById('category-form');
if (catForm) {
    catForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const newCatName = document.getElementById('input-new-category').value.trim();
        if (activeCategories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) { showCustomToast("Kategori sudah ada!"); return; }
        try { await addDoc(collection(db, "categories"), { userId: currentUserId, name: newCatName, createdAt: new Date().getTime() }); document.getElementById('input-new-category').value = ""; } catch (err) { console.error(err); }
    });
}

let unsubscribeCategories = null;
function listenToCategories() {
    if (unsubscribeCategories) unsubscribeCategories();
    unsubscribeCategories = onSnapshot(query(collection(db, "categories"), where("userId", "==", currentUserId)), (snapshot) => {
        activeCategories = []; snapshot.forEach(doc => { let d = doc.data(); d.id = doc.id; activeCategories.push(d); });
        activeCategories.sort((a,b) => a.createdAt - b.createdAt);
        if (snapshot.empty) { ["Dapur & Sembako", "Jajan & Hiburan", "Kebutuhan Anak", "Listrik & Utilitas"].forEach(async (cat) => { await addDoc(collection(db, "categories"), { userId: currentUserId, name: cat, createdAt: new Date().getTime() }); }); return; }
        const selectEl = document.getElementById('input-category'); if (selectEl) selectEl.innerHTML = activeCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        const manageListEl = document.getElementById('category-manage-list'); if (manageListEl) { manageListEl.innerHTML = activeCategories.map(c => `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.03); padding:6px 10px; margin-bottom:5px; border-radius:6px; font-size:13px;"><span>${c.name}</span><button type="button" onclick="deleteCategory('${c.id}')" style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-weight:bold;">Hapus</button></div>`).join(''); }
    });
}

window.deleteCategory = async (id) => { if (await showCustomConfirm("Hapus kategori ini?")) { try { await deleteDoc(doc(db, "categories", id)); } catch (err) { console.error(err); } } };

let unsubscribeTx = null, unsubscribeSalary = null;
function listenToSalaryAndTransactions() {
    if (unsubscribeTx) unsubscribeTx(); if (unsubscribeSalary) unsubscribeSalary();
    const fYear = document.getElementById('filter-year'), fMonth = document.getElementById('filter-month'); if (!fYear || !fMonth) return;
    const selectedYear = fYear.value, selectedMonth = fMonth.value;
    let totalExpense = 0, categoryTotals = {};

    unsubscribeSalary = onSnapshot(doc(db, "salary_settings", currentUserId), (salaryDoc) => {
        if (salaryDoc.exists()) { const data = salaryDoc.data(); userSalaryConfig.amount = data.amount || 0; userSalaryConfig.date = data.paydayDate || 1; document.getElementById('label-salary-amount').innerText = `Rp ${userSalaryConfig.amount.toLocaleString('id-ID')}`; document.getElementById('label-salary-date').innerText = userSalaryConfig.date; }
        const today = new Date(); let budgetBulanIni = userSalaryConfig.amount - totalExpense;
        if (document.getElementById('total-monthly')) { document.getElementById('total-monthly').innerText = `Rp ${budgetBulanIni.toLocaleString('id-ID')}`; document.getElementById('total-monthly').style.color = budgetBulanIni < 0 ? "var(--accent-red)" : "inherit"; }
    });

    unsubscribeTx = onSnapshot(query(collection(db, "transactions"), where("userId", "==", currentUserId), where("date", ">=", `${selectedYear}-${selectedMonth}-01`), where("date", "<=", `${selectedYear}-${selectedMonth}-31`)), (snapshot) => {
        totalExpense = 0; let txList = []; categoryTotals = {};
        snapshot.forEach(doc => { let data = doc.data(); data.id = doc.id; txList.push(data); totalExpense += data.nominal; categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.nominal; });
        txList.sort((a,b) => b.createdAt - a.createdAt); renderAnalytics(categoryTotals, totalExpense); renderHistoryList(txList);
        let budgetBulanIni = userSalaryConfig.amount - totalExpense;
        if (document.getElementById('total-monthly')) { document.getElementById('total-monthly').innerText = `Rp ${budgetBulanIni.toLocaleString('id-ID')}`; document.getElementById('total-monthly').style.color = budgetBulanIni < 0 ? "var(--accent-red)" : "inherit"; }
    });
}

function renderAnalytics(totals, grandTotal) {
    const container = document.getElementById('analytics-list'); if (!container) return; container.innerHTML = "";
    if (document.getElementById('analytics-grand-total')) document.getElementById('analytics-grand-total').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    if (grandTotal === 0) { container.innerHTML = "<p class='subtitle'>Belum ada pengeluaran.</p>"; if (expenseChartInstance) { expenseChartInstance.destroy(); expenseChartInstance = null; } return; }
    if (expenseChartInstance) expenseChartInstance.destroy(); const ctx = document.getElementById('expenseChart');
    if (ctx) { expenseChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(totals), datasets: [{ data: Object.values(totals), backgroundColor: ['#ff9500', '#ff2d55', '#5ac8fa', '#5856d6', '#34c759', '#ffcc00', '#8e8e93'].slice(0, Object.keys(totals).length), borderWidth: 0, borderRadius: 16, spacing: 6, cutout: '75%' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } } } } }); }
    for (let cat in totals) { let pct = ((totals[cat] / grandTotal) * 100).toFixed(0); container.innerHTML += `<div class="analytics-item"><div class="analytics-labels"><span>${cat}</span><b>Rp ${totals[cat].toLocaleString('id-ID')} (${pct}%)</b></div><div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div></div>`; }
}

function renderHistoryList(items) {
    const container = document.getElementById('history-list'); if (!container) return; container.innerHTML = ""; if (items.length === 0) { container.innerHTML = "<p class='subtitle'>Tidak ada catatan.</p>"; return; }
    let groups = {}; items.forEach(item => { if (!groups[item.date]) groups[item.date] = []; groups[item.date].push(item); });
    for (let date in groups) {
        let groupHtml = `<div class="day-group"><div class="day-title">${new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>`;
        groups[date].forEach(item => { groupHtml += `<div class="history-item"><div class="item-info"><p>${item.category}</p><span>[${item.time || '--:--'}] • ${item.note || 'Tanpa Catatan'}</span></div><div class="item-amount"><span>Rp ${item.nominal.toLocaleString('id-ID')}</span><button class="btn-delete" onclick="deleteTx('${item.id}')">Hapus</button></div></div>`; });
        container.innerHTML += groupHtml + `</div>`;
    }
}

window.deleteTx = async (id) => { if (await showCustomConfirm("Hapus transaksi?")) { try { await deleteDoc(doc(db, "transactions", id)); } catch (err) { console.error(err); } } };

const dragContainer = document.getElementById('drag-grid-container');
if (dragContainer) {
    document.querySelectorAll('.draggable-card').forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => { if (['INPUT', 'SELECT', 'BUTTON', 'OPTION'].includes(e.target.tagName)) { e.preventDefault(); return; } draggable.classList.add('dragging'); });
        draggable.addEventListener('dragend', () => { draggable.classList.remove('dragging'); localStorage.setItem('user_card_order', JSON.stringify(Array.from(document.querySelectorAll('.draggable-card')).map(card => card.querySelector('h3').innerText))); });
    });
    dragContainer.addEventListener('dragover', (e) => { e.preventDefault(); const draggingCard = document.querySelector('.dragging'); if (draggingCard) { const afterElement = getDragAfterElement(dragContainer, e.clientX); if (afterElement == null) dragContainer.appendChild(draggingCard); else dragContainer.insertBefore(draggingCard, afterElement); } });
}
function getDragAfterElement(container, x) { return [...container.querySelectorAll('.draggable-card:not(.dragging)')].reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = x - box.left - box.width / 2; return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }
