// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Ambil parameter role dari URL (?role=admin atau ?role=user)
    const urlParams = new URLSearchParams(window.location.search);
    let currentRole = urlParams.get('role');
    const loginTitle = document.getElementById('loginTitle');
    
    // Elemen tombol switch
    const switchUserBtn = document.getElementById('switchUser');
    const switchAdminBtn = document.getElementById('switchAdmin');

    // --- Logika Penentuan Role dan Tampilan Judul ---
    if (!currentRole || (currentRole !== 'admin' && currentRole !== 'user')) {
        currentRole = 'user';
    }

    if (currentRole === 'admin') {
        loginTitle.textContent = "Masuk sebagai Administrator";
        switchUserBtn.classList.remove('d-none');
    } else {
        loginTitle.textContent = "Masuk sebagai Pelanggan (User)";
        switchAdminBtn.classList.remove('d-none');
    }

    // --- Logika Hide/Show Password ---
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-eye-fill');
        icon.classList.toggle('bi-eye-slash-fill');
    });


    // --- Logika Simulasi Login ---
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        errorDiv.classList.add('d-none'); 

        let success = false;
        let redirectPage = '';

        if (currentRole === 'admin') {
            if (username === 'admin' && password === 'admin123') { 
                success = true;
                redirectPage = 'admin.html';
            }
        } else if (currentRole === 'user') {
            if (username === 'user' && password === '12345') { 
                success = true;
                redirectPage = 'user.html'; 
            }
        }

        if (success) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', currentRole);
            window.location.href = redirectPage; 
        } else {
            errorDiv.classList.remove('d-none');
        }
    });
}); 