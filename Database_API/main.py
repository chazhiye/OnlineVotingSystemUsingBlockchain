from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import jwt
import os
import mysql.connector
import dotenv
from typing import List, Optional
import json

dotenv.load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Define allowed origins for CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to the MySQL database
try:
    cnx = mysql.connector.connect(
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        host=os.environ['MYSQL_HOST'],
        database=os.environ['MYSQL_DB'],
    )
    cursor = cnx.cursor()
except mysql.connector.Error as err:
    if err.errno == mysql.connector.errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your username or password")
    elif err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)

# Models
class Application(BaseModel):
    walletID: str
    role: str
    IC: str

class WalletIDModel(BaseModel):
    walletID: str

class RoomIDModel(BaseModel):
    roomID: int
    users: List[str]  

class UserUpdate(BaseModel):
    walletID: str
    role: str
    IC: str
    roomIDs: Optional[List[int]] = None

SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Utility function to decode JWT tokens
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

# Dependency to get the current user based on the token
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    return payload

# Dependency to check if the user is an admin
def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@app.get("/checkAdmin")
async def check_admin(current_user: dict = Depends(get_current_user)):
    is_admin = current_user.get('role') == 'admin'
    return {"isAdmin": is_admin}

@app.get("/login")
async def login(wallet_id: str, IC: str):
    role = await get_role(wallet_id, IC, 'voters')

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'IC': IC, 'wallet_id': wallet_id, 'role': role}, SECRET_KEY, algorithm=ALGORITHM)
    return {'token': token, 'role': role}

@app.get("/adminLogin")
async def admin_login(wallet_id: str, IC: str):
    role = await get_role(wallet_id, IC, 'admin')

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'IC': IC, 'wallet_id': wallet_id, 'role': role}, SECRET_KEY, algorithm=ALGORITHM)
    return {'token': token, 'role': role}

@app.get("/getRole")
async def get_role(wallet_id: str, IC: str, table: str):
    try:
        query = f"SELECT role FROM {table} WHERE wallet_id = %s AND IC = %s"
        cursor.execute(query, (wallet_id, IC,))
        role = cursor.fetchone()
        if role:
            return role[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid wallet id or IC"
            )
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@app.post("/applyAccount")
async def apply_account(application: Application):
    try:
        # Check if walletID or IC already exists in the user or applicant table
        cursor.execute("SELECT COUNT(*) FROM voters WHERE wallet_id = %s OR IC = %s", (application.walletID, application.IC))
        user_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM applicant WHERE wallet_id = %s OR IC = %s", (application.walletID, application.IC))
        applicant_count = cursor.fetchone()[0]

        if user_count > 0 or applicant_count > 0:
            raise HTTPException(status_code=400, detail="Wallet ID or IC number already exists")

        # If not exists, insert into applicant table
        cursor.execute(
            "INSERT INTO applicant (wallet_id, role, IC) VALUES (%s, %s, %s)",
            (application.walletID, application.role, application.IC)
        )
        cnx.commit()
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to submit application"
        )

@app.post("/addUser")
async def add_user(user: Application):
    try:
        # Check if walletID or IC already exists in the voters or admin tables
        cursor.execute("SELECT COUNT(*) FROM voters WHERE wallet_id = %s OR IC = %s", (user.walletID, user.IC))
        user_count_voters = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM admin WHERE wallet_id = %s OR IC = %s", (user.walletID, user.IC))
        user_count_admin = cursor.fetchone()[0]

        if user_count_voters > 0 or user_count_admin > 0:
            raise HTTPException(status_code=400, detail="Wallet ID or IC number already exists")

        # Insert into the appropriate table based on the role
        if user.role.lower() == 'admin':
            cursor.execute(
                "INSERT INTO admin (wallet_id, role, IC) VALUES (%s, %s, %s)",
                (user.walletID, user.role, user.IC)
            )
        else:
            cursor.execute(
                "INSERT INTO voters (wallet_id, role, IC) VALUES (%s, %s, %s)",
                (user.walletID, user.role, user.IC)
            )
        cnx.commit()
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to add user"
        )
    
@app.get('/users')
async def get_users():
    try:
        query = "SELECT wallet_id, role, IC, roomIDs FROM voters"
        cursor.execute(query)
        users = cursor.fetchall()
        return [{'walletID': user[0], 'role': user[1], 'IC': user[2], 'roomIDs': user[3]} for user in users]  
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@app.get('/applicants')
async def get_applicants():
    try:
        query = "SELECT wallet_id, role, IC FROM applicant"
        cursor.execute(query)
        applicants = cursor.fetchall()
        return [{'walletID': applicant[0], 'role': applicant[1], 'IC': applicant[2]} for applicant in applicants]
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(status_code=500, detail="Failed to fetch applicants")



