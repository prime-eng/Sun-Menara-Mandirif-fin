from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from pymongo import MongoClient
import bcrypt
import jwt
import datetime
import random
import string
from bson import ObjectId

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your_secret_key'  # Ganti dengan key aman

# Temporary: Console-based email for testing (replace with real email service later)
def send_email_console(to_email, subject, body):
    """Send email via console for testing purposes"""
    print(f"\n=== EMAIL SIMULATION ===")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print("=" * 50)
    return True

# Flask-Mail configuration (commented out for now)
# app.config['MAIL_SERVER'] = 'smtp.gmail.com'
# app.config['MAIL_PORT'] = 587
# app.config['MAIL_USE_TLS'] = True
# app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
# app.config['MAIL_PASSWORD'] = 'your-app-password'
# app.config['MAIL_DEFAULT_SENDER'] = 'noreply@bankapp.com'
# mail = Mail(app)

# Koneksi MongoDB
try:
    client = MongoClient('mongodb://127.0.0.1:27017/', serverSelectionTimeoutMS=5000)
    db = client['bankapp']  # Pastikan nama database 'bankapp' didefinisikan dengan jelas
    # Cek koneksi
    client.server_info()
    print("Koneksi MongoDB Berhasil!")
    # Koleksi
    users = db['users']
    transactions = db['transactions']
    print(f"Database aktif: {db.name}")
    print(f"Koleksi users: {users.name}")
except Exception as e:
    print(f"Gagal koneksi ke MongoDB: {e}")
    db = None
    users = None
    transactions = None

# Endpoint Register
@app.route('/register', methods=['POST'])
def register():
    if users is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json(force=True)
    print(f"Data yang diterima: {data}")  # Debugging print
    if not data or 'user' not in data or 'email' not in data or 'password' not in data:
        print("Data tidak lengkap")  # Debugging print
        return jsonify({'message': 'Data tidak lengkap'}), 400

    if users.find_one({'email': data['email']}) or users.find_one({'user': data['user']}):
        return jsonify({'message': 'User already exists'}), 400

    # Use provided verification code or generate one
    verification_code = data.get('verification_code', ''.join(random.choices(string.ascii_uppercase + string.digits, k=6)))

    # Store temporary user data with verification code
    temp_user = {
        'user': data['user'],
        'email': data['email'],
        'password': bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'verification_code': verification_code,
        'verified': False,
        'created_at': datetime.datetime.utcnow()
    }

    try:
        # Save to temporary collection or pending users
        pending_users = db['pending_users']
        result = pending_users.insert_one(temp_user)

        print(f"User {data['user']} registered with verification code: {verification_code}")

        return jsonify({'message': 'Registrasi berhasil. Silakan verifikasi email Anda.', 'temp_id': str(result.inserted_id)}), 200

    except Exception as e:
        print(f"Error saat menyimpan user sementara: {e}")
        return jsonify({'message': 'Terjadi kesalahan saat memproses registrasi'}), 500

# Endpoint Update Verification Code
@app.route('/update_verification', methods=['POST'])
def update_verification():
    if db is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json()
    if not data or 'temp_id' not in data or 'verification_code' not in data:
        return jsonify({'message': 'Data tidak lengkap'}), 400

    try:
        temp_id = ObjectId(data['temp_id'])
        pending_users = db['pending_users']
        result = pending_users.update_one(
            {'_id': temp_id},
            {'$set': {'verification_code': data['verification_code']}}
        )

        if result.matched_count == 0:
            return jsonify({'message': 'Data registrasi tidak ditemukan'}), 404

        return jsonify({'message': 'Kode verifikasi berhasil diperbarui'}), 200

    except Exception as e:
        print(f"Error saat update verifikasi: {e}")
        return jsonify({'message': 'Terjadi kesalahan saat update verifikasi'}), 500

# Endpoint Verify Email
@app.route('/verify', methods=['POST'])
def verify():
    if db is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json()
    if not data or 'temp_id' not in data or 'verification_code' not in data:
        return jsonify({'message': 'Data tidak lengkap'}), 400

    try:
        temp_id = ObjectId(data['temp_id'])
        pending_users = db['pending_users']
        temp_user = pending_users.find_one({'_id': temp_id})

        if not temp_user:
            return jsonify({'message': 'Data registrasi tidak ditemukan'}), 404

        if temp_user['verification_code'] != data['verification_code']:
            return jsonify({'message': 'Kode verifikasi salah'}), 400

        # Move to permanent users collection
        users.insert_one({
            'user': temp_user['user'],
            'email': temp_user['email'],
            'password': temp_user['password'],
            'verified': True,
            'created_at': temp_user['created_at']
        })

        # Remove from pending
        pending_users.delete_one({'_id': temp_id})

        return jsonify({'message': 'Registrasi berhasil! Anda dapat login sekarang.'}), 201

    except Exception as e:
        print(f"Error saat verifikasi: {e}")
        return jsonify({'message': 'Terjadi kesalahan saat verifikasi'}), 500

