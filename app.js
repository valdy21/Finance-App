import { auth } from './auth.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, deleteDoc, setDoc, getDocs, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Proyek Anda (Firebase Storage resmi dinonaktifkan dari backend script)
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
let attachedMediaBase64 = ""; // Menyimpan string teks foto hasil kompresi Base64

// LOGIKA PROMISE JEMBATAN POPUP MODAL KUSTOM
function showCustomConfirm(message, isDestructive = true) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-btn-confirm');
        const cancelBtn = document.getElementById('modal-btn-cancel');

        if (!modal || !msgEl || !confirmBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        msgEl.innerText = message;
        confirmBtn.innerText = isDestructive ? "Hapus" : "Yakin";

        if (isDestructive) {
            confirmBtn.classList.add('modal-btn-destructive');
        } else {
            confirmBtn.classList.remove('modal-btn-destructive');
        }

        modal.classList.add('active');

        const closeWithResult = (result) => {
            modal.classList.remove('active');
            confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            resolve(result);
        };

        document.getElementById('modal-btn-confirm').addEventListener('click', () => closeWithResult(true));
        document.getElementById('modal-btn-cancel').addEventListener('click', () => closeWithResult(false));
    });
}

// LOGIKA PENAMPIL NOTIFIKASI TOAST MELAYANG AUTOMATIC FADE
function showCustomToast(message) {
    const container = document.getElementById('custom-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2500);
}

// 1. Sinkronisasi Navigasi Tab (Beranda, Dashboard & Histori)
const tabs = document.querySelectorAll('.nav-item');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.id.replace('nav', 'pane')).classList.add('active');
    });
});

// 2. Format Input Rupiah Real-Time
const setupFormatRupiah = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
        el.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            e.target.value = value ? parseInt(value).toLocaleString('id-ID') : "";
        });
    }
};
setupFormatRupiah('input-nominal');
setupFormatRupiah('input-gajian');

// 3. Konfigurasi Dropdown Tahun & Bulan Dinamis
const filterYear = document.getElementById('filter-year');
if (filterYear) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 3; i--) {
        let opt = document.createElement('option');
        opt.value = i; opt.innerText = i;
        filterYear.appendChild(opt);
    }
    document.getElementById('filter-month').value = String(new Date().getMonth() + 1).padStart(2, '0');
}

// 4. Inisialisasi Sinkronisasi Akun
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        currentUserEmail = user.email || "user@email.com";
        
        const initialsEl = document.getElementById('user-avatar-initials');
        if (initialsEl) {
            initialsEl.innerText = currentUserEmail.charAt(0).toUpperCase();
        }

        initApp();
    }
});

function initApp() {
    listenToCategories(); 
    listenToSalaryAndTransactions();
    listenToSocialFeed(); 
    setupSocialInputListener(); 
    setupMediaAttachmentListeners(); 
    const filterMonth = document.getElementById('filter-month');
    if (filterMonth) filterMonth.addEventListener('change', listenToSalaryAndTransactions);
    if (filterYear) filterYear.addEventListener('change', listenToSalaryAndTransactions);
    setupBulkDeleteListeners();
}

// ======================= LOGIKA FITUR BERANDA UTAS INTEGRASI BASE64 GRATIS =======================

// Mengompresi Gambar Menggunakan Canvas & Mengekspornya Menjadi String Teks Base64 Kecil
function processAndCompressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const max_size = 800;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64String = canvas.toDataURL('image/jpeg', 0.6);
                resolve(base64String);
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
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            showCustomToast("Untuk menjaga database tetap gratis tanpa storage, fitur saat ini hanya mendukung lampiran foto.");
            clearSelectedMedia();
            return;
        }

        statusLabel.innerText = "Memproses gambar...";
        attachedMediaBase64 = await processAndCompressImageToBase64(file);

        previewContainer.innerHTML = "";
        previewContainer.style.display = "block";
        statusLabel.innerText = "Foto siap diunggah secara gratis";

        previewContainer.innerHTML = `
            <img src="${attachedMediaBase64}" style="max-width: 240px; max-height: 160px; object-fit: cover; display: block;">
            <button type="button" id="btn-remove-media" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 11px; cursor: pointer; font-weight: bold; line-height: 22px; padding: 0; text-align: center;">X</button>
        `;

        document.getElementById('btn-remove-media')?.addEventListener('click', clearSelectedMedia);
    });
}

