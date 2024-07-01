from fastapi import FastAPI, HTTPException, status, Request, Depends
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

# Define the authentication middleware
async def authenticate(request: Request, table: str):
    try:
        api_key = request.headers.get('authorization').replace("Bearer ", "")
        query = f"SELECT * FROM {table} WHERE wallet_id = %s"
        cursor.execute(query, (api_key,))
        if api_key not in [row[0] for row in cursor.fetchall()]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Forbidden"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Forbidden"
        )

# Define the GET endpoint for user login
@app.get("/login")
async def login(request: Request, wallet_id: str, IC: str):
    await authenticate(request, 'voters')
    role = await get_role(wallet_id, IC, 'voters')

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'IC': IC, 'wallet_id': wallet_id, 'role': role}, os.environ['SECRET_KEY'], algorithm='HS256')

    return {'token': token, 'role': role}

# Define the GET endpoint for admin login
@app.get("/adminLogin")
async def admin_login(request: Request, wallet_id: str, IC: str):
    await authenticate(request, 'admin')
    role = await get_role(wallet_id, IC, 'admin')

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'IC': IC, 'wallet_id': wallet_id, 'role': role}, os.environ['SECRET_KEY'], algorithm='HS256')

    return {'token': token, 'role': role}

# Function to get role from the database
@app.get("/getRole")
async def get_role(wallet_id, IC, table):
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

# Use this addUser for adding users directly
@app.post("/addUser")
async def add_user(user: Application):
    try:
        # Check if walletID or IC already exists in the voters table
        cursor.execute("SELECT COUNT(*) FROM voters WHERE wallet_id = %s OR IC = %s", (user.walletID, user.IC))
        user_count = cursor.fetchone()[0]

        if user_count > 0:
            raise HTTPException(status_code=400, detail="Wallet ID or IC number already exists")

        # If not exists, insert into voters table
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
