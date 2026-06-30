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

// ==========================================
// DEKLARASI VARIABEL GLOBAL & SELEKTOR DOM
// ==========================================
const filterYear = document.getElementById('filter-yr');
// FIX 1: ID disesuaikan dengan index.html bawaan kamu ('filter-mth') agar tidak bernilai null
const filterMonth = document.getElementById('filter-mth');
const tabs = document.querySelectorAll('.nav-item');

let currentUserId = "";
let currentUserEmail = "";
let userSalaryConfig = { amount: 0, date: 1 };
let expenseChartInstance = null;
let activeCategories = [];

let attachedImagesArray = []; 
let activeLightboxImages = []; 
let activeLightboxIndex = 0; 
let selectedLocationText = ""; 
let currentPollOptionsCount = 2; 

let activeChatTargetId = "";
let unsubscribeChatRoomStream = null;
let activeUnsubscribeChatListenerGlobal = null;
let appLaunchTime = new Date().getTime();

let globalUserCache = {};
let unreadChatsCountMap = {}; 
let unsubscribeSocial = null; 

const waEmojiData = {
    "😀": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"],
    "🐱": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦤","🦚","🕊","🐇","🦝","🦨","🦡","🦫","🦥","🐺","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🪰","🪲","🪳","🕸","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🐊","🐅","🐆","🦓","🦍","𚖗"],
    "🍏": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🍅","🥑","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🫒","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🍳","🥘","🍲","🥣","🥗","🍿","🥩","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯"],
    "⚽": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🏓","🏸","🏒","🏑","🥍","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","skateboard","🛼","🛷","🥌","🎿","🏂","🪂","🏋️‍♂️","🤼‍♂️","🤸‍♂️","⛹️‍♂️","🤾‍♂️","🏌️‍♂️","🏇","🧘‍♂️","🏄‍♂️","🏊‍♂️","🤽‍♂️","🚣‍♂️","🧗‍♂️","🚵‍♂️","🚴‍♂️","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎫","🎟","🎭","🖼","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪗","🎸","🎲","♟","🎯","🎳","🎮","🎰","🧩"],
    "🚗": ["🚗","🚕","🚙","🚌","𚖖","🏎","警察","ambulans","🦽","𛲟","🚚","🚛","🚜","🦯","🦽","𚖗"," scooters","🚲","🛵","MUTIL","🛺","🚨","🚔","🚍","🚘","𚖗","𚖘","🚃","🇲🇲","🚞","🎚","🎛","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩","💺","🚀","🛸","🚁","🛶","⛵","🛥","🛳","𛟟","🚢","⚓","🪝","⛽","🚧","🗺","🗿","🗽","🗼","🏰","🏯","🏟","🎡","🎢","Carousel","🎠"]
};

const threedotsIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1" fill="currentColor"></circle><circle cx="19" cy="12" r="1" fill="currentColor"></circle><circle cx="5" cy="12" r="1" fill="currentColor"></circle>
    </svg>
`;

// ==========================================
// UTILITY FUNCTIONS (Confirm Box & Toast)
// ==========================================
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
            confirmBtn.onclick = null; cancelBtn.onclick = null; resolve(result);
        };
        confirmBtn.onclick = () => closeWithResult(true);
        cancelBtn.onclick = () => closeWithResult(false);
    });
}

function showCustomToast(message) {
    const container = document.getElementById('custom-toast-container'); if (!container) return;
    const toast = document.createElement('div'); toast.className = 'toast-item'; toast.innerText = message; container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 2500);
}

function setupFormatRupiah(elementId) {
    const el = document.getElementById(elementId);
    if (el) { el.addEventListener('input', (e) => { let value = e.target.value.replace(/\D/g, ""); e.target.value = value ? parseInt(value).toLocaleString('id-ID') : ""; }); }
}

// ==========================================
// NAVIGATION TAB SYSTEM INTERACTION
// ==========================================
if (tabs) {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active')); document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active'); document.getElementById(tab.id.replace('nav', 'pane')).classList.add('active');
        });
    });
}

auth.onAuthStateChanged(user => {
    if (user) { currentUserId = user.uid; currentUserEmail = user.email || "user@email.com"; initApp(); setUserOnlinePresence(true); }
});

function initApp() {
    if (filterYear && filterYear.options.length === 0) {
        const currentYr = new Date().getFullYear();
        for (let y = currentYr - 2; y <= currentYr + 2; y++) {
            let opt = document.createElement('option'); opt.value = y; opt.innerText = y;
            if(y === currentYr) opt.selected = true; filterYear.appendChild(opt);
        }
    }

    if (filterMonth && !filterMonth.value) {
        const currentMth = String(new Date().getMonth() + 1).padStart(2, '0');
        filterMonth.value = currentMth;
    }

    listenToUserProfilesGlobal(); 
    listenToCategories(); 
    listenToSocialFeed(); 
    setupSocialInputListener(); 
    setupMediaAttachmentListeners(); 
    setupNewAddonFeaturesListeners(); 
    setupProfileTabSystemListeners(); 
    setupLightboxClosingAndSwipeListeners(); 
    setupChatAndContactSystemBinds(); 
    listenToIncomingMessagesGlobal();
    
    listenToSalaryAndTransactions();

    setupFormatRupiah('input-nominal'); 
    setupFormatRupiah('input-gajian'); 
    setupFormatRupiah('input-new-category-budget');
    
    if (filterMonth) filterMonth.addEventListener('change', listenToSalaryAndTransactions);
    if (filterYear) filterYear.addEventListener('change', listenToSalaryAndTransactions);
    
    setupBulkDeleteListeners();
    document.getElementById('btn-home-own-avatar-trigger')?.addEventListener('click', () => { document.getElementById('nav-profile').click(); });
}

function setUserOnlinePresence(status) {
    if (!currentUserId) return;
    setDoc(doc(db, "user_profiles", currentUserId), { isOnline: status, lastSeen: new Date().getTime() }, { merge: true }).catch(err => console.error(err));
}

function getFormattedLastSeen(timestamp) {
    if (!timestamp) return "Offline"; const date = new Date(timestamp);
    const clockStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    if (date.toDateString() === new Date().toDateString()) return `Aktif pukul ${clockStr}`; return `${date.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} ${clockStr}`;
}

function listenToIncomingMessagesGlobal() {
    if (activeUnsubscribeChatListenerGlobal) activeUnsubscribeChatListenerGlobal();
    activeUnsubscribeChatListenerGlobal = onSnapshot(collection(db, "chats"), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const roomId = change.doc.id;
            if (roomId.includes(currentUserId)) {
                const roomData = change.doc.data(); if (!roomData || !Array.isArray(roomData.messages) || roomData.messages.length === 0) return;
                const lastMessage = roomData.messages[roomData.messages.length - 1]; const senderId = lastMessage.senderId;
                if (senderId !== currentUserId) {
                    if (change.type === "modified" || change.type === "added") {
                        if (!(document.getElementById('ios-chat-overlay-window').classList.contains('active') && activeChatTargetId === senderId)) {
                            if (lastMessage.timestamp > appLaunchTime) { unreadChatsCountMap[senderId] = (unreadChatsCountMap[senderId] || 0) + 1; triggerWhatsAppStyleNotificationBanner(senderId, lastMessage.text); }
                        }
                    }
                }
            }
        });
        renderPcSidebarContacts();
    });
}

function triggerWhatsAppStyleNotificationBanner(senderUid, messageText) {
    const banner = document.getElementById('wa-incoming-notification-popup'); const avatarZone = document.getElementById('wa-notif-avatar-zone'); const titleSender = document.getElementById('wa-notif-title-sender'); const bodyText = document.getElementById('wa-notif-body-text'); if (!banner) return;
    const senderData = globalUserCache[senderUid]; const finalName = senderData?.username || "Pengguna Lain"; const avatarSrc = senderData?.avatar || "";
    titleSender.innerText = finalName; bodyText.innerText = messageText;
    avatarZone.innerHTML = avatarSrc ? `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; background:#007aff; color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold;">${finalName.replace('@','').charAt(0).toUpperCase()}</div>`;
    banner.onclick = () => { banner.classList.remove('show'); window.openWaUserProfileCard(senderUid); };
    banner.classList.add('show'); setTimeout(() => { banner.classList.remove('show'); }, 4500);
}