function clearSelectedMedia() {
    attachedMediaBase64 = "";
    const fileInput = document.getElementById('input-post-media');
    const previewContainer = document.getElementById('media-preview-container');
    const statusLabel = document.getElementById('label-media-status');
    
    if (fileInput) fileInput.value = "";
    if (previewContainer) {
        previewContainer.innerHTML = "";
        previewContainer.style.display = "none";
    }
    if (statusLabel) statusLabel.innerText = "";
}

function setupSocialInputListener() {
    const btnSubmit = document.getElementById('btn-submit-post');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const textarea = document.getElementById('input-post-text');
            if (!textarea) return;
            const textContent = textarea.value.trim();

            if (!textContent && !attachedMediaBase64) {
                showCustomToast("Teks atau lampiran foto tidak boleh kosong!");
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.innerText = "Mengirim...";

            const username = `@${currentUserEmail.split('@')[0]}`;
            const today = new Date();

            try {
                await addDoc(collection(db, "threads"), {
                    userId: currentUserId,
                    username: username,
                    content: textContent,
                    likes: [], 
                    replies: [], 
                    isRepost: false,
                    repostedBy: "",
                    mediaUrl: attachedMediaBase64,
                    mediaType: attachedMediaBase64 ? 'image' : '',
                    createdAt: today.getTime(),
                    timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
                });
                textarea.value = "";
                clearSelectedMedia();
                showCustomToast("Utas berhasil dibagikan!");
            } catch (err) {
                console.error("Gagal membagikan utas:", err);
                showCustomToast("Gagal membagikan postingan.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Bagikan";
            }
        });
    }
}

