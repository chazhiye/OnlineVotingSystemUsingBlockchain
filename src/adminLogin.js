import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './login.css';

const AdminLogin = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [IC, setIC] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const connectWallet = async (event) => {
    event.preventDefault();
    try {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];
        setWalletAddress(address);
        console.log("Connected wallet:", address);
      } else {
        console.log("Please install MetaMask");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!walletAddress) {
      setMsg('Please connect your wallet');
      return;
    }

    if (!IC) {
      setMsg('Please enter your IC number');
      return;
    }

    try {
      const docRef = doc(db, 'admin', walletAddress);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setMsg('Admin not found');
        return;
      }

      const userData = docSnap.data();
      if (userData.IC !== IC) {
        setMsg('Incorrect IC number or Wallet ID');
        return;
      }

      navigate('/createVote');
    } catch (error) {
      console.error('Error:', error);
      setMsg('Login failed');
    }
  };

  return (
    <div className="login-container">
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <button className="connect-wallet" onClick={connectWallet}>
          <span className="is-link has-text-weight-bold">
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
          </span>
        </button>
        <label htmlFor="IC"><h3>IC number</h3></label>
        <input
          type="text"
          className="form-control"
          id="IC"
          name="IC"
          placeholder="IC"
          value={IC}
          onChange={(e) => setIC(e.target.value)}
        />
        <div id="msg" style={{ color: 'red', marginTop: '10px' }}>{msg}</div>
        <button type="submit" id="login" className="btn btn-primary"><b>Login</b></button>
      </form>
      <div className="mt-3">
        <button className="btn link-btn" onClick={() => navigate('/login')}><b>User Login</b></button>
        <button className="btn link-btn" onClick={() => navigate('/applyAccount')}><b>Apply for Account</b></button>
      </div>
    </div>
  );
};

export default AdminLogin;
