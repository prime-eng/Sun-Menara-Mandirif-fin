// ===================================================
// UTILITY FUNCTIONS (SHARED)
// ===================================================

function formatRupiah(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function getTransactions() {
    const transactionsJson = localStorage.getItem('transactions') || '[]';
    try {
        return JSON.parse(transactionsJson);
    } catch (e) {
        console.error("Error parsing transactions:", e);
        return [];
    }
}

function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

// ===================================================
// RIWAYAT TRANSAKSI USER
// ===================================================

function renderUserHistory() {
    const transactions = getTransactions();
    const logBody = document.getElementById('userTransactionLog');
    logBody.innerHTML = '';

    if (transactions.length === 0) {
        logBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada transaksi.</td></tr>`;
        return;
    }

    [...transactions].reverse().forEach(tx => {
        const statusClass = tx.status === 'Berhasil' ? 'bg-success' : 'bg-danger';

        const nominal =
            tx.currency === 'IDR'
                ? formatRupiah(tx.amount)
                : new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: tx.currency || 'USD'
                }).format(tx.amount);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(tx.timestamp).toLocaleString('id-ID')}</td>
            <td>${tx.id}</td>
            <td>${tx.type}</td>
            <td class="fw-bold">${nominal}</td>
            <td>${tx.currency}</td>
            <td><span class="badge ${statusClass} text-white">${tx.status}</span></td>
        `;
        logBody.appendChild(row);
    });
}

// ===================================================
// TRANSFER RUPIAH (IDR) – FIXED
// ===================================================

function handleTransferIDR(event) {
    event.preventDefault();

    const senderName = document.getElementById('senderNameIDR').value;
    const senderNumber = document.getElementById('senderNumberIDR').value;
    const recipientName = document.getElementById('recipientNameIDR').value;
    const recipientNumber = document.getElementById('recipientNumberIDR').value;
    const amount = Number(document.getElementById('transferAmountIDR').value);
    const notes = document.getElementById('transferNotesIDR').value || '-';
    const messageDiv = document.getElementById('rupiahTransferMessage');

    if (isNaN(amount) || amount < 10000 || senderNumber === recipientNumber) {
        messageDiv.className = 'alert alert-danger mt-3';
        messageDiv.textContent = 'Transfer gagal. Nominal minimal Rp10.000 dan rekening tidak boleh sama.';
        messageDiv.classList.remove('d-none');
        return;
    }

    const tx = {
        timestamp: new Date().toISOString(),
        id: 'IDR' + Math.floor(Math.random() * 1000000),
        type: 'Transfer Rupiah',
        amount: amount,
        currency: 'IDR',
        status: 'Berhasil',
        senderName,
        senderNumber,
        recipientName,
        recipientNumber,
        notes
    };

    const transactions = getTransactions();
    transactions.push(tx);
    saveTransactions(transactions);

    messageDiv.className = 'alert alert-success mt-3';
    messageDiv.textContent = `Transfer ${formatRupiah(amount)} ke ${recipientName} berhasil.`;
    messageDiv.classList.remove('d-none');

    document.getElementById('rupiahTransferForm').reset();
    renderUserHistory();
}


