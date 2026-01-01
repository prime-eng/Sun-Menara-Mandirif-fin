// js/swift_forms.js

// Fungsi untuk menampilkan kembali ke menu utama valas (valas adalah ID div utama)
function backToValas(){
    showContent('valas');
}

// Fungsi untuk menampilkan form tertentu (dipanggil dari tombol di user.html)
function showForm(id){
    document.getElementById("forms").innerHTML = getForm(id);
    document.getElementById("confirm").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    // Pastikan menu utama valas tetap terlihat
    document.getElementById('valas').classList.remove('hidden'); 
}

// --- FUNGSI UTAMA: MENGHASILKAN FORM MT ---
function getForm(id){
    // Template dasar tombol: Lanjutkan (Biru Gelap) dan Kembali (Abu-abu)
    const base=`
        <button class="btn btn-primary bg-primary-bank" onclick="processTransaction('${id}')">Lanjutkan</button>
        <button class="btn btn-secondary" onclick="backToValas()">Kembali</button>
    `;

    // --- MT103 Form ---
    if(id==="mt103Form") return `
        <div class="section card-content mt-3"><h3>Form MT103 (Single Customer Credit Transfer)</h3>
        <div class="form-group"><label>Pengirim</label><input id="sender" class="form-control"></div>
        <div class="form-group"><label>Rekening Pengirim</label><input id="senderAcc" class="form-control"></div>
        <div class="form-group"><label>Penerima</label><input id="receiver" class="form-control"></div>
        <div class="form-group"><label>Rekening Penerima</label><input id="receiverAcc" class="form-control"></div>
        <div class="form-group"><label>Bank Penerima (SWIFT)</label><input id="swift" class="form-control"></div>
        <div class="form-group"><label>Currency</label><input id="curr" value="USD" class="form-control"></div>
        <div class="form-group"><label>Nominal</label><input id="amt" type="number" class="form-control"></div>
        <div class="form-group"><label>Charge Type</label>
            <select id="charge" class="form-select"><option>OUR</option><option>BEN</option><option>SHA</option></select></div>
        ${base}</div>`;
        
    // --- MT760 Form ---
    if(id==="mt760Form") return `
        <div class="section card-content mt-3"><h3>Form MT760 (Guarantee/Standby LC)</h3>
        <div class="form-group"><label>Applicant</label><input id="sender" class="form-control"></div>
        <div class="form-group"><label>Beneficiary</label><input id="receiver" class="form-control"></div>
        <div class="form-group"><label>Guarantee Amount</label><input id="amt" type="number" class="form-control"></div>
        <div class="form-group"><label>Currency</label><input id="curr" value="USD" class="form-control"></div>
        ${base}</div>`;

    // --- Form Lain (Contoh) ---
    if(id==="mt799Form") return `
        <div class="section card-content mt-3"><h3>Form MT799 (Free Format Message)</h3>
        <div class="form-group"><label>Pengirim</label><input id="sender" class="form-control"></div>
        <div class="form-group"><label>Penerima</label><input id="receiver" class="form-control"></div>
        <div class="form-group"><label>Pesan Free Text</label><textarea id="note" class="form-control"></textarea></div>
        ${base}</div>`;

    // Jika form tidak ditemukan
    return `<div class="alert alert-warning mt-3">Formulir untuk ${id} belum dikonfigurasi.</div>`;
}


// --- FUNGSI KRITIS: MENGIRIM DATA KE BACKEND ---
async function processTransaction(id) {
    // 1. Kumpulkan Data
    const dataToSend = {};
    document.querySelectorAll("#forms input, #forms select, #forms textarea").forEach(el=>{
        // Tambahkan validasi dasar untuk input kosong
        if (!el.value && el.id !== 'note') {
            alert(`Kolom ${el.id.toUpperCase()} tidak boleh kosong.`);
            return;
        }
        dataToSend[el.id] = el.value;
    });

    // Cek apakah dataToSend memiliki properti, untuk menghindari pengiriman kosong
    if (Object.keys(dataToSend).length === 0) return;

    // Tampilkan loading screen
    document.getElementById("confirm").innerHTML = `
        <div class="alert alert-info text-center">Memproses transaksi... Mohon tunggu.</div>`;
    document.getElementById("result").innerHTML = ''; // Hapus hasil sebelumnya

    // 2. Kirim Data ke Server Aplikasi (BACKEND - Ubuntu Server 2)
    try {
        // Ganti URL ini dengan URL API backend Anda yang sebenarnya
        const apiEndpoint = 'https://api.bankanda.com/v1/transfer/' + id.replace('Form', '');
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Ambil token dari penyimpanan lokal (ditetapkan saat login)
                // 'Authorization': 'Bearer ' + localStorage.getItem('authToken') 
            },
            body: JSON.stringify(dataToSend)
        });

        const resultData = await response.json();

        // 3. Tampilkan Hasil dari Server
        if (response.ok) {
            document.getElementById("result").innerHTML = `
                <div class="alert alert-success mt-3">Transaksi Berhasil! Ref: ${resultData.refId || 'N/A'}</div>
                <div class="card-content mt-3">
                    <h4>Pesan SWIFT (Simulasi Backend)</h4>
                    <pre id="swiftOutput">${JSON.stringify(resultData.swiftMsg || dataToSend, null, 2)}</pre>
                    ${getDownloadButtons(id)}
                </div>`;
        } else {
            // Tangani error dari server (misal: saldo tidak cukup, otorisasi gagal)
            document.getElementById("result").innerHTML = `
                <div class="alert alert-danger mt-3">Transaksi Gagal: ${resultData.error || 'Kesalahan Server. Mohon cek log.'}</div>`;
        }

    } catch(error) {
        // Tangani kesalahan jaringan atau server mati
        console.error("Fetch Error:", error);
        document.getElementById("result").innerHTML = `
            <div class="alert alert-danger mt-3">Kesalahan Koneksi Jaringan. Tidak dapat menghubungi server.</div>`;
    } finally {
        document.getElementById("confirm").innerHTML = ''; // Hapus loading screen
    }
}

// --- FUNGSI DOWNLOAD (Tambahan) ---
function getDownloadButtons(id) {
    return `
        <button class="btn btn-download btn-accent-success" onclick="downloadSWIFT('${id}')">Download .txt</button>
        <button class="btn btn-pdf btn-accent-danger" onclick="downloadPDF('${id}')">Download PDF</button>
        <button class="btn btn-primary" onclick="printSWIFT()">Print</button>
    `;
}

function downloadSWIFT(id){
    const text=document.getElementById("swiftOutput").innerText;
    const blob=new Blob([text],{type:"text/plain"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=id.replace("Form","")+"_SWIFT.txt";
    link.click();
}

function downloadPDF(id){
    // Membutuhkan window.jspdf
    if (!window.jspdf) {
        alert("Library jsPDF belum dimuat.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("courier","normal");
    doc.setFontSize(11);
    const text=document.getElementById("swiftOutput").innerText;
    doc.text(text, 10, 10);
    doc.save(id.replace("Form","")+"_SWIFT.pdf");
}

function printSWIFT(){
    const text=document.getElementById("swiftOutput").innerText;
    const w=window.open("","PRINT","height=600,width=800");
    w.document.write("<html><head><title>Print SWIFT</title></head><body><pre>"+text+"</pre></body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
}