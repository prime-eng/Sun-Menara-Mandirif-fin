from pymongo import MongoClient

client = MongoClient('mongodb://127.0.0.1:27017/')
db = client['bankapp']
users = db['users']

print("Users in database:")
for user in users.find():
    print(user)
