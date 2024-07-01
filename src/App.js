import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ApplyAccount from './applyAccount';
import Login from './login';
import AdminLogin from './adminLogin';
import CreateVote from './createVote';
import ManageVote from './manageVote'; // Import the ManageVote component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/applyAccount" element={<ApplyAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/adminLogin" element={<AdminLogin />} />
        <Route path="/createVote" element={<CreateVote />} />
        <Route path="/manageVote" element={<ManageVote />}/>
      </Routes>
    </Router>
  );
}

export default App;
