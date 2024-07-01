import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const ApplyAccount = () => {
  const [walletID, setWalletID] = useState('');
  const [role, setRole] = useState('user');
  const [IC, setIC] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleApplyAccount = async (event) => {
    event.preventDefault();
    
    const icPattern = /^\d{6}-\d{2}-\d{4}$/;

    if (!icPattern.test(IC)) {
      setMessage('Invalid IC number format. It should be in the format 000000-00-0000.');
      return;
    }

    const data = { walletID, role, IC };

    try {
      const response = await fetch('http://127.0.0.1:8000/applyAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage('Account application submitted successfully!');
      } else {
        const error = await response.json();
        setMessage(error.detail || 'Account application failed');
      }
    } catch (error) {
      setMessage(error.message || 'Account application failed. Please try again.');
    }
  };

  const handleWalletIDChange = (event) => {
    setWalletID(event.target.value.toLowerCase());
  };

  return (
    <div>
      <h1 align="center" style={{ color: 'rgb(14, 15, 15)' }}>Online Voting System Using Blockchain</h1>
      <div className="container mt-5">
        <h1>Account Application</h1>
        
        <form onSubmit={handleApplyAccount}>
          <label htmlFor="walletID"><h3>Wallet ID</h3></label>
          <input type="text" className="form-control" id="walletID" value={walletID} onChange={handleWalletIDChange} placeholder="Wallet ID" />
          
          <label htmlFor="role"><h3>Role</h3></label>
          <select className="form-control" id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          
          <label htmlFor="IC"><h3>IC number</h3></label>
          <input type="text" className="form-control" id="IC" value={IC} onChange={(e) => setIC(e.target.value)} placeholder="000000-00-0000" />
          
          <button type="submit" id="apply" className="btn btn-primary"><b>Apply</b></button>
        </form>
        
        <div className="mt-3">
          <button className="btn link-btn" onClick={() => navigate('/login')}><b>Back to Login</b></button>
        </div>

        {message && <div style={{ color: message.includes('successfully') ? 'green' : 'red', marginTop: '10px' }}>{message}</div>}
      </div>
    </div>
  );
};

export default ApplyAccount;
