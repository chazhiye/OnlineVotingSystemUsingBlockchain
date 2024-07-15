const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

app.get('/dist/bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/bundle.js'), {
    headers: {
      'Content-Type': 'application/javascript' // Set the MIME type to JavaScript
    }
  });
});

// Authorization middleware
const authorizeUser = (req, res, next) => {
  const token = req.query.Authorization?.split('Bearer ')[1];

  if (!token) {
    return res.redirect('/?clearSession=true'); // Redirect to the login page if no token is found
  }

  try {
    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });

    req.user = decodedToken;
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.redirect('/?clearSession=true'); // Redirect to the login page if the token is invalid
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

app.get('/adminLogin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/adminLogin.html'));
});
app.get('/manageUsers.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/manageUsers.html'));
});
app.get('/applyAccount.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/applyAccount.html'));
});

app.get('/routing.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/routing.js'));
});
app.get('/js/login.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/login.js'));
});
app.get('/js/manageAcc.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/manageAcc.js'));
});
app.get('/css/manageUsers.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/manageUsers.css'));
});
app.get('/css/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/login.css'));
});
app.get('/css/monitor.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/monitor.css'));
});
app.get('/createVote.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/createVote.html'));
});

app.get('/js/createVote.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/createVote.js'));
});

app.get('/css/createVote.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/createVote.css'));
});

app.get('/voting.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/voting.html'));
});

app.get('/voting.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/voting.js'));
});

app.get('/css/voting.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/voting.css'));
});

app.get('/css/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/index.css'));
});
app.get('/css/sidebar.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/sidebar.css'));
});
app.get('/css/admin.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/admin.css'));
});

app.get('/assets/eth5.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/eth5.jpg'));
});

app.get('/js/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/app.js'));
});
app.get('/js/adminIndex.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/adminIndex.js'));
});
app.get('/js/monitor.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/monitor.js'));
});
app.get('/js/manageVote.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/manageVote.js'));
});
app.get('/admin.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

app.get('/voter.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/voter.html'));
});

app.get('/index.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});
app.get('/adminIndex.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/adminIndex.html'));
});
app.get('/monitor.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/monitor.html'));
});
app.get('/adminMonitor.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/adminMonitor.html'));
});
app.get('/dist/login.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/login.bundle.js'));
});

app.get('/dist/createVote.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/createVote.bundle.js'));
});
app.get('/dist/routing.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/routing.bundle.js'));
});
app.get('/dist/app.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/app.bundle.js'));
});
app.get('/dist/adminIndex.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/adminIndex.bundle.js'));
});
app.get('/dist/monitor.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/monitor.bundle.js'));
});
app.get('/dist/manageVote.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/ManageVote.bundle.js'));
});
// Serve the favicon.ico file
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/favicon.ico'));
});
app.get('/assets/eth_logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/eth_logo.png'));
});
app.get('/assets/dashboard.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/dashboard.png'));
});
app.get('/assets/addUser.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/addUser.png'));
});
app.get('/assets/logout.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/logout.png'));
});
app.get('/assets/create.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/create.png'));
});
app.get('/assets/monitor.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/monitor.png'));
});
// Start the server
app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080');
});