let unsubscribeSocial = null;
function listenToSocialFeed() {
    if (unsubscribeSocial) unsubscribeSocial();

    const q = query(collection(db, "threads"));

    unsubscribeSocial = onSnapshot(q, (snapshot) => {
        const feedContainer = document.getElementById('feed-container');
        if (!feedContainer) return;
        feedContainer.innerHTML = "";

        let threadsList = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            data.id = doc.id;
            threadsList.push(data);
        });

        threadsList.sort((a, b) => b.createdAt - a.createdAt);

        if (threadsList.length === 0) {
            feedContainer.innerHTML = "<div class='card' style='text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;'>Belum ada diskusi hari ini. Jadilah yang pertama!</div>";
            return;
        }

        feedContainer.innerHTML = threadsList.map(thread => {
            const hasLiked = Array.isArray(thread.likes) && thread.likes.includes(currentUserId);
            const likeCount = Array.isArray(thread.likes) ? thread.likes.length : 0;
            const initialChar = thread.username ? thread.username.charAt(1).toUpperCase() : "U";
            const isMyPost = thread.userId === currentUserId;
            
            const repliesArray = Array.isArray(thread.replies) ? thread.replies : [];
            const hasReplies = repliesArray.length > 0;

            // URUTAN BARU: .slice().reverse() membalik posisi komentar utama (terbaru di atas) tanpa merusak struktur array asli
            const repliesHtml = repliesArray.slice().reverse().map(rep => {
                const canDeleteReply = rep.userId === currentUserId || thread.userId === currentUserId;
                const safeReplyObj = JSON.stringify(rep).replace(/"/g, '&quot;');
                
                const subRepliesArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                // URUTAN BARU: .slice().reverse() membalik posisi balasan komentar tingkat 2 (terbaru di atas)
                const subRepliesHtml = subRepliesArray.slice().reverse().map(sub => {
                    const canDeleteSub = sub.userId === currentUserId || thread.userId === currentUserId;
                    const safeSubObj = JSON.stringify(sub).replace(/"/g, '&quot;');
                    return `
                        <div style="display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; padding-left: 20px; border-left: 1px dashed rgba(0,0,0,0.04);">
                            <div style="width: 20px; height: 20px; background: #c3c3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 8px; flex-shrink: 0;">
                                ${sub.username.charAt(1).toUpperCase()}
                            </div>
                            <div style="flex: 1; background: rgba(0,0,0,0.01); padding: 6px 10px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600;">
                                    <span>${sub.username}</span>
                                    <div style="color: var(--text-secondary); font-weight: 400; display: flex; gap: 6px;">
                                        <span>${sub.timeLabel || ''}</span>
                                        ${canDeleteSub ? `<button onclick="window.deleteSubComment('${thread.id}', '${rep.replyId}', ${safeSubObj})" style="background:none; border:none; color:var(--accent-red); font-size:11px; cursor:pointer; font-weight:600; padding:0;">Hapus</button>` : ''}
                                    </div>
                                </div>
                                <p style="font-size: 12px; color: var(--text-primary); margin-top: 1px; white-space: pre-wrap;">${sub.content}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div style="display: flex; gap: 10px; align-items: flex-start; margin-top: 10px; padding-left: 8px; flex-direction: column;">
                        <div style="display: flex; gap: 10px; align-items: flex-start; width: 100%;">
                            <div style="width: 24px; height: 24px; background: #a6a6a6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 9px; flex-shrink: 0;">
                                ${rep.username.charAt(1).toUpperCase()}
                            </div>
                            <div style="flex: 1; background: rgba(0,0,0,0.02); padding: 8px 12px; border-radius: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600;">
                                    <span>${rep.username}</span>
                                    <div style="color: var(--text-secondary); font-weight: 400; display: flex; gap: 8px; align-items: center;">
                                        <span>${rep.timeLabel || ''}</span>
                                        <button onclick="window.toggleSubReplyBox('${thread.id}', '${rep.replyId}')" style="background:none; border:none; color:var(--accent-blue); font-size:11px; cursor:pointer; font-weight:600; padding:0;">Balas</button>
                                        ${canDeleteReply ? `<button onclick="window.deleteReplyComment('${thread.id}', ${safeReplyObj})" style="background:none; border:none; color:var(--accent-red); font-size:11px; cursor:pointer; font-weight:600; padding:0 0 0 4px;">Hapus</button>` : ''}
                                    </div>
                                </div>
                                <p style="font-size: 12px; color: var(--text-primary); margin-top: 2px; white-space: pre-wrap;">${rep.content}</p>
                            </div>
                        </div>

                        <div id="sub-reply-box-${rep.replyId}" style="display: none; width: 100%; padding-left: 34px; gap: 8px; align-items: center; margin-top: 4px;">
                            <input type="text" id="sub-reply-input-${rep.replyId}" placeholder="Balas komentar @${rep.username.split('@')[0]}..." style="flex: 1; padding: 6px 10px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;">
                            <button onclick="window.submitSubReply('${thread.id}', '${rep.replyId}')" class="btn-primary" style="padding: 6px 12px; font-size: 11px; margin: 0; width: auto;">Kirim</button>
                        </div>

                        <div style="width: 100%; padding-left: 24px;">
                            ${subRepliesHtml}
                        </div>
                    </div>
                `;
            }).join('');

            const safeContentForAttribute = thread.content
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '&quot;')
                .replace(/\n/g, ' ');

            let mediaHtml = "";
            if (thread.mediaUrl && thread.mediaType === 'image') {
                mediaHtml = `<div style="margin-top: 8px; border-radius: 12px; overflow: hidden; max-width: 100%; border: 1px solid rgba(0,0,0,0.03);"><img src="${thread.mediaUrl}" style="max-height: 280px; width: auto; max-width: 100%; display: block; object-fit: cover;"></div>`;
            }

            return `
                <div class="card" style="padding: 16px; margin-bottom: 0;">
                    ${thread.isRepost ? `
                        <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); font-weight:600; margin-bottom:10px; padding-left:48px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                            <span>${thread.repostedBy} membagikan ulang</span>
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 12px; align-items: flex-start; position: relative;">
                        <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0; align-self: stretch;">
                            <div style="width: 36px; height: 36px; background: #c7c7cc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 13px; flex-shrink: 0;">
                                ${initialChar}
                            </div>
                            <div style="width: 2px; flex-grow: 1; background: rgba(0,0,0,0.06); margin-top: 6px; display: ${hasReplies ? 'block' : 'none'}; border-radius: 1px;"></div>
                        </div>
                        
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${thread.username}</span>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">${thread.timeLabel || '--:--'}</span>
                                    ${isMyPost ? `<button onclick="window.deleteThreadPost('${thread.id}')" style="background:none; border:none; color:var(--accent-red); font-size:11px; cursor:pointer; font-weight:600; padding:0 4px;">Hapus</button>` : ''}
                                </div>
                            </div>
                            <p style="font-size: 14px; line-height: 1.4; color: var(--text-primary); white-space: pre-wrap; margin-top: 2px;">${thread.content}</p>
                            
                            ${mediaHtml}

                            <div style="display: flex; gap: 18px; margin-top: 12px; align-items: center;">
                                <button onclick="window.toggleLikeThread('${thread.id}', ${hasLiked})" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0; color: ${hasLiked ? 'var(--accent-red)' : 'var(--text-secondary)'}; transition: color 0.15s ease;">
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span style="font-size: 13px; font-weight: 600;">${likeCount}</span>
                                </button>

                                <button onclick="window.toggleReplyBox('${thread.id}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0; display: flex; align-items: center; gap: 4px;">
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    <span style="font-size: 13px; font-weight: 600;">${repliesArray.length}</span>
                                </button>

                                <button onclick="window.repostThread('${thread.id}', '${thread.username}', '${safeContentForAttribute}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0; display: flex; align-items: center;">
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="17 1 21 5 17 9"></polyline>
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                        <polyline points="7 23 3 19 7 15"></polyline>
                                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                                    </svg>
                                </button>

                                <button onclick="window.copyThreadLink('${thread.id}')" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0; display: flex; align-items: center;">
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                    </svg>
                                </button>
                            </div>

                            <div id="reply-box-${thread.id}" style="display: none; margin-top: 14px; gap: 8px; align-items: center;">
                                <input type="text" id="reply-input-${thread.id}" placeholder="Tulis balasan untuk utas ini..." style="flex: 1; padding: 8px 12px; font-size: 13px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;">
                                <button onclick="window.submitReply('${thread.id}')" class="btn-primary" style="padding: 8px 14px; font-size: 12px; margin: 0; width: auto;">Balas</button>
                            </div>

                            <div id="replies-list-${thread.id}">
                                ${repliesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

window.toggleSubReplyBox = (threadId, replyId) => {
    const box = document.getElementById(`sub-reply-box-${replyId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'flex' : 'none';
        if (box.style.display === 'flex') {
            document.getElementById(`sub-reply-input-${replyId}`).focus();
        }
    }
};

window.submitSubReply = async (threadId, replyId) => {
    const input = document.getElementById(`sub-reply-input-${replyId}`);
    if (!input) return;
    const contentText = input.value.trim();

    if (!contentText) {
        showCustomToast("Balasan tidak boleh kosong!");
        return;
    }

    const myUsername = `@${currentUserEmail.split('@')[0]}`;
    const today = new Date();
    
    try {
        const querySnapshot = await getDocs(query(collection(db, "threads")));
        let currentReplies = [];

        querySnapshot.forEach(d => {
            if (d.id === threadId) {
                currentReplies = d.data().replies || [];
            }
        });

        const updatedReplies = currentReplies.map(rep => {
            if (rep.replyId === replyId) {
                const subArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                subArray.push({
                    subReplyId: `sub_${Date.now()}`,
                    userId: currentUserId,
                    username: myUsername,
                    content: contentText,
                    createdAt: today.getTime(),
                    timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
                });
                rep.subReplies = subArray;
            }
            return rep;
        });

        await updateDoc(doc(db, "threads", threadId), { replies: updatedReplies });
        input.value = "";
        document.getElementById(`sub-reply-box-${replyId}`).style.display = 'none';
        showCustomToast("Balasan berhasil dikirim!");
    } catch (err) {
        console.error("Gagal kirim balasan bersarang:", err);
        showCustomToast("Gagal memproses balasan.");
    }
};

window.deleteSubComment = async (threadId, replyId, subReplyObj) => {
    if (await showCustomConfirm("Hapus balasan komentar ini?")) {
        try {
            const querySnapshot = await getDocs(query(collection(db, "threads")));
            let currentReplies = [];
            querySnapshot.forEach(d => {
                if (d.id === threadId) currentReplies = d.data().replies || [];
            });

            const updatedReplies = currentReplies.map(rep => {
                if (rep.replyId === replyId) {
                    const subArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                    rep.subReplies = subArray.filter(s => s.subReplyId !== subReplyObj.subReplyId);
                }
                return rep;
            });

            await updateDoc(doc(db, "threads", threadId), { replies: updatedReplies });
            showCustomToast("Balasan berhasil dihapus.");
        } catch (err) {
            showCustomToast("Gagal menghapus balasan.");
        }
    }
};

window.toggleReplyBox = (id) => {
    const box = document.getElementById(`reply-box-${id}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'flex' : 'none';
        if (box.style.display === 'flex') {
            document.getElementById(`reply-input-${id}`).focus();
        }
    }
};

window.submitReply = async (id) => {
    const input = document.getElementById(`reply-input-${id}`);
    if (!input) return;
    const contentText = input.value.trim();

    if (!contentText) {
        showCustomToast("Teks balasan tidak boleh kosong!");
        return;
    }

    const myUsername = `@${currentUserEmail.split('@')[0]}`;
    const today = new Date();
    const replyObject = {
        replyId: `rep_${Date.now()}`, 
        userId: currentUserId,
        username: myUsername,
        content: contentText,
        subReplies: [], 
        createdAt: today.getTime(),
        timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
    };

    try {
        const threadRef = doc(db, "threads", id);
        await updateDoc(threadRef, {
            replies: arrayUnion(replyObject)
        });
        input.value = "";
        document.getElementById(`reply-box-${id}`).style.display = 'none';
        showCustomToast("Balasan berhasil dikirim!");
    } catch (err) {
        console.error("Gagal mengirim komentar:", err);
        showCustomToast("Gagal mengirim balasan.");
    }
};

window.deleteReplyComment = async (threadId, replyObject) => {
    const confirmDel = await showCustomConfirm("Hapus komentar ini dari halaman utas?");
    if (confirmDel) {
        try {
            const threadRef = doc(db, "threads", threadId);
            await updateDoc(threadRef, {
                replies: arrayRemove(replyObject)
            });
            showCustomToast("Komentar berhasil dihapus.");
        } catch (err) {
            console.error("Gagal menghapus komentar:", err);
            showCustomToast("Gagal memoderasi komentar.");
        }
    }
};

window.repostThread = async (id, originalUsername, originalContent) => {
    const myUsername = `@${currentUserEmail.split('@')[0]}`;
    const confirmRepost = await showCustomConfirm("Bagikan ulang utas ini ke linimasa Anda?", false);
    
    if (confirmRepost) {
        const today = new Date();
        try {
            await addDoc(collection(db, "threads"), {
                userId: currentUserId,
                username: originalUsername, 
                content: originalContent,
                likes: [],
                replies: [],
                isRepost: true, 
                repostedBy: myUsername, 
                createdAt: today.getTime(),
                timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
            });
            showCustomToast("Berhasil membagikan ulang utas!");
        } catch (err) {
            console.error("Gagal melakukan repost:", err);
            showCustomToast("Gagal membagikan ulang.");
        }
    }
};

window.toggleLikeThread = async (id, currentLikedState) => {
    const threadRef = doc(db, "threads", id);
    try {
        if (currentLikedState) {
            await updateDoc(threadRef, { likes: arrayRemove(currentUserId) });
        } else {
            await updateDoc(threadRef, { likes: arrayUnion(currentUserId) });
        }
    } catch (err) {
        console.error("Gagal memproses Like:", err);
    }
};

window.deleteThreadPost = async (id) => {
    if (await showCustomConfirm("Hapus postingan utas Anda ini?")) {
        try {
            await deleteDoc(doc(doc(db, "threads", id)));
            showCustomToast("Utas berhasil dihapus.");
        } catch (err) {
            showCustomToast("Gagal menghapus postingan.");
        }
    }
};

window.copyThreadLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}#thread-${id}`);
    showCustomToast("Tautan utas berhasil disalin!");
};
// ===========================================================================================

// 5. Simpan / Update Aturan Uang Gajian
const salaryForm = document.getElementById('salary-form');
if (salaryForm) {
    salaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawSalary = document.getElementById('input-gajian').value.replace(/\./g, "");
        const salaryDate = document.getElementById('input-tgl-gajian').value;

        try {
            await setDoc(doc(db, "salary_settings", currentUserId), {
                amount: parseInt(rawSalary),
                paydayDate: parseInt(salaryDate)
            });
            showCustomToast("Aturan uang gajian berhasil disimpan!");
        } catch (err) {
            console.error("Gagal menyimpan gaji:", err);
            showCustomToast("Gagal menyimpan aturan gaji.");
        }
    });
}

// 5B. Logika Tombol Hapus Aturan Anggaran
const btnResetSalary = document.getElementById('btn-reset-salary');
if (btnResetSalary) {
    btnResetSalary.addEventListener('click', async () => {
        const confirmReset = await showCustomConfirm("Apakah Anda yakin ingin menghapus aturan anggaran ini? Nominal sisa anggaran akan kembali menjadi nol (Rp 0).");
        if (confirmReset) {
            try {
                await setDoc(doc(db, "salary_settings", currentUserId), {
                    amount: 0,
                    paydayDate: 1
                });
                document.getElementById('salary-form').reset();
                showCustomToast("Anggaran bulanan berhasil direset!");
            } catch (err) {
                console.error("Gagal mereset anggaran:", err);
                showCustomToast("Terjadi kesalahan, gagal menghapus anggaran.");
            }
        }
    });
}

// Interaksi Tombol Hapus Histori Massal
function setupBulkDeleteListeners() {
    const deleteBatchByQuery = async (startRange, endRange, confirmMessage) => {
        const confirmDelete = await showCustomConfirm(confirmMessage);
        if (!confirmDelete) return;
        try {
            const q = query(
                collection(db, "transactions"),
                where("userId", "==", currentUserId),
                where("date", ">=", startRange),
                where("date", "<=", endRange)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                showCustomToast("Tidak ada data transaksi ditemukan.");
                return;
            }
            const promises = snapshot.docs.map(d => deleteDoc(doc(db, "transactions", d.id)));
            await Promise.all(promises);
            showCustomToast("Histori transaksi berhasil dibersihkan!");
        } catch (err) {
            console.error("Gagal menghapus massal:", err);
            showCustomToast("Terjadi masalah saat mencoba menghapus data.");
        }
    };

    document.getElementById('btn-clear-day')?.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        deleteBatchByQuery(todayStr, todayStr, "Hapus seluruh transaksi belanja khusus HARI INI?");
    });

    document.getElementById('btn-clear-month')?.addEventListener('click', () => {
        const selYear = document.getElementById('filter-year').value;
        const selMonth = document.getElementById('filter-month').value;
        deleteBatchByQuery(`${selYear}-${selMonth}-01`, `${selYear}-${selMonth}-31`, `Hapus seluruh transaksi belanja pada periode BULAN ${selMonth} TAHUN ${selYear}?`);
    });

    document.getElementById('btn-clear-year')?.addEventListener('click', () => {
        const selYear = document.getElementById('filter-year').value;
        deleteBatchByQuery(`${selYear}-01-01`, `${selYear}-12-31`, `PERINGATAN BESAR! Hapus seluruh catatan pengeluaran selama SATU TAHUN PENUH di tahun ${selYear}?`);
    });
}

