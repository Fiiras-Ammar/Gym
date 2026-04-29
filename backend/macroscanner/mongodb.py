import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv(
    'MONGO_URI',
    'mongodb+srv://Firas:kVgxCQ0M0nGyrOqS@cluster0.zsqjugz.mongodb.net/macroscanner?appName=Cluster0'
)

# Create a new client and connect to the server
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Access the default database
db = client.get_default_database('macroscanner')

def ping_mongodb():
    """Ping the MongoDB deployment to confirm a successful connection."""
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return False

if __name__ == "__main__":
    ping_mongodb()