function listenToUserProfilesGlobal() {
    onSnapshot(collection(db, "user_profiles"), (snapshot) => {
        snapshot.forEach(doc => { globalUserCache[doc.id] = { avatar: doc.data().avatarBase64 || "", username: doc.data().username || "", email: doc.data().email || "user@email.com", phone: doc.data().phoneNumber || "-", isOnline: doc.data().isOnline || false, lastSeen: doc.data().lastSeen || 0 }; });
        renderPcSidebarContacts();
        const activeUserAvatar = globalUserCache[currentUserId]?.avatar; const initialsText = document.getElementById('user-avatar-initials'); const inputAvatarImg = document.getElementById('view-input-avatar-img');
        if (activeUserAvatar) { if (initialsText) initialsText.style.display = "none"; if (inputAvatarImg) { inputAvatarImg.src = activeUserAvatar; inputAvatarImg.style.display = "block"; } } 
        else { if (initialsText) { initialsText.innerText = currentUserEmail.charAt(0).toUpperCase(); initialsText.style.display = "block"; } if (inputAvatarImg) inputAvatarImg.style.display = "none"; }
    });
}

function renderPcSidebarContacts() {
    const sidebarContainer = document.getElementById('pc-sidebar-users-list'); if (!sidebarContainer) return; let sidebarHtml = "";
    Object.keys(globalUserCache).forEach(uid => {
        if (uid !== currentUserId) {
            const uData = globalUserCache[uid]; const activeIndicatorColor = uData.isOnline ? "#34c759" : "#8e8e93"; const initialLetter = uData.username ? uData.username.replace('@','').charAt(0).toUpperCase() : '?'; const unreadCount = unreadChatsCountMap[uid] || 0;
            let badgeHtml = unreadCount > 0 ? `<span class="ios-notification-badge">${unreadCount}</span>` : "";
            let avatarCircle = uData.avatar ? `<img src="${uData.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; background:#c7c7cc; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">${initialLetter}</div>`;
            sidebarHtml += `<div class="sidebar-chat-item" onclick="window.openWaUserProfileCard('${uid}')"><div style="display:flex; align-items:center; gap:12px; overflow:hidden;"><div style="position: relative; width: 28px; height: 28px; flex-shrink: 0;"><div style="width:100%; height:100%; border-radius:50%; overflow:hidden;">${avatarCircle}</div><div style="position: absolute; bottom:-1px; right:-1px; width:7px; height:7px; background:${activeIndicatorColor}; border:1px solid var(--ios-bg-card); border-radius:50%;"></div></div><div style="display:flex; flex-direction:column; overflow:hidden;"><span style="font-size:13px; font-weight:550; color:var(--ios-text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${uData.username || 'User'}</span><span style="font-size:10px; color:var(--ios-text-secondary);">${uData.isOnline ? 'Online' : 'Offline'}</span></div></div>${badgeHtml}</div>`;
        }
    });
    sidebarContainer.innerHTML = sidebarHtml || `<div style="font-size:11px; color:var(--ios-text-secondary); padding:4px;">Belum ada kontak lain.</div>`;
}

function getDynamicAvatarHtml(userId, username, size = 36) {
    const userData = globalUserCache[userId]; const avatarSrc = userData ? userData.avatar : ""; const isOnline = userData ? userData.isOnline : false; const initialLetter = username ? username.replace('@','').charAt(0).toUpperCase() : '?'; const fontSize = size === 36 ? 14 : 9; const statusColor = isOnline ? "#34c759" : "#8e8e93";
    let avatarEl = avatarSrc ? `<img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover; display: block;">` : `<div style="width: 100%; height: 100%; background: #c7c7cc; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: ${fontSize}px;">${initialLetter}</div>`;
    return `<div onclick="window.openWaUserProfileCard('${userId}')" style="position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0; cursor: pointer; border-radius: 50%; overflow: visible;"><div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden;">${avatarEl}</div><div style="position: absolute; bottom: -1px; right: -1px; width: ${size === 36 ? '10px' : '7px'}; height: ${size === 36 ? '10px' : '7px'}; background: ${statusColor}; border: 1.5px solid var(--ios-bg-card); border-radius: 50%;"></div></div>`;
}

window.openWaUserProfileCard = (userId) => {
    if (userId === currentUserId) { document.getElementById('nav-profile').click(); return; }
    const targetData = globalUserCache[userId]; if (!targetData) return;
    const targetName = targetData.username || `@${userId.substring(0,6)}`; const avatarSrc = targetData.avatar || "";
    
    tabs.forEach(t => t.classList.remove('active')); document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('pane-user-profile').classList.add('active');

    const avatarBox = document.getElementById('target-full-avatar-box'); const nameEl = document.getElementById('target-full-username'); const statusEl = document.getElementById('target-full-status-sub'); const emailEl = document.getElementById('target-full-email'); const phoneEl = document.getElementById('target-full-phone'); const btnChat = document.getElementById('btn-target-full-start-chat');

    avatarBox.innerHTML = avatarSrc ? `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; background:#c7c7cc; color:#fff; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:bold;">${targetName.replace('@','').charAt(0).toUpperCase()}</div>`;
    nameEl.innerText = targetName; statusEl.innerText = targetData.isOnline ? "Online" : getFormattedLastSeen(targetData.lastSeen);
    emailEl.innerText = targetData.email || "-"; phoneEl.innerText = targetData.phone || "-";
    
    btnChat.onclick = () => {
        document.getElementById('pane-user-profile').classList.remove('active'); document.getElementById('pane-home').classList.add('active'); document.getElementById('nav-home').classList.add('active');
        unreadChatsCountMap[userId] = 0; renderPcSidebarContacts(); window.openDirectMessageChatRoom(userId, targetName, avatarSrc);
    };
};

window.openDirectMessageChatRoom = (targetUid, targetName, avatarSrc) => {
    activeChatTargetId = targetUid; unreadChatsCountMap[targetUid] = 0; renderPcSidebarContacts();
    const windowOverlay = document.getElementById('ios-chat-overlay-window'); const titleEl = document.getElementById('chat-header-title-name'); const statusEl = document.getElementById('chat-header-status-sub'); const avatarBox = document.getElementById('chat-header-avatar-box');
    titleEl.innerText = targetName;
    avatarBox.innerHTML = avatarSrc ? `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; background:#c7c7cc; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">${targetName.charAt(1).toUpperCase()}</div>`;
    windowOverlay.classList.add('active');
    const chatRoomId = currentUserId < targetUid ? `${currentUserId}_${targetUid}` : `${targetUid}_${currentUserId}`;
    onSnapshot(doc(db, "user_profiles", targetUid), (docSnap) => { if(docSnap.exists()){ const online = docSnap.data().isOnline || false; statusEl.innerText = online ? "Online" : getFormattedLastSeen(docSnap.data().lastSeen); } });
    if (unsubscribeChatRoomStream) unsubscribeChatRoomStream();
    unsubscribeChatRoomStream = onSnapshot(doc(db, "chats", chatRoomId), (docSnapshot) => {
        const streamContainer = document.getElementById('chat-messages-stream'); if (!streamContainer) return; streamContainer.innerHTML = "";
        if (docSnapshot.exists() && Array.isArray(docSnapshot.data().messages)) { streamContainer.innerHTML = docSnapshot.data().messages.map(m => `<div class="msg-bubble ${m.senderId === currentUserId ? 'sent' : 'received'}">${m.text}</div>`).join(''); streamContainer.scrollTop = streamContainer.scrollHeight; } 
        else { streamContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--ios-text-secondary); margin-top:20px;">Belum ada riwayat obrolan. Mulai sapa temanmu!</div>`; }
    });
};