// 6. Simpan Data Transaksi Pengeluaran Baru
const txForm = document.getElementById('transaction-form');
if (txForm) {
    txForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawNominal = document.getElementById('input-nominal').value.replace(/\./g, "");
        const note = document.getElementById('input-note').value;
        const category = document.getElementById('input-category').value;
        
        if(!category) { showCustomToast("Silakan tambah dan pilih kategori terlebih dahulu!"); return; }

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        try {
            await addDoc(collection(db, "transactions"), {
                userId: currentUserId,
                nominal: parseInt(rawNominal),
                category: category,
                note: note,
                date: dateString,
                time: timeString,
                createdAt: today.getTime()
            });
            txForm.reset();
            showCustomToast("Transaksi pengeluaran berhasil disimpan!");
        } catch (err) {
            console.error("Gagal menyimpan transaksi:", err);
            showCustomToast("Gagal mencatat transaksi.");
        }
    });
}

// 6B. Form Tambah Kategori Baru Mandiri
const catForm = document.getElementById('category-form');
if (catForm) {
    catForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newCatName = document.getElementById('input-new-category').value.trim();
        
        if (activeCategories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
            showCustomToast("Kategori ini sudah terdaftar!");
            return;
        }

        try {
            await addDoc(collection(db, "categories"), {
                userId: currentUserId,
                name: newCatName,
                createdAt: new Date().getTime()
            });
            document.getElementById('input-new-category').value = "";
            showCustomToast("Kategori baru berhasil ditambahkan!");
        } catch (err) {
            console.error("Gagal menambah kategori:", err);
            showCustomToast("Gagal menambah kategori.");
        }
    });
}

