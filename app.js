import { auth } from './auth.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Proyek Anda (Terkunci)
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
let userSalaryConfig = { amount: 0, date: 1 };
let expenseChartInstance = null;
let activeCategories = [];

// 1. Sinkronisasi Navigasi Tab (Dashboard & Histori)
const tabs = document.querySelectorAll('.nav-item');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.id.replace('nav', 'pane')).classList.add('active');
    });
});

// 2. Format Input Rupiah Real-Time untuk kolom Pengeluaran & Gajian
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

// 3. Konfigurasi Dropdown Tahun & Bulan Secara Dinamis
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
        initApp();
    }
});

function initApp() {
    listenToCategories(); 
    listenToSalaryAndTransactions();
    const filterMonth = document.getElementById('filter-month');
    if (filterMonth) filterMonth.addEventListener('change', listenToSalaryAndTransactions);
    if (filterYear) filterYear.addEventListener('change', listenToSalaryAndTransactions);
}

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
            alert("Aturan uang gajian berhasil disimpan!");
        } catch (err) {
            console.error("Gagal menyimpan gaji:", err);
        }
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
        
        if(!category) { alert("Silakan tambah dan pilih kategori terlebih dahulu!"); return; }

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        try {
            await addDoc(collection(db, "transactions"), {
                userId: currentUserId,
                nominal: parseInt(rawNominal),
                category: category,
                note: note,
                date: dateString,
                createdAt: new Date().getTime()
            });
            txForm.reset();
        } catch (err) {
            console.error("Gagal menyimpan transaksi:", err);
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
            alert("Kategori ini sudah terdaftar!");
            return;
        }

        try {
            await addDoc(collection(db, "categories"), {
                userId: currentUserId,
                name: newCatName,
                createdAt: new Date().getTime()
            });
            document.getElementById('input-new-category').value = "";
        } catch (err) {
            console.error("Gagal menambah kategori:", err);
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
    if (confirm("Hapus kategori ini? Catatan lama tidak akan hilang, namun tidak bisa dipilih di transaksi baru.")) {
        await deleteDoc(doc(db, "categories", id));
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
                totalMonthlyEl.style.color = "var(--text-primary)";
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
            document.getElementById('input-gajian').value = userSalaryConfig.amount.toLocaleString('id-ID');
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

// 8. Render Teks Progress Bar & DIAGRAM LINGKARAN (Chart.js)
function renderAnalytics(totals, grandTotal) {
    const container = document.getElementById('analytics-list');
    if (!container) return;
    container.innerHTML = "";
    
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
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 12 } }
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
            groupHtml += `
                <div class="history-item">
                    <div class="item-info">
                        <p>${item.category}</p>
                        <span>${item.note || 'Tanpa Catatan'}</span>
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

window.deleteTx = async (id) => {
    if (confirm("Hapus catatan ini?")) { await deleteDoc(doc(db, "transactions", id)); }
};

// ================= SCRIPT ATUR URUTAN POSISI KARTU (DRAG & DROP LANGSUNG PADA BADAN KARTU) =================
const dragContainer = document.getElementById('drag-grid-container');

if (dragContainer) {
    const draggables = document.querySelectorAll('.draggable-card');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            // Cegah drag jika user sedang mengklik atau memfokuskan elemen input/select/button di dalam kartu
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