@app.post('/approveApplicant')
async def approve_applicant(walletIDModel: WalletIDModel):
    try:
        cursor.execute("SELECT * FROM applicant WHERE wallet_id = %s", (walletIDModel.walletID,))
        applicant = cursor.fetchone()
        if not applicant:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        role = applicant[1]  # Assuming role is the second column in the applicant table

        if role == "admin":
            cursor.execute(
                "INSERT INTO admin (wallet_id, role, IC) VALUES (%s, %s, %s)",
                (applicant[0], applicant[1], applicant[2])
            )
        else:
            cursor.execute(
                "INSERT INTO voters (wallet_id, role, IC) VALUES (%s, %s, %s)",
                (applicant[0], applicant[1], applicant[2])
            )
        
        cursor.execute("DELETE FROM applicant WHERE wallet_id = %s", (walletIDModel.walletID,))
        cnx.commit()
        return {"message": "Applicant approved"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to approve applicant"
        )

@app.delete('/rejectApplicant')
async def reject_applicant(walletIDModel: WalletIDModel):
    try:
        cursor.execute("SELECT * FROM applicant WHERE wallet_id = %s", (walletIDModel.walletID,))
        applicant = cursor.fetchone()
        if not applicant:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        cursor.execute("DELETE FROM applicant WHERE wallet_id = %s", (walletIDModel.walletID,))
        cnx.commit()
        return {"message": "Applicant rejected"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to reject applicant"
        )

@app.delete('/users/{walletID}')
async def delete_user(walletID: str):
    try:
        cursor.execute("SELECT * FROM voters WHERE wallet_id = %s", (walletID,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        cursor.execute("DELETE FROM voters WHERE wallet_id = %s", (walletID,))
        cnx.commit()
        return {"message": "User deleted"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete user"
        )

@app.put('/users/{walletID}')
async def update_user(walletID: str, user: UserUpdate):
    try:
        cursor.execute("SELECT roomIDs FROM voters WHERE wallet_id = %s", (walletID,))
        result = cursor.fetchone()
        current_room_ids = json.loads(result[0]) if result and result[0] else []
        print("Current roomIDs before update:", current_room_ids)
        print("New roomIDs to be updated:", user.roomIDs)

        # Ensure the new roomIDs are not removing any unintended ones
        new_room_ids = user.roomIDs if user.roomIDs is not None else []

        print("Final new roomIDs to be updated:", new_room_ids)

        # Update only if there is a change
        if set(current_room_ids) != set(new_room_ids):
            roomIDs = json.dumps(new_room_ids)
            cursor.execute(
                "UPDATE voters SET role = %s, IC = %s, roomIDs = %s WHERE wallet_id = %s",
                (user.role, user.IC, roomIDs, walletID)
            )
        else:
            cursor.execute(
                "UPDATE voters SET role = %s, IC = %s WHERE wallet_id = %s",
                (user.role, user.IC, walletID)
            )

        cnx.commit()
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to update user"
        )

    
@app.post('/assignRoom')
async def assign_room(roomIDModel: RoomIDModel):
    try:
        for walletID in roomIDModel.users:
            cursor.execute("SELECT roomIDs FROM voters WHERE wallet_id = %s", (walletID,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail=f"User with wallet ID {walletID} not found")

            existing_room_ids = json.loads(result[0]) if result[0] else []

            if roomIDModel.roomID not in existing_room_ids:
                existing_room_ids.append(roomIDModel.roomID)

                cursor.execute(
                    "UPDATE voters SET roomIDs = %s WHERE wallet_id = %s",
                    (json.dumps(existing_room_ids), walletID)
                )

        cnx.commit()
        return {"message": "Room assigned to users successfully"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=500,
            detail="Failed to assign room"
        )
    
@app.get('/userAssignedRooms/{walletID}')
async def get_user_assigned_rooms(walletID: str):
    try:
        query = "SELECT roomIDs FROM voters WHERE wallet_id = %s"
        cursor.execute(query, (walletID,))
        result = cursor.fetchone()
        if result:
            assigned_room_ids = json.loads(result[0])
            return {"roomIDs": assigned_room_ids}
        else:
            raise HTTPException(status_code=404, detail="No rooms assigned to this user")
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(status_code=500, detail="Failed to fetch assigned rooms")

@app.delete('/removeRoomID')
async def remove_room_id(roomIDModel: RoomIDModel):
    try:
        query = "SELECT wallet_id, roomIDs FROM voters"
        cursor.execute(query)
        users = cursor.fetchall()

        for user in users:
            wallet_id = user[0]
            room_ids = json.loads(user[1]) if user[1] else []

            # Remove all occurrences of roomIDModel.roomID from the list
            updated_room_ids = [room_id for room_id in room_ids if room_id != roomIDModel.roomID]

            # Update the user's roomIDs if any changes were made
            if updated_room_ids != room_ids:
                updated_room_ids_json = json.dumps(updated_room_ids) if updated_room_ids else None
                cursor.execute(
                    "UPDATE voters SET roomIDs = %s WHERE wallet_id = %s",
                    (updated_room_ids_json, wallet_id)
                )

        cnx.commit()
        return {"message": "Room ID removed from all users successfully"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(status_code=500, detail="Failed to remove room ID from users")
