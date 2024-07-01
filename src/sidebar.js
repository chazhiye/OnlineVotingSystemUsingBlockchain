import React from 'react';
import { useNavigate } from 'react-router-dom';
import './sidebar.css';
import ethLogo from './assets/eth_logo.png';  // Assuming the image is in the assets folder
import dashboardIcon from './assets/dashboard.png';
import manageUsersIcon from './assets/addUser.png';
import createIcon from './assets/create.png';
import monitorIcon from './assets/monitor.png';
import logoutIcon from './assets/logout.png';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtTokenAdmin');
    localStorage.removeItem('jwtTokenVoter');
    localStorage.removeItem('previousPage');
    navigate('/');
  };

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <img src={ethLogo} alt="EEvoting Logo" className="sidebar-logo" id="sidebarLogo" />
        <span className="sidebar-text">EEvoting</span>
      </div>
      <button id="dashboardButton" className="active" onClick={() => handleNavigation('/createVote')}>
        <img src={dashboardIcon} alt="Dashboard Icon" className="sidebar-icon" /> <span className="sidebar-text">Dashboard</span>
      </button>
      <button id="manageUsersButton" onClick={() => handleNavigation('/manageUsers')}>
        <img src={manageUsersIcon} alt="Manage Users Icon" className="sidebar-icon" /> <span className="sidebar-text">Manage Users</span>
      </button>
      <button id="createVoteButton" onClick={() => handleNavigation('/manageVote')}>
        <img src={createIcon} alt="Create Vote Icon" className="sidebar-icon" /> <span className="sidebar-text">Create Vote</span>
      </button>
      <button id="monitorButton" onClick={() => handleNavigation('/monitor')}>
        <img src={monitorIcon} alt="Monitor Icon" className="sidebar-icon" /> <span className="sidebar-text">Monitor</span>
      </button>
      <button id="logoutButton" className="logoutButton" onClick={handleLogout}>
        <img src={logoutIcon} alt="Logout Icon" className="sidebar-icon" /> <span className="sidebar-text">Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
