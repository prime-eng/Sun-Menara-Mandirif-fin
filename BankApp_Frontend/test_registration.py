import requests
import json

# Test complete registration flow
def test_registration():
    # Step 1: Register user
    register_data = {
        'user': 'testuser456',
        'email': 'test456@example.com',
        'password': 'testpass123',
        'verification_code': '654321'
    }

    print("Step 1: Registering user...")
    try:
        register_response = requests.post('http://127.0.0.1:5000/register', json=register_data, timeout=10)
        print(f'Registration Status: {register_response.status_code}')
        register_result = register_response.json()
        print(f'Registration Response: {register_result}')

        if register_response.status_code == 200 and 'temp_id' in register_result:
            temp_id = register_result['temp_id']
            print(f"Got temp_id: {temp_id}")

            # Step 2: Verify user
            verify_data = {
                'temp_id': temp_id,
                'verification_code': '654321'
            }

            print("\nStep 2: Verifying user...")
            verify_response = requests.post('http://127.0.0.1:5000/verify', json=verify_data, timeout=10)
            print(f'Verification Status: {verify_response.status_code}')
            verify_result = verify_response.json()
            print(f'Verification Response: {verify_result}')

            if verify_response.status_code == 201:
                print("\n✅ Registration and verification successful!")
            else:
                print("\n❌ Verification failed!")
        else:
            print("❌ Registration failed!")

    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    test_registration()