# Endpoint Login
@app.route('/login', methods=['POST'])
def login():
    if users is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json()
    if not data or 'user' not in data or 'password' not in data:
        return jsonify({'message': 'Username/email dan password diperlukan'}), 400

    # Pencarian user menggunakan field user atau email
    user = users.find_one({'$or': [{'user': data['user']}, {'email': data['user']}]})

    if user:
        # Verifikasi password menggunakan bcrypt.checkpw dengan konversi string ke bytes
        stored_password = user['password']
        if isinstance(stored_password, str):
            stored_password_bytes = stored_password.encode('utf-8')
        else:
            stored_password_bytes = stored_password

        if bcrypt.checkpw(data['password'].encode('utf-8'), stored_password_bytes):
            # Perbaikan: Tambahkan algoritma di jwt.encode
            token = jwt.encode({
                'user_id': str(user['_id']),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({'token': token})

    return jsonify({'message': 'Username/email atau password salah'}), 401

# Endpoint Forgot Password
@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    if users is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'message': 'Email diperlukan'}), 400

    user = users.find_one({'email': data['email']})
    if not user:
        return jsonify({'message': 'Email tidak terdaftar'}), 404

    # Generate reset code
    reset_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Store reset code temporarily (you might want to use a separate collection or add expiry)
    users.update_one(
        {'email': data['email']},
        {'$set': {'reset_code': reset_code, 'reset_expiry': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)}}
    )

    # Send reset code via console (for testing)
    try:
        print(f"Attempting to send email to: {data['email']}")
        print(f"Reset code: {reset_code}")

        # Use console email simulation
        send_email_console(
            to_email=data['email'],
            subject='Reset Password - PT Sun Menara Mandiri',
            body=f'Kode reset password Anda: {reset_code}\n\nKode ini akan kadaluarsa dalam 15 menit.'
        )

        print("Email sent successfully (console simulation)")
        return jsonify({'message': 'Kode reset password telah dikirim ke email Anda'}), 200
    except Exception as e:
        print(f"Error sending email: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Gagal mengirim email reset password: {str(e)}'}), 500

# Endpoint Reset Password
@app.route('/reset_password', methods=['POST'])
def reset_password():
    if users is None:
        return jsonify({'message': 'Database connection failed'}), 500

    data = request.get_json()
    if not data or 'email' not in data or 'reset_code' not in data or 'new_password' not in data:
        return jsonify({'message': 'Data tidak lengkap'}), 400

    user = users.find_one({'email': data['email']})
    if not user:
        return jsonify({'message': 'Email tidak terdaftar'}), 404

    # Check reset code and expiry
    if user.get('reset_code') != data['reset_code']:
        return jsonify({'message': 'Kode reset salah'}), 400

    if user.get('reset_expiry') and user['reset_expiry'] < datetime.datetime.utcnow():
        return jsonify({'message': 'Kode reset telah kadaluarsa'}), 400

    # Update password
    hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users.update_one(
        {'email': data['email']},
        {'$set': {'password': hashed_password}, '$unset': {'reset_code': '', 'reset_expiry': ''}}
    )

    return jsonify({'message': 'Password berhasil direset'}), 200

# Endpoint Get Transactions
@app.route('/transactions', methods=['GET'])
def get_transactions():
    if transactions is None:
        return jsonify({'message': 'Database connection failed'}), 500

    auth_header = request.headers.get('Authorization')

    if not auth_header:
        return jsonify({'message': 'Token missing'}), 401

    # Perbaikan: Mengatasi format 'Bearer <token>' dari frontend
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id']
        txs = list(transactions.find({'user_id': user_id}))

        for tx in txs:
            tx['_id'] = str(tx['_id'])

        return jsonify(txs)
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token sudah kedaluwarsa'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Token tidak valid'}), 401
    except Exception as e:
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)