window.toggleLikeThread = async (id, currentLikedState) => { try { if (currentLikedState) await updateDoc(doc(db, "threads", id), { likes: arrayRemove(currentUserId) }); else await updateDoc(doc(db, "threads", id), { likes: arrayUnion(currentUserId) }); } catch (err) { console.error(err); } };
window.toggleReplyBox = (id) => { const box = document.getElementById(`reply-box-${id}`); if (box) { box.style.display = box.style.display === 'none' ? 'flex' : 'none'; if (box.style.display === 'flex') document.getElementById(`reply-input-${id}`).focus(); } };
window.submitReply = async (id) => { const input = document.getElementById(`reply-input-${id}`); if (!input) return; const contentText = input.value.trim(); if (!contentText) return; const replyObject = { replyId: `rep_${Date.now()}`, userId: currentUserId, username: `@${currentUserEmail.split('@')[0]}`, content: contentText, subReplies: [], createdAt: new Date().getTime(), timeLabel: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` }; try { await updateDoc(doc(db, "threads", id), { replies: arrayUnion(replyObject) }); input.value = ""; } catch (err) { console.error(err); } };
window.deleteReplyComment = async (threadId, replyObject) => { if (await showCustomConfirm("Hapus komentar ini?")) { try { await updateDoc(doc(db, "threads", threadId), { replies: arrayRemove(replyObject) }); showCustomToast("Komentar dihapus."); } catch (err) { console.error(err); } } };
window.repostThread = async (id, originalUsername, originalContent) => { if (await showCustomConfirm("Bagikan ulang utas ini?", false)) { try { await addDoc(collection(db, "threads"), { userId: currentUserId, username: originalUsername, content: originalContent, likes: [], replies: [], isRepost: true, repostedBy: `@${currentUserEmail.split('@')[0]}`, createdAt: new Date().getTime(), timeLabel: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` }); showCustomToast("Berhasil dibagikan!"); } catch (err) { console.error(err); } } };
window.deleteThreadPost = async (id) => { if (await showCustomConfirm("Hapus postingan utas ini?")) { try { await deleteDoc(doc(db, "threads", id)); showCustomToast("Utas dihapus."); } catch (err) { console.error(err); } } };
window.copyThreadLink = (id) => { navigator.clipboard.writeText(`${window.location.origin}#thread-${id}`); showCustomToast("Tautan utas disalin!"); };

window.toggleSubReplyBox = (threadId, replyId) => { const box = document.getElementById(`sub-reply-box-${replyId}`); if(box) box.style.display = box.style.display === 'none' ? 'flex' : 'none'; };

