let walletAddress; // Global variable to store the wallet address

const connectWalletButton = document.getElementById('connectWallet');

const handleConnectWallet = async (event) => {
  event.preventDefault();
  try {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      walletAddress = accounts[0]; // Store the wallet address
      console.log("Connected wallet:", walletAddress);
      updateConnectWalletButton(); // Call the function to update the button text
    } else {
      console.log("Please install MetaMask");
    }
  } catch (err) {
    console.error(err.message);
  }
}
const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('clearSession') && urlParams.get('clearSession') === 'true') {
      // Clear session storage
      sessionStorage.removeItem('jwtTokenAdmin');
      sessionStorage.removeItem('jwtTokenVoter');
      sessionStorage.removeItem('previousPage');

      // Optionally, remove the query parameter from the URL without reloading the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
const updateConnectWalletButton = () => {
  connectWalletButton.textContent = `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}

connectWalletButton.addEventListener('click', handleConnectWallet);

const handleLogin = (event, role) => {
  event.preventDefault();

  const wallet_id = walletAddress; 
  const IC = document.getElementById('IC').value;
  const icPattern = /^\d{6}-\d{2}-\d{4}$/;

  // Validation checks
  if (!wallet_id) {
    showMsg('Please connect your wallet');
    return;
  }

  if (!IC) {
    showMsg('Please enter your IC number');
    return;
  }

  if (!icPattern.test(IC)) {
    showMsg('Invalid IC number format. It should be in the format 000000-00-0000.', 'red');
    return;
  }

  const token = wallet_id;

  const headers = {
    'method': "GET",
    'Authorization': `Bearer ${token}`,
  };

  const loginEndpoint = role === 'admin' ? 'adminLogin' : 'login';

  fetch(`http://127.0.0.1:8000/${loginEndpoint}?wallet_id=${wallet_id}&IC=${IC}`, { headers })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Login failed');
    }
  })
  .then(data => {
    const tokenExpiryTime = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (data.role === 'admin') {
      sessionStorage.setItem('jwtTokenAdmin', data.token);
      sessionStorage.setItem('previousPage', 'createVote.html');
      setTimeout(() => {
        sessionStorage.removeItem('jwtTokenAdmin');
      }, tokenExpiryTime);
      window.location.replace(`http://127.0.0.1:8080/createVote.html?Authorization=Bearer ${sessionStorage.getItem('jwtTokenAdmin')}`);
    } else if (data.role === 'user') {
      sessionStorage.setItem('jwtTokenVoter', data.token);
      sessionStorage.setItem('previousPage', 'voter.html');
      setTimeout(() => {
        sessionStorage.removeItem('jwtTokenVoter');
      }, tokenExpiryTime);
      window.location.replace(`http://127.0.0.1:8080/voter.html?Authorization=Bearer ${sessionStorage.getItem('jwtTokenVoter')}`);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showMsg('Incorrect IC number or Wallet ID');
  });
}

const showMsg = (message) => {
  const msgElement = document.getElementById('msg');
  msgElement.style.color = 'red';
  msgElement.style.marginTop = '10px';
  msgElement.textContent = message;
}

const showError = (message) => {
  // Remove existing error message if any
  const existingError = document.getElementById('loginError');
  if (existingError) {
    existingError.remove();
  }

  // Create a new error message element
  const errorMessage = document.createElement('div');
  errorMessage.id = 'loginError';
  errorMessage.style.color = 'red';
  errorMessage.style.marginTop = '10px';
  errorMessage.textContent = message;

  // Append the error message element to the form
  const form = document.getElementById('loginForm') || document.getElementById('adminLoginForm');
  form.appendChild(errorMessage);
}

const loginForm = document.getElementById('loginForm');
const adminLoginForm = document.getElementById('adminLoginForm');

if (loginForm) {
  loginForm.addEventListener('submit', (event) => handleLogin(event, 'user'));
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (event) => handleLogin(event, 'admin'));
}