// 6C. Listener Pantau Real-Time Data Kategori
let unsubscribeCategories = null;
function listenToCategories() {
    if (unsubscribeCategories) unsubscribeCategories();

    const q = query(collection(db, "categories"), where("userId", "==", currentUserId));
    
    unsubscribeCategories = onSnapshot(q, (snapshot) => {
        activeCategories = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            data.id = doc.id;
            activeCategories.push(data);
        });

        activeCategories.sort((a,b) => a.createdAt - b.createdAt);

        if (snapshot.empty) {
            const defaults = ["Dapur & Sembako", "Jajan & Hiburan", "Kebutuhan Anak", "Listrik & Utilitas"];
            defaults.forEach(async (cat) => {
                await addDoc(collection(db, "categories"), {
                    userId: currentUserId,
                    name: cat,
                    createdAt: new Date().getTime()
                });
            });
            return;
        }

        const selectEl = document.getElementById('input-category');
        if (selectEl) {
            selectEl.innerHTML = activeCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }

        const manageListEl = document.getElementById('category-manage-list');
        if (manageListEl) {
            manageListEl.innerHTML = activeCategories.map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f4f4; padding:6px 10px; margin-bottom:5px; border-radius:6px; font-size:13px;">
                    <span>${c.name}</span>
                    <button type="button" onclick="deleteCategory('${c.id}')" style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-weight:bold;">Hapus</button>
                </div>
            `).join('');
        }
    });
}

window.deleteCategory = async (id) => {
    const confirmDel = await showCustomConfirm("Hapus kategori ini? Catatan lama tidak akan hilang, namun tidak bisa dipilih di transaksi baru.");
    if (confirmDel) {
        try {
            await deleteDoc(doc(db, "categories", id));
            showCustomToast("Kategori berhasil dihapus.");
        } catch (err) {
            showCustomToast("Gagal menghapus kategori.");
        }
    }
};

// 7. Aliran Sinkronisasi Data Gabungan (Gajian & Pengeluaran)
let unsubscribeTx = null;
let unsubscribeSalary = null;

function listenToSalaryAndTransactions() {
    if (unsubscribeTx) unsubscribeTx();
    if (unsubscribeSalary) unsubscribeSalary();

    const fYear = document.getElementById('filter-year');
    const fMonth = document.getElementById('filter-month');
    if (!fYear || !fMonth) return;

    const selectedYear = fYear.value;
    const selectedMonth = fMonth.value;

    let totalExpense = 0;
    let transactionsList = [];
    let categoryTotals = {};

    const kalkulasiUangDanRender = () => {
        const today = new Date();
        const currentDayNumber = today.getDate();
        let budgetBulanIni = 0;
        
        if (parseInt(selectedMonth) === (today.getMonth() + 1) && parseInt(selectedYear) === today.getFullYear()) {
            if (currentDayNumber >= userSalaryConfig.date) {
                budgetBulanIni = userSalaryConfig.amount - totalExpense;
            } else {
                budgetBulanIni = 0 - totalExpense;
            }
        } else {
            budgetBulanIni = userSalaryConfig.amount - totalExpense;
        }

        const totalMonthlyEl = document.getElementById('total-monthly');
        if (totalMonthlyEl) {
            totalMonthlyEl.innerText = `Rp ${budgetBulanIni.toLocaleString('id-ID')}`;
            if (budgetBulanIni < 0) {
                totalMonthlyEl.style.color = "var(--accent-red)";
            } else {
                totalMonthlyEl.style.color = "#000000";
            }
        }
    };

    unsubscribeSalary = onSnapshot(doc(db, "salary_settings", currentUserId), (salaryDoc) => {
        if (salaryDoc.exists()) {
            const data = salaryDoc.data();
            userSalaryConfig.amount = data.amount || 0;
            userSalaryConfig.date = data.paydayDate || 1;
            
            document.getElementById('label-salary-amount').innerText = `Rp ${userSalaryConfig.amount.toLocaleString('id-ID')}`;
            document.getElementById('label-salary-date').innerText = userSalaryConfig.date;
            document.getElementById('input-gajian').value = userSalaryConfig.amount ? userSalaryConfig.amount.toLocaleString('id-ID') : "";
            document.getElementById('input-tgl-gajian').value = userSalaryConfig.date;
        } else {
            userSalaryConfig = { amount: 0, date: 1 };
            document.getElementById('label-salary-amount').innerText = "Rp 0";
            document.getElementById('label-salary-date').innerText = "1";
        }
        kalkulasiUangDanRender();
    });

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", currentUserId),
        where("date", ">=", `${selectedYear}-${selectedMonth}-01`),
        where("date", "<=", `${selectedYear}-${selectedMonth}-31`)
    );

    unsubscribeTx = onSnapshot(q, (snapshot) => {
        totalExpense = 0;
        transactionsList = [];
        categoryTotals = {};

        snapshot.forEach(doc => {
            let data = doc.data();
            data.id = doc.id;
            transactionsList.push(data);
            totalExpense += data.nominal;
            categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.nominal;
        });

        transactionsList.sort((a,b) => b.createdAt - a.createdAt);
        
        renderAnalytics(categoryTotals, totalExpense);
        renderHistoryList(transactionsList);
        kalkulasiUangDanRender();
    });
}

// 8. Render Teks Progress Bar & DIAGRAM LINGKARAN
function renderAnalytics(totals, grandTotal) {
    const container = document.getElementById('analytics-list');
    if (!container) return;
    container.innerHTML = "";
    
    const grandTotalEl = document.getElementById('analytics-grand-total');
    if (grandTotalEl) {
        grandTotalEl.innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    }
    
    const ctx = document.getElementById('expenseChart');

    if (grandTotal === 0) { 
        container.innerHTML = "<p class='subtitle'>Belum ada pengeluaran bulan ini.</p>"; 
        if (expenseChartInstance) {
            expenseChartInstance.destroy();
            expenseChartInstance = null;
        }
        return; 
    }

    const categories = Object.keys(totals);
    const nominals = Object.values(totals);
    const colors = ['#ff9500', '#ff2d55', '#5ac8fa', '#5856d6', '#34c759', '#ffcc00', '#8e8e93'];

    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    if (ctx) {
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: nominals,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 0,
                    borderRadius: 16, 
                    spacing: 6,       
                    cutout: '75%'     
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            boxWidth: 8, 
                            usePointStyle: true, 
                            pointStyle: 'circle',
                            font: { size: 12, weight: '500' } 
                        }
                    }
                }
            }
        });
    }

    for (let cat in totals) {
        let pct = ((totals[cat] / grandTotal) * 100).toFixed(0);
        container.innerHTML += `
            <div class="analytics-item">
                <div class="analytics-labels"><span>${cat}</span><b>Rp ${totals[cat].toLocaleString('id-ID')} (${pct}%)</b></div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
            </div>`;
    }
}

// 9. Render Tampilan Histori Hirarki Harian
function renderHistoryList(items) {
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = "";
    if (items.length === 0) { container.innerHTML = "<p class='subtitle'>Tidak ada catatan di periode ini.</p>"; return; }

    let groups = {};
    items.forEach(item => {
        if (!groups[item.date]) groups[item.date] = [];
        groups[item.date].push(item);
    });

    for (let date in groups) {
        let d = new Date(date);
        let dayName = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
        let groupHtml = `<div class="day-group"><div class="day-title">${dayName}</div>`;
        
        groups[date].forEach(item => {
            const displayTime = item.time ? item.time : '--:--';
            const displayNote = item.note ? item.note : 'Tanpa Catatan';

            groupHtml += `
                <div class="history-item">
                    <div class="item-info">
                        <p>${item.category}</p>
                        <span>[${displayTime}] • ${displayNote}</span>
                    </div>
                    <div class="item-amount">
                        <span>Rp ${item.nominal.toLocaleString('id-ID')}</span>
                        <button class="btn-delete" onclick="deleteTx('${item.id}')">Hapus</button>
                    </div>
                </div>`;
        });
        groupHtml += `</div>`;
        container.innerHTML += groupHtml;
    }
}

// SCRIPT ATUR URUTAN POSISI KARTU (DRAG & DROP)
const dragContainer = document.getElementById('drag-grid-container');
if (dragContainer) {
    const draggables = document.querySelectorAll('.draggable-card');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            if (['INPUT', 'SELECT', 'BUTTON', 'OPTION'].includes(e.target.tagName)) {
                e.preventDefault();
                return;
            }
            draggable.classList.add('dragging');
        });
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            const currentOrder = Array.from(document.querySelectorAll('.draggable-card')).map(card => card.querySelector('h3').innerText);
            localStorage.setItem('user_card_order', JSON.stringify(currentOrder));
        });
    });
    dragContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(dragContainer, e.clientX);
        const draggingCard = document.querySelector('.dragging');
        if (draggingCard) {
            if (afterElement == null) {
                dragContainer.appendChild(draggingCard);
            } else {
                dragContainer.insertBefore(draggingCard, afterElement);
            }
        }
    });
}

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.draggable-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

document.addEventListener('DOMContentLoaded', () => {
    const savedOrder = localStorage.getItem('user_card_order');
    if (savedOrder && dragContainer) {
        const orderArray = JSON.parse(savedOrder);
        const cards = [...dragContainer.querySelectorAll('.draggable-card')];
        orderArray.forEach(titleText => {
            const matchedCard = cards.find(card => card.querySelector('h3').innerText === titleText);
            if (matchedCard) {
                dragContainer.appendChild(matchedCard);
            }
        });
    }
});
