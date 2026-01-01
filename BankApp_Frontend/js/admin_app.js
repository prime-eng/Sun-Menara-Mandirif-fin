// js/admin_app.js

// ===================================================
// KONFIGURASI
// ===================================================
const POLLING_INTERVAL = 5000;
let lastTransactionCount = 0;

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function getTransactions() {
    try {
        const data = localStorage.getItem('transactions');
        console.log("Raw localStorage data:", data); // Debug log
        const transactions = data ? JSON.parse(data) : [];
        console.log("Parsed transactions:", transactions); // Debug log
        return transactions;
    } catch (err) {
        console.error("Gagal parse transaksi:", err);
        return [];
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

function formatRupiah(amount) {
    return typeof amount === 'number' && !isNaN(amount)
        ? new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
        : 'Rp 0';
}

function formatValas(amount, currency = 'USD') {
    return typeof amount === 'number' && !isNaN(amount)
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2
        }).format(amount)
        : `${currency} 0.00`;
}

// ===================================================
// ADMIN ACTION
// ===================================================

function clearTransactionHistory() {
    if (!confirm("Yakin hapus SEMUA transaksi?")) return;

    localStorage.removeItem('transactions');
    lastTransactionCount = 0;
    processTransactions();

    const alerts = document.getElementById('transactionAlerts');
    if (alerts) {
        alerts.className = 'alert alert-danger';
        alerts.innerHTML = `<i class="bi bi-trash-fill me-2"></i> Semua transaksi dihapus.`;
        setTimeout(() => alerts.classList.add('d-none'), 4000);
    }
}

// ===================================================
// CORE PROCESS
// ===================================================

function processTransactions() {
    const transactions = getTransactions();

    // Show notifications for new transactions regardless of active section
    if (lastTransactionCount && transactions.length > lastTransactionCount) {
        const newCount = transactions.length - lastTransactionCount;
        showNotification(`${newCount} transaksi baru telah ditambahkan`, 'success');
    }
    lastTransactionCount = transactions.length;

    const logSection = document.getElementById('transactionLog');
    const ledgerSection = document.getElementById('ledgerBook');

    if (logSection && !logSection.classList.contains('hidden')) {
        renderTransactionLog(transactions);
    }

    if (ledgerSection && !ledgerSection.classList.contains('hidden')) {
        calculateAndRenderLedger(transactions);
    }
}

// ===================================================
// RENDER TRANSACTION LOG
// ===================================================

function renderTransactionLog(transactions) {
    const tbody = document.getElementById('transactionTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!transactions.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada transaksi</td></tr>`;
        return;
    }

    [...transactions].reverse().forEach(tx => {
        const nominal = Number(tx.amount);
        const statusClass =
            tx.status === 'Berhasil' ? 'bg-success' :
            tx.status === 'Gagal' ? 'bg-danger' : 'bg-warning';

        const nominalView =
            tx.currency === 'IDR'
                ? formatRupiah(nominal)
                : formatValas(nominal, tx.currency);

        // Format timestamp properly
        const timestamp = tx.timestamp ? new Date(tx.timestamp).toLocaleString('id-ID') : '-';

        tbody.innerHTML += `
            <tr>
                <td>${timestamp}</td>
                <td>${tx.id || '-'}</td>
                <td>${tx.type || '-'}</td>
                <td class="fw-bold">${nominalView}</td>
                <td>${tx.currency || '-'}</td>
                <td><span class="badge ${statusClass}">${tx.status || '-'}</span></td>
            </tr>
        `;
    });
}

// ===================================================
// LEDGER & METRICS
// ===================================================

function calculateAndRenderLedger(transactions) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const result = {
        dailyIDR: 0,
        weeklyIDR: 0,
        monthlyIDR: 0,
        totalValas: 0,
        summary: {}
    };

    transactions
        .filter(tx => tx.status === 'Berhasil')
        .forEach(tx => {
            const amount = Number(tx.amount);
            if (isNaN(amount)) return;

            const type = tx.type || 'Lainnya';
            if (!result.summary[type]) {
                result.summary[type] = { count: 0, idr: 0, usd: 0 };
            }

            result.summary[type].count++;

            const txDate = new Date(tx.timestamp);
            const txDateStart = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

            if (tx.currency === 'IDR') {
                if (txDateStart.getTime() === todayStart.getTime()) result.dailyIDR += amount;
                if (txDateStart >= startOfWeek) result.weeklyIDR += amount;
                if (txDateStart >= startOfMonth) result.monthlyIDR += amount;
                result.summary[type].idr += amount;
            } else {
                // All non-IDR currencies are VALAS
                result.totalValas += amount;
                result.summary[type].usd += amount; // Reuse usd field for valas total
            }
        });

    // Update cards
    const dailyVolumeIDR = document.getElementById('dailyVolumeIDR');
    const weeklyVolumeIDR = document.getElementById('weeklyVolumeIDR');
    const monthlyVolumeIDR = document.getElementById('monthlyVolumeIDR');
    const totalVolumeValas = document.getElementById('totalVolumeValas');

    if (dailyVolumeIDR) dailyVolumeIDR.textContent = formatRupiah(result.dailyIDR);
    if (weeklyVolumeIDR) weeklyVolumeIDR.textContent = formatRupiah(result.weeklyIDR);
    if (monthlyVolumeIDR) monthlyVolumeIDR.textContent = formatRupiah(result.monthlyIDR);
    if (totalVolumeValas) totalVolumeValas.textContent = formatValas(result.totalValas, 'USD');

    // Summary table
    const tbody = document.getElementById('summaryTableBody');
    tbody.innerHTML = '';

    const entries = Object.entries(result.summary);
    if (!entries.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Belum ada data</td></tr>`;
        return;
    }

    entries.sort(([a], [b]) => a.localeCompare(b)).forEach(([type, data]) => {
        tbody.innerHTML += `
            <tr>
                <td>${type}</td>
                <td>${data.count}</td>
                <td>${formatRupiah(data.idr)}</td>
                <td class="fw-bold text-success">${formatValas(data.usd, 'USD')}</td>
            </tr>
        `;
    });
}

// ===================================================
// DUMMY EXPORT (ANTI ERROR HTML)
// ===================================================
function renderAdminTransactions() { processTransactions(); }
function calculateLedgerMetrics() { processTransactions(); }

// ===================================================
// INIT
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard loaded, starting transaction processing...');
    processTransactions(); // Load immediately
    setInterval(processTransactions, POLLING_INTERVAL);
});

// Also try to load on window load as backup
window.addEventListener('load', () => {
    console.log('Window loaded, ensuring transactions are processed...');
    processTransactions();
});