window.submitSubReply = async (threadId, replyId) => {
    const input = document.getElementById(`sub-reply-input-${replyId}`); if (!input) return; const val = input.value.trim(); if (!val) return;
    try {
        const threadRef = doc(db, "threads", threadId);
        const snap = await getDocs(query(collection(db, "threads"))); 
        let targetThread = null;
        snap.forEach(d => { if(d.id === threadId) targetThread = d.data(); });
        if (!targetThread) return;
        
        let updatedReplies = (targetThread.replies || []).map(r => {
            if (r.replyId === replyId) {
                if (!Array.isArray(r.subReplies)) r.subReplies = [];
                r.subReplies.push({
                    subReplyId: `sub_${Date.now()}`,
                    userId: currentUserId,
                    username: `@${currentUserEmail.split('@')[0]}`,
                    content: val,
                    createdAt: new Date().getTime(),
                    timeLabel: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`
                });
            }
            return r;
        });
        await updateDoc(threadRef, { replies: updatedReplies }); input.value = ""; showCustomToast("Komentar dibalas!");
    } catch(err) { console.error(err); }
};

window.deleteSubComment = async (threadId, replyId, subReplyObj) => {
    if (await showCustomConfirm("Hapus balasan ini?")) {
        try {
            const threadRef = doc(db, "threads", threadId);
            const snap = await getDocs(query(collection(db, "threads")));
            let targetThread = null; snap.forEach(d => { if(d.id === threadId) targetThread = d.data(); });
            if (!targetThread) return;
            let updatedReplies = (targetThread.replies || []).map(r => {
                if (r.replyId === replyId && Array.isArray(r.subReplies)) {
                    r.subReplies = r.subReplies.filter(s => s.subReplyId !== subReplyObj.subReplyId);
                }
                return r;
            });
            await updateDoc(threadRef, { replies: updatedReplies }); showCustomToast("Balasan dihapus.");
        } catch(err) { console.error(err); }
    }
};

window.voteInPoll = async (threadId, optionIndex) => {
    try {
        const tRef = doc(db, "threads", threadId);
        const snap = await getDocs(query(collection(db, "threads")));
        let threadData = null; snap.forEach(d => { if(d.id === threadId) threadData = d.data(); });
        if (!threadData || !threadData.poll || !Array.isArray(threadData.poll.options)) return;

        let updatedOptions = threadData.poll.options.map((opt, idx) => {
            if (!Array.isArray(opt.votes)) opt.votes = [];
            opt.votes = opt.votes.filter(uid => uid !== currentUserId);
            if (idx === optionIndex) {
                opt.votes.push(currentUserId);
            }
            return opt;
        });
        await updateDoc(tRef, { "poll.options": updatedOptions });
        showCustomToast("Pilihan polling disimpan.");
    } catch (err) { console.error(err); }
};

function setupChatAndContactSystemBinds() {
    document.getElementById('btn-close-full-profile')?.addEventListener('click', () => { document.getElementById('pane-user-profile').classList.remove('active'); document.getElementById('pane-home').classList.add('active'); document.getElementById('nav-home').classList.add('active'); });
    document.getElementById('btn-chat-back-to-app')?.addEventListener('click', () => { document.getElementById('ios-chat-overlay-window').classList.remove('active'); if (unsubscribeChatRoomStream) unsubscribeChatRoomStream(); });
    document.getElementById('btn-chat-send-trigger')?.addEventListener('click', executeSendChatMessage);
    document.getElementById('input-chat-message-text')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') executeSendChatMessage(); });
}

async function executeSendChatMessage() {
    const input = document.getElementById('input-chat-message-text'); if (!input || !activeChatTargetId) return; const msgVal = input.value.trim(); if (!msgVal) return;
    const chatRoomId = currentUserId < activeChatTargetId ? `${currentUserId}_${activeChatTargetId}` : `${activeChatTargetId}_${currentUserId}`;
    const newMsgObj = { senderId: currentUserId, text: msgVal, timestamp: new Date().getTime() }; input.value = "";
    try { await setDoc(doc(db, "chats", chatRoomId), { messages: arrayUnion(newMsgObj) }, { merge: true }); } catch(err) { console.error(err); }
}

function processAndCompressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (file.type.startsWith('video/')) { resolve(event.target.result); return; }
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); let width = img.width, height = img.height; const max_size = 500;
                if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
                else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.45));
            };
        };
    });
}

function setupMediaAttachmentListeners() {
    const fileInput = document.getElementById('input-post-media'); const previewContainer = document.getElementById('media-preview-container'); const statusLabel = document.getElementById('label-media-status'); if (!fileInput || !previewContainer) return;
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files); if (files.length === 0) return; statusLabel.innerText = "Memproses berkas...";
        if (attachedImagesArray.length + files.length > 10) { showCustomToast("Batas maksimal lampiran adalah 10 foto/video."); statusLabel.innerText = ""; return; }
        for (let file of files) { const compressed = await processAndCompressImageToBase64(file); attachedImagesArray.push({ type: file.type.startsWith('video/') ? 'video' : 'image', src: compressed }); }
        renderComposerImagesPreview(); statusLabel.innerText = `${attachedImagesArray.length} file siap diunggah`;
    });
}

function renderComposerImagesPreview() {
    const previewContainer = document.getElementById('media-preview-container'); if (!previewContainer) return;
    if (attachedImagesArray.length === 0) { previewContainer.innerHTML = ""; previewContainer.style.display = "none"; return; }
    previewContainer.innerHTML = attachedImagesArray.map((file, index) => {
        let tag = file.type === 'video' ? `<video src="${file.src}" muted></video>` : `<img src="${file.src}">`;
        return `<div class="composer-img-item">${tag}<button type="button" onclick="window.removeSelectedComposerImg(${index})" style="position: absolute; top: 1px; right: 1px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">×</button></div>`;
    }).join('');
    previewContainer.style.display = "grid";
}

window.removeSelectedComposerImg = (index) => { attachedImagesArray.splice(index, 1); renderComposerImagesPreview(); document.getElementById('label-media-status').innerText = attachedImagesArray.length > 0 ? `${attachedImagesArray.length} file siap diunggah` : ""; };
function clearSelectedMedia() { attachedImagesArray = []; renderComposerImagesPreview(); const fileInput = document.getElementById('input-post-media'); if (fileInput) fileInput.value = ""; document.getElementById('label-media-status').innerText = ""; }

window.openMediaLightbox = (src, type) => {
    const lightbox = document.getElementById('ios-profile-lightbox'); const innerContent = document.getElementById('ios-lightbox-inner-content'); if (!lightbox || !innerContent) return;
    innerContent.innerHTML = type === 'video' ? `<video src="${src}" controls autoplay style="max-width:100%; max-height:100%; border-radius:8px;"></video>` : `<img src="${src}">`;
    lightbox.classList.add('active');
};

function setupLightboxClosingAndSwipeListeners() {
    const lightbox = document.getElementById('ios-profile-lightbox'); if (!lightbox) return;
    lightbox.addEventListener('click', (e) => { if (e.target.id === 'ios-profile-lightbox' || e.target.id === 'ios-lightbox-inner-content' || e.target.classList.contains('lightbox-content-wrapper')) { lightbox.classList.remove('active'); const video = lightbox.querySelector('video'); if (video) video.pause(); } });
    document.getElementById('btn-close-lightbox')?.addEventListener('click', () => { lightbox.classList.remove('active'); const video = lightbox.querySelector('video'); if (video) video.pause(); });
}

function setupNewAddonFeaturesListeners() {
    const txtArea = document.getElementById('input-post-text'); const btnEmoji = document.getElementById('btn-trigger-emoji'); const emojiPanel = document.getElementById('emoji-popover-panel'); const tabsBar = document.getElementById('wa-emoji-tabs-bar'); const gridRender = document.getElementById('wa-emoji-grid-render');
    if (tabsBar && gridRender) {
        const categoriesKeys = Object.keys(waEmojiData); tabsBar.innerHTML = categoriesKeys.map((cat, idx) => `<button type="button" class="wa-emoji-tab-btn ${idx === 0 ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('');
        const renderEmojiGrid = (categoryKey) => { gridRender.innerHTML = waEmojiData[categoryKey].map(emoji => `<span class="wa-emoji-item">${emoji}</span>`).join(''); gridRender.querySelectorAll('.wa-emoji-item').forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (txtArea) { txtArea.value += item.innerText; txtArea.focus(); } }); }); };
        renderEmojiGrid(categoriesKeys[0]); tabsBar.querySelectorAll('.wa-emoji-tab-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); tabsBar.querySelectorAll('.wa-emoji-tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderEmojiGrid(btn.getAttribute('data-cat')); }); });
    }
    if (btnEmoji && emojiPanel) { btnEmoji.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); emojiPanel.style.display = (emojiPanel.style.display === 'none' || emojiPanel.style.display === '') ? 'flex' : 'none'; }); document.addEventListener('click', () => { if(emojiPanel) emojiPanel.style.display = 'none'; }); emojiPanel.addEventListener('click', (e) => e.stopPropagation()); }

    const btnTriggerPoll = document.getElementById('btn-trigger-poll'); const pollCreator = document.getElementById('poll-creator-container'); const pollInputsContainer = document.getElementById('poll-options-inputs'); const btnAddOption = document.getElementById('btn-poll-add-option');
    const renderPollInputFields = () => {
        if (!pollInputsContainer) return; const existingFields = pollInputsContainer.querySelectorAll('.poll-option-field-input'); let savedValues = []; existingFields.forEach(f => { savedValues.push(f.value); }); pollInputsContainer.innerHTML = "";
        for (let i = 1; i <= currentPollOptionsCount; i++) { const currentValue = savedValues[i - 1] ? savedValues[i - 1] : ""; pollInputsContainer.innerHTML += `<input type="text" class="poll-option-field-input" placeholder="Pilihan ${i}" value="${currentValue.replace(/"/g, '&quot;')}" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; outline: none; background: #fff; margin-bottom: 2px;">`; }
        if (btnAddOption) btnAddOption.style.display = currentPollOptionsCount >= 4 ? 'none' : 'block';
    };
    if (btnTriggerPoll && pollCreator) { btnTriggerPoll.addEventListener('click', (e) => { e.preventDefault(); currentPollOptionsCount = 2; renderPollInputFields(); pollCreator.style.display = 'flex'; }); btnAddOption?.addEventListener('click', (e) => { e.preventDefault(); if (currentPollOptionsCount < 4) { currentPollOptionsCount++; renderPollInputFields(); } }); document.getElementById('btn-poll-cancel')?.addEventListener('click', (e) => { e.preventDefault(); pollCreator.style.display = 'none'; if (pollInputsContainer) pollInputsContainer.innerHTML = ""; }); }

    const btnLocation = document.getElementById('btn-trigger-location'); const locationBadge = document.getElementById('location-selected-badge'); const textLocation = document.getElementById('text-location-badge');
    if (btnLocation && locationBadge && textLocation) {
        btnLocation.addEventListener('click', (e) => {
            e.preventDefault(); if (!navigator.geolocation) { showCustomToast("Browser Anda tidak mendukung pelacakan lokasi."); return; } showCustomToast("Membaca koordinat GPS...");
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude; const lon = position.coords.longitude;
                try { const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`); const geoData = await response.json(); const city = geoData.address.city || geoData.address.town || geoData.address.city_district || "Indonesia"; const state = geoData.address.state || ""; selectedLocationText = state ? `${city}, ${state}` : city; } 
                catch (err) { selectedLocationText = "Jakarta, Indonesia"; } textLocation.innerText = selectedLocationText; locationBadge.style.display = 'flex'; showCustomToast("Lokasi disematkan!");
            }, () => { selectedLocationText = "Jakarta, Indonesia"; textLocation.innerText = selectedLocationText; locationBadge.style.display = 'flex'; showCustomToast("Menggunakan lokasi standar."); }, { enableHighAccuracy: true, timeout: 8000 });
        });
        document.getElementById('btn-remove-location')?.addEventListener('click', (e) => { e.preventDefault(); selectedLocationText = ""; locationBadge.style.display = 'none'; });
    }
}

window.toggleLettersDropdown = (event, dropdownId) => { event.preventDefault(); event.stopPropagation(); const targetDropdown = document.getElementById(dropdownId); const isAlreadyOpen = targetDropdown.style.display === 'block'; document.querySelectorAll('.threads-dropdown-list').forEach(box => box.style.display = 'none'); if (!isAlreadyOpen && targetDropdown) targetDropdown.style.display = 'block'; };

function setupProfileTabSystemListeners() {
    const textEmail = document.getElementById('profile-text-email'); const inputPhone = document.getElementById('profile-input-phone'); const toggleThemeCheckbox = document.getElementById('toggle-ios-theme'); if (textEmail) textEmail.innerText = currentUserEmail;
    onSnapshot(doc(db, "user_profiles", currentUserId), (profileDoc) => { if (profileDoc.exists()) { const data = profileDoc.data(); if (data.phoneNumber && inputPhone) inputPhone.value = data.phoneNumber; if (data.avatarBase64) { const picEl = document.getElementById('view-profile-pic'); const fallbackEl = document.getElementById('text-profile-fallback'); if (picEl && fallbackEl) { picEl.src = data.avatarBase64; picEl.style.display = "block"; fallbackEl.style.display = "none"; } } } });
    inputPhone?.addEventListener('blur', async () => { try { await setDoc(doc(db, "user_profiles", currentUserId), { phoneNumber: inputPhone.value.trim() }, { merge: true }); showCustomToast("Nomor telepon diperbarui."); } catch (err) { console.error(err); } });
    document.getElementById('input-profile-upload')?.addEventListener('change', async (e) => { const file = e.target.files[0]; if (!file) return; showCustomToast("Mengompres gambar profil..."); const compressedBase64 = await processAndCompressImageToBase64(file); try { await setDoc(doc(db, "user_profiles", currentUserId), { avatarBase64: compressedBase64, username: `@${currentUserEmail.split('@')[0]}`, email: currentUserEmail }, { merge: true }); showCustomToast("Foto profil berhasil diubah!"); } catch (err) { console.error(err); } });
    document.getElementById('container-profile-img')?.addEventListener('click', () => { const picEl = document.getElementById('view-profile-pic'); if (picEl && picEl.style.display !== 'none') window.openMediaLightbox(picEl.src, 'image'); });
    const currentGlobalTheme = localStorage.getItem('user_theme') || 'light'; if (toggleThemeCheckbox) { toggleThemeCheckbox.checked = currentGlobalTheme === 'dark'; toggleThemeCheckbox.addEventListener('change', (e) => { const nextTheme = e.target.checked ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', nextTheme); localStorage.setItem('user_theme', nextTheme); showCustomToast(nextTheme === 'dark' ? "Mode gelap aktif" : "Mode terang aktif"); }); }
    document.getElementById('btn-profile-logout')?.addEventListener('click', async () => { if (await showCustomConfirm("Apakah Anda yakin ingin keluar?")) { setUserOnlinePresence(false); localStorage.removeItem('login_timestamp'); auth.signOut().then(() => window.location.href = 'login.html'); } });
}

function setupSocialInputListener() {
    const btnSubmit = document.getElementById('btn-submit-post');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const textarea = document.getElementById('input-post-text'); if (!textarea) return; const textContent = textarea.value.trim(); let finalPollData = null; const pollCreator = document.getElementById('poll-creator-container');
            if (pollCreator && pollCreator.style.display !== 'none') { const fields = document.querySelectorAll('.poll-option-field-input'); let validOptions = []; fields.forEach(f => { if(f.value.trim()) validOptions.push({ text: f.value.trim(), votes: [] }); }); if (validOptions.length < 2) { showCustomToast("Polling minimal membutuhkan 2 opsi pilihan!"); return; } finalPollData = { options: validOptions }; }
            if (!textContent && attachedImagesArray.length === 0 && !finalPollData) { showCustomToast("Isi postingan Anda masih kosong!"); return; }
            btnSubmit.disabled = true; btnSubmit.innerText = "Mengirim..."; const username = `@${currentUserEmail.split('@')[0]}`; const today = new Date();
            try { await addDoc(collection(db, "threads"), { userId: currentUserId, username: username, content: textContent, likes: [], replies: [], isRepost: false, repostedBy: "", mediaUrlsArray: attachedImagesArray, location: selectedLocationText, poll: finalPollData, createdAt: today.getTime(), timeLabel: `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}` }); textarea.value = ""; clearSelectedMedia(); selectedLocationText = ""; document.getElementById('location-selected-badge').style.display = 'none'; document.getElementById('poll-creator-container').style.display = 'none'; showCustomToast("Utas berhasil dibagikan!"); } 
            catch (err) { console.error(err); showCustomToast("Gagal mengirim postingan."); } finally { btnSubmit.disabled = false; btnSubmit.innerText = "Bagikan"; }
        });
    }
}

function listenToSocialFeed() {
    if (unsubscribeSocial) unsubscribeSocial();
    unsubscribeSocial = onSnapshot(query(collection(db, "threads")), (snapshot) => {
        const feedContainer = document.getElementById('feed-container'); if (!feedContainer) return; feedContainer.innerHTML = ""; let threadsList = [];
        snapshot.forEach(doc => { let d = doc.data(); d.id = doc.id; threadsList.push(d); }); threadsList.sort((a, b) => b.createdAt - a.createdAt);
        if (threadsList.length === 0) { feedContainer.innerHTML = "<div class='card' style='text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;'>Belum ada diskusi hari ini.</div>"; return; }

        feedContainer.innerHTML = threadsList.map(thread => {
            const hasLiked = Array.isArray(thread.likes) && thread.likes.includes(currentUserId); const likeCount = Array.isArray(thread.likes) ? thread.likes.length : 0; const isMyPost = thread.userId === currentUserId; const repliesArray = Array.isArray(thread.replies) ? thread.replies : []; const hasReplies = repliesArray.length > 0;
            const repliesHtml = repliesArray.slice().reverse().map(rep => {
                const canDeleteReply = rep.userId === currentUserId || thread.userId === currentUserId; const safeReplyObj = JSON.stringify(rep).replace(/"/g, '&quot;'); const subRepliesArray = Array.isArray(rep.subReplies) ? rep.subReplies : [];
                const subRepliesHtml = subRepliesArray.slice().reverse().map(sub => {
                    return `<div style="display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; padding-left: 20px; border-left: 1px dashed rgba(0,0,0,0.04);">${getDynamicAvatarHtml(sub.userId, sub.username, 20)}<div style="flex: 1; background: rgba(0,0,0,0.01); padding: 6px 10px; border-radius: 8px;"><div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; position: relative;"><span>${sub.username}</span></div><p style="font-size: 12px; color: var(--text-primary); margin-top: 1px; white-space: pre-wrap; word-break: break-word;">${sub.content}</p></div></div>`;
                }).join('');

                const dropdownRepId = `drop-rep-${rep.replyId}`;
                return `<div style="display: flex; gap: 10px; align-items: flex-start; margin-top: 10px; padding-left: 8px; flex-direction: column;"><div style="display: flex; gap: 10px; align-items: flex-start; width: 100%;">${getDynamicAvatarHtml(rep.userId, rep.username, 24)}<div style="flex: 1; background: rgba(0,0,0,0.02); padding: 8px 12px; border-radius: 10px;"><div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; position: relative;"><span>${rep.username}</span><div style="color: var(--text-secondary); font-weight: 400; display: flex; gap: 8px; align-items: center;"><span>${rep.timeLabel || ''}</span><button onclick="window.toggleSubReplyBox('${thread.id}', '${rep.replyId}')" style="background:none; border:none; color:var(--accent-blue); font-size:11px; cursor:pointer; font-weight:600; padding:0;">Balas</button>${canDeleteReply ? `<div style="position: relative; display: inline-block;"><button onclick="window.toggleLettersDropdown(event, '${dropdownRepId}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:2px; display:flex; align-items:center;">${threedotsIcon}</button><div id="${dropdownRepId}" class="threads-dropdown-list" style="display: none; position: absolute; right: 0; top: 20px; background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 100px;"><button onclick="window.deleteReplyComment('${thread.id}', ${safeReplyObj})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; font-weight:600; color: var(--accent-red); cursor: pointer;">Hapus</button></div></div>` : ''}</div></div><p style="font-size: 12px; color: var(--text-primary); margin-top: 2px; white-space: pre-wrap; word-break: break-word;">${rep.content}</p></div></div><div id="sub-reply-box-${rep.replyId}" style="display: none; width: 100%; padding-left: 34px; gap: 8px; align-items: center; margin-top: 4px;"><input type="text" id="sub-reply-input-${rep.replyId}" placeholder="Balas..." style="flex: 1; padding: 6px 10px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;"><button onclick="window.submitSubReply('${thread.id}', '${rep.replyId}')" class="btn-primary" style="padding: 6px 12px; font-size: 11px; margin: 0; width: auto;">Kirim</button></div><div style="width: 100%; padding-left: 24px;">${subRepliesHtml}</div></div>`;
            }).join('');

            let pollHtml = ""; if (thread.poll && Array.isArray(thread.poll.options)) { let totalVotes = 0; thread.poll.options.forEach(o => { if(Array.isArray(o.votes)) totalVotes += o.votes.length; }); const pollOptionsHtml = thread.poll.options.map((opt, idx) => { const votesList = Array.isArray(opt.votes) ? opt.votes : []; const alreadyVotedThisOption = votesList.includes(currentUserId); const pct = totalVotes > 0 ? ((votesList.length / totalVotes) * 100).toFixed(0) : 0; return `<div onclick="window.voteInPoll('${thread.id}', ${idx})" style="position: relative; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; overflow: hidden; align-items: center; margin-bottom: 4px;"><div style="position: absolute; top:0; left:0; bottom:0; width: ${pct}%; background: rgba(52, 199, 89, 0.1); transition: width 0.3s ease;"></div><span style="position: relative; z-index: 2; color: var(--text-primary);">${opt.text} ${alreadyVotedThisOption ? '✓' : ''}</span><span style="position: relative; z-index: 2; color: var(--text-secondary); font-weight: 600;">${pct}% (${votesList.length})</span></div>`; }).join(''); pollHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 4px; background: #fff; padding: 4px 0;">${pollOptionsHtml}<span style="font-size: 11px; color: var(--text-secondary); margin-left: 2px;">Total suara: ${totalVotes}</span></div>`; }

            let mediaHtml = ""; const imagesList = thread.mediaUrlsArray || [];
            if (imagesList.length > 0) {
                const totalCount = imagesList.length; let gridStyle = "grid-template-columns: 1fr 1fr;";
                if (totalCount === 1) gridStyle = "grid-template-columns: 1fr;";
                else if (totalCount === 3) gridStyle = "grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr;";
                else if (totalCount >= 4) gridStyle = "grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;";

                const previewImages = imagesList.slice(0, 4);
                let itemBlocks = previewImages.map((fileObj, index) => {
                    let type = fileObj.type || 'image'; let srcUrl = (fileObj.src || fileObj).replace(/"/g, '&quot;');
                    let extraItemStyle = ""; if (totalCount === 3 && index === 0) extraItemStyle = "grid-row: span 2; aspect-ratio: auto; height: 100%; min-height: 200px;";
                    let mediaTag = type === 'video' ? `<video src="${srcUrl}" muted loop autoplay></video>` : `<img src="${srcUrl}">`;
                    
                    if (index === 3 && totalCount > 4) {
                        return `<div class="grid-media-item" onclick="window.openMediaLightbox('${srcUrl}', '${type}')">${mediaTag}<div class="grid-media-blur-overlay">+${totalCount - 4}</div></div>`;
                    }
                    return `<div class="grid-media-item" style="${extraItemStyle}" onclick="window.openMediaLightbox('${srcUrl}', '${type}')">${mediaTag}</div>`;
                }).join('');
                mediaHtml = `<div class="grid-media-container" style="${gridStyle}">${itemBlocks}</div>`;
            }

            const dropdownThreadId = `drop-thread-${thread.id}`;
            return `<div class="card" style="padding: 16px; margin-bottom: 0;">${thread.isRepost ? `<div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); font-weight:600; margin-bottom:10px; padding-left:48px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg><span>${thread.repostedBy} membagikan ulang</span></div>` : ''}<div style="display: flex; gap: 12px; align-items: flex-start;"><div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0; align-self: stretch;">${getDynamicAvatarHtml(thread.userId, thread.username, 36)}<div style="width: 2px; flex-grow: 1; background: rgba(0,0,0,0.06); margin-top: 6px; display: ${hasReplies ? 'block' : 'none'};"></div></div><div style="flex: 1; display: flex; flex-direction: column; gap: 4px;"><div style="display: flex; justify-content: space-between; align-items: center; position: relative;"><div style="display: flex; flex-direction: column;"><span style="font-weight: 600; font-size: 14px; color: var(--text-primary); cursor: pointer;" onclick="window.openWaUserProfileCard('${thread.userId}')">${thread.username}</span>${thread.location ? `<span style="font-size: 11px; color: var(--accent-blue); font-weight: 500; margin-top: 1px;">📍 ${thread.location}</span>` : ''}</div><div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; color: var(--text-secondary);">${thread.timeLabel || '--:--'}</span>${isMyPost ? `<div style="position: relative; display: inline-block;"><button onclick="window.toggleLettersDropdown(event, '${dropdownThreadId}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:2px; display:flex; align-items:center;">${threedotsIcon}</button><div id="${dropdownThreadId}" class="threads-dropdown-list" style="display: none; position: absolute; right: 0; top: 20px; background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; min-width: 100px;"><button onclick="window.deleteThreadPost('${thread.id}')" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; font-weight:600; color: var(--accent-red); cursor: pointer;">Hapus</button></div></div>` : ''}</div></div><p style="font-size: 14px; line-height: 1.4; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; margin-top: 2px;">${thread.content}</p>${pollHtml} ${mediaHtml}<div style="display: flex; gap: 18px; margin-top: 12px; align-items: center;"><button class="feed-action-btn" onclick="window.toggleLikeThread('${thread.id}', ${hasLiked})" style="color: ${hasLiked ? 'var(--accent-red)' : 'var(--text-secondary)'};"><svg width="19" height="19" viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span style="font-size:13px; font-weight:600;">${likeCount}</span></button><button class="feed-action-btn" onclick="window.toggleReplyBox('${thread.id}')" style="color: var(--text-secondary);"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span style="font-size:13px; font-weight:600;">${repliesArray.length}</span></button><button class="feed-action-btn" onclick="window.repostThread('${thread.id}', '${thread.username}', '${thread.content.replace(/'/g, "\\'")}')" style="color: var(--text-secondary);"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button><button class="feed-action-btn" onclick="window.copyThreadLink('${thread.id}')" style="color: var(--text-secondary);"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button></div><div id="reply-box-${thread.id}" style="display: none; margin-top: 14px; gap: 8px; align-items: center;"><input type="text" id="reply-input-${thread.id}" placeholder="Tulis balasan..." style="flex: 1; padding: 8px 12px; font-size: 13px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); outline: none;"><button onclick="window.submitReply('${thread.id}')" class="btn-primary" style="padding: 8px 14px; font-size: 12px; margin: 0; width: auto;">Balas</button></div><div id="replies-list-${thread.id}">${repliesHtml}</div></div></div></div>`;
        }).join('');
    });
}

// ================= LOGIKA FINANSIAL SISA ANGGARAN =================
const salaryForm = document.getElementById('salary-form'); 
if (salaryForm) { 
    salaryForm.addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const rawSalary = document.getElementById('input-gajian').value.replace(/\./g, ""); 
        const salaryDate = document.getElementById('input-tgl-gajian').value; 
        try { 
            await setDoc(doc(db, "salary_settings", currentUserId), { amount: parseInt(rawSalary), paydayDate: parseInt(salaryDate) }); 
            showCustomToast("Gaji utama disimpan!"); 
        } catch (err) { 
            console.error(err); 
        } 
    }); 
}

const btnResetSalary = document.getElementById('btn-reset-salary'); 
if (btnResetSalary) { 
    btnResetSalary.addEventListener('click', async (e) => { 
        e.preventDefault();
        if (await showCustomConfirm("Hapus aturan gajian?")) { 
            try { 
                await setDoc(doc(db, "salary_settings", currentUserId), { amount: 0, paydayDate: 1 }); 
                document.getElementById('salary-form').reset(); 
                showCustomToast("Anggaran direset!"); 
            } catch (err) { 
                console.error(err); 
            } 
        } 
    }); 
}

// FIX 2: Perbaikan Penanganan Tanggal & Pemicu Sinkronisasi
const txForm = document.getElementById('transaction-form'); 
if (txForm) { 
    txForm.addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        
        const nominalInput = document.getElementById('input-nominal');
        const noteInput = document.getElementById('input-note');
        const categorySelect = document.getElementById('input-category');

        const rawNominal = nominalInput ? nominalInput.value.replace(/\./g, "") : ""; 
        if (!rawNominal) { 
            showCustomToast("Masukkan nominal transaksi!"); 
            return; 
        }

        const note = noteInput ? noteInput.value.trim() : ""; 
        let category = categorySelect ? categorySelect.value : ""; 
        if (!category) { 
            category = "Lain-lain"; 
        } 
        
        // Simpan dalam format angka murni tanggal (Ymd) agar lolos filter live calculations bawaan kamu
        const today = new Date();
        const dateStringYmd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        try { 
            await addDoc(collection(db, "transactions"), { 
                userId: currentUserId, 
                nominal: parseInt(rawNominal), 
                category: category, 
                note: note, 
                date: parseInt(dateStringYmd), // Disimpan sebagai Integer Ymd
                time: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`, 
                createdAt: today.getTime() 
            }); 
            
            txForm.reset(); 
            showCustomToast("Pengeluaran berhasil tercatat!"); 
            
            const targetY = filterYear && filterYear.value ? filterYear.value : String(today.getFullYear());
            const targetM = filterMonth && filterMonth.value ? filterMonth.value : String(today.getMonth() + 1).padStart(2, '0');
            triggerLiveCalculations(targetY, targetM);
        } catch (err) { 
            console.error("Firebase Transaksi Error: ", err); 
            showCustomToast("Gagal menyimpan transaksi.");
        } 
    }); 
}

const categoryForm = document.getElementById('category-form');
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const newCatName = document.getElementById('input-new-category').value.trim(); const rawBudget = document.getElementById('input-new-category-budget').value.replace(/\./g, "");
        if (activeCategories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) { showCustomToast("Kategori Budget sudah ada!"); return; }
        try { await addDoc(collection(db, "categories"), { userId: currentUserId, name: newCatName, allocatedBudget: parseInt(rawBudget), createdAt: new Date().getTime() }); document.getElementById('input-new-category').value = ""; document.getElementById('input-new-category-budget').value = ""; } catch (err) { console.error(err); }
    });
}

let unsubscribeCategories = null;
function listenToCategories() {
    if (unsubscribeCategories) unsubscribeCategories();
    unsubscribeCategories = onSnapshot(query(collection(db, "categories"), where("userId", "==", currentUserId)), (snapshot) => {
        activeCategories = []; 
        snapshot.forEach(doc => { 
            let d = doc.data(); 
            d.id = doc.id; 
            activeCategories.push(d); 
        }); 
        activeCategories.sort((a,b) => a.createdAt - b.createdAt);
        
        const selectEl = document.getElementById('input-category'); 
        if (selectEl) {
            // FIX 3: Tambahkan opsi default 'Lain-lain' saat dropdown kategori masih kosong agar form tidak mogok tervalidasi HTML5
            if (activeCategories.length === 0) {
                selectEl.innerHTML = `<option value="Lain-lain">Lain-lain</option>`;
            } else {
                selectEl.innerHTML = activeCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            }
        }
        listenToSalaryAndTransactions();
    });
}

window.deleteCategory = async (id) => { 
    if (await showCustomConfirm("Hapus kategori budget ini?")) { 
        try { await deleteDoc(doc(db, "categories", id)); showCustomToast("Kategori budget dihapus."); } catch (err) { console.error(err); } 
    } 
};

let unsubscribeTx = null, unsubscribeSalary = null;
function listenToSalaryAndTransactions() {
    if (unsubscribeTx) unsubscribeTx(); if (unsubscribeSalary) unsubscribeSalary();
    
    const selectedYear = filterYear && filterYear.value ? filterYear.value : String(new Date().getFullYear());
    const selectedMonth = filterMonth && filterMonth.value ? filterMonth.value : String(new Date().getMonth() + 1).padStart(2, '0');
    
    unsubscribeSalary = onSnapshot(doc(db, "salary_settings", currentUserId), (salaryDoc) => {
        if (salaryDoc.exists()) { const data = salaryDoc.data(); userSalaryConfig.amount = data.amount || 0; userSalaryConfig.date = data.paydayDate || 1; document.getElementById('label-salary-amount').innerText = `Rp ${userSalaryConfig.amount.toLocaleString('id-ID')}`; document.getElementById('label-salary-date').innerText = userSalaryConfig.date; }
        triggerLiveCalculations(selectedYear, selectedMonth);
    });
}

function triggerLiveCalculations(year, month) {
    if (unsubscribeTx) unsubscribeTx();
    
    const startDateInt = parseInt(`${year}${String(month).padStart(2, '0')}01`);
    const maxDaysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDateInt = parseInt(`${year}${String(month).padStart(2, '0')}${String(maxDaysInMonth).padStart(2, '0')}`);

    unsubscribeTx = onSnapshot(query(collection(db, "transactions"), where("userId", "==", currentUserId), where("date", ">=", startDateInt), where("date", "<=", endDateInt)), (snapshot) => {
        let totalExpense = 0; let txList = []; let categoryTotals = {};
        snapshot.forEach(doc => { let data = doc.data(); data.id = doc.id; txList.push(data); totalExpense += data.nominal; categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.nominal; });
        txList.sort((a,b) => b.createdAt - a.createdAt); renderHistoryList(txList); updateCalculatedDOMBalances(totalExpense, categoryTotals);
    });
}

function updateCalculatedDOMBalances(totalExpense, categoryTotals) {
    let sisaGajiUtama = userSalaryConfig.amount - totalExpense;
    if (document.getElementById('total-monthly')) { document.getElementById('total-monthly').innerText = `Rp ${sisaGajiUtama.toLocaleString('id-ID')}`; document.getElementById('total-monthly').style.color = sisaGajiUtama < 0 ? "var(--accent-red)" : "inherit"; }
    if (document.getElementById('analytics-grand-total')) document.getElementById('analytics-grand-total').innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
    
    const balanceListEl = document.getElementById('dash-categories-balance-list');
    if (balanceListEl) {
        balanceListEl.innerHTML = activeCategories.map(c => {
            const used = categoryTotals[c.name] || 0; const allocated = c.allocatedBudget || 0; const remainingBudget = allocated - used;
            return `<div class="ios-list-row"><span class="ios-label">${c.name}</span><span class="ios-value" style="color:${remainingBudget < 0 ? 'var(--ios-destructive)':'var(--ios-switch-on)'}; font-weight:600;">Rp ${remainingBudget.toLocaleString('id-ID')} / Rp ${allocated.toLocaleString('id-ID')}</span></div>`;
        }).join('');
    }

    const manageListEl = document.getElementById('category-manage-list'); 
    if (manageListEl) { 
        manageListEl.innerHTML = activeCategories.map(c => {
            const used = categoryTotals[c.name] || 0; const allocated = c.allocatedBudget || 0; const remainingBudget = allocated - used;
            return `<div style="display:flex; flex-direction:column; background:var(--ios-bg-group); padding:10px; margin-bottom:6px; border-radius:10px; font-size:13px;"><div style="display:flex; justify-content:space-between; font-weight:600;"><span>${c.name}</span><button type="button" onclick="window.deleteCategory('${c.id}')" style="background:none; border:none; color:var(--ios-destructive); cursor:pointer; font-weight:600;">Hapus</button></div><div style="display:flex; justify-content:space-between; margin-top:4px; font-size:12px; color:var(--ios-text-secondary);"><span>Limit: Rp ${allocated.toLocaleString('id-ID')}</span><span>Sisa: <b style="color:${remainingBudget < 0 ? 'var(--ios-destructive)':'var(--ios-switch-on)'}">Rp ${remainingBudget.toLocaleString('id-ID')}</b></span></div></div>`;
        }).join('');
    }
    renderAnalytics(categoryTotals, totalExpense);
}

function renderAnalytics(totals, grandTotal) {
    const container = document.getElementById('analytics-list'); if (!container) return; container.innerHTML = "";
    if (grandTotal === 0) { if (expenseChartInstance) { expenseChartInstance.destroy(); expenseChartInstance = null; } return; }
    if (expenseChartInstance) expenseChartInstance.destroy(); const ctx = document.getElementById('expenseChart');
    if (ctx) { expenseChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(totals), datasets: [{ data: Object.values(totals), backgroundColor: ['#ff9500', '#ff2d55', '#5ac8fa', '#5856d6', '#34c759', '#ffcc00', '#8e8e93'].slice(0, Object.keys(totals).length), borderWidth: 0, borderRadius: 16, spacing: 6, cutout: '75%' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } } } } }); }
    for (let cat in totals) { let pct = ((totals[cat] / grandTotal) * 100).toFixed(0); container.innerHTML += `<div class="analytics-item"><div class="analytics-labels"><span>${cat}</span><b>Rp ${totals[cat].toLocaleString('id-ID')} (${pct}%)</b></div><div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div></div>`; }
}

function renderHistoryList(items) {
    const container = document.getElementById('history-list'); if (!container) return; container.innerHTML = ""; if (items.length === 0) { container.innerHTML = "<p class='subtitle'>Tidak ada catatan.</p>"; return; }
    let groups = {}; 
    items.forEach(item => { 
        if (!groups[item.date]) groups[item.date] = []; 
        groups[item.date].push(item); 
    });
    for (let date in groups) {
        // Mengubah string angka Ymd kembali ke format tanggal lokal (Leluhur string slice)
        const dateStr = date.toString();
        const formattedDate = new Date(`${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`);
        let groupHtml = `<div class="day-group"><div class="day-title">${formattedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>`;
        groups[date].forEach(item => { 
            groupHtml += `<div class="history-item"><div class="item-info"><p>${item.category}</p><span>[${item.time || '--:--'}] • ${item.note || 'Tanpa Catatan'}</span></div><div class="item-amount"><span>Rp ${item.nominal.toLocaleString('id-ID')}</span><button class="btn-delete" onclick="window.deleteTx('${item.id}')">Hapus</button></div></div>`; 
        }); 
        container.innerHTML += groupHtml + `</div>`;
    }
}

window.deleteTx = async (id) => { if (await showCustomConfirm("Hapus transaksi?")) { try { await deleteDoc(doc(db, "transactions", id)); } catch (err) { console.error(err); } } };

function setupBulkDeleteListeners() {
    const deleteBatchByQuery = async (startRange, endRange, confirmMessage) => {
        if (!await showCustomConfirm(confirmMessage)) return;
        try { const q = query(collection(db, "transactions"), where("userId", "==", currentUserId), where("date", ">=", startRange), where("date", "<=", endRange)); const snapshot = await getDocs(q); if (snapshot.empty) { showCustomToast("Tidak ada data."); return; } await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, "transactions", d.id)))); showCustomToast("Histori dibersihkan!"); } catch (err) { console.error(err); }
    };
    document.getElementById('btn-clear-day')?.addEventListener('click', () => { 
        const today = new Date();
        const todayInt = parseInt(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);
        deleteBatchByQuery(todayInt, todayInt, "Hapus transaksi hari ini?"); 
    });
    document.getElementById('btn-clear-month')?.addEventListener('click', () => { 
        const maxDays = new Date(parseInt(document.getElementById('filter-yr').value), parseInt(document.getElementById('filter-mth').value), 0).getDate();
        const start = parseInt(`${document.getElementById('filter-yr').value}${String(document.getElementById('filter-mth').value).padStart(2, '0')}01`);
        const end = parseInt(`${document.getElementById('filter-yr').value}${String(document.getElementById('filter-mth').value).padStart(2, '0')}${String(maxDays).padStart(2, '0')}`);
        deleteBatchByQuery(start, end, "Hapus pengeluaran bulan ini?"); 
    });
    document.getElementById('btn-clear-year')?.addEventListener('click', () => { 
        const start = parseInt(`${document.getElementById('filter-yr').value}0101`);
        const end = parseInt(`${document.getElementById('filter-yr').value}1231`);
        deleteBatchByQuery(start, end, "Hapus pengeluaran tahun ini?"); 
    });
}

const dragContainer = document.getElementById('drag-grid-container');
if (dragContainer) {
    document.querySelectorAll('.draggable-card').forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => { if (['INPUT', 'SELECT', 'BUTTON', 'OPTION'].includes(e.target.tagName)) { e.preventDefault(); return; } draggable.classList.add('dragging'); });
        draggable.addEventListener('dragend', () => { draggable.classList.remove('dragging'); localStorage.setItem('user_card_order', JSON.stringify(Array.from(document.querySelectorAll('.draggable-card')).map(card => card.querySelector('h3').innerText))); });
    });
    dragContainer.addEventListener('dragover', (e) => { e.preventDefault(); const draggingCard = document.querySelector('.dragging'); if (draggingCard) { const afterElement = getDragAfterElement(dragContainer, e.clientX); if (afterElement == null) dragContainer.appendChild(draggingCard); else dragContainer.insertBefore(draggingCard, afterElement); } });
}
function getDragAfterElement(container, x) { return [...container.querySelectorAll('.draggable-card:not(.dragging)')].reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = x - box.left - box.width / 2; return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }
