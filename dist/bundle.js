/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/login.js":
/*!*************************!*\
  !*** ./src/js/login.js ***!
  \*************************/
/***/ (() => {

eval("let walletAddress; // Global variable to store the wallet address\n\nconst connectWalletButton = document.getElementById('connectWallet');\n\nconst handleConnectWallet = async (event) => {\n  event.preventDefault();\n  try {\n    if (typeof window !== \"undefined\" && typeof window.ethereum !== \"undefined\") {\n      const accounts = await window.ethereum.request({\n        method: \"eth_requestAccounts\",\n      });\n      walletAddress = accounts[0]; // Store the wallet address\n      console.log(\"Connected wallet:\", walletAddress);\n      updateConnectWalletButton(); // Call the function to update the button text\n    } else {\n      console.log(\"Please install MetaMask\");\n    }\n  } catch (err) {\n    console.error(err.message);\n  }\n}\n\nconst updateConnectWalletButton = () => {\n  connectWalletButton.textContent = `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;\n}\n\nconnectWalletButton.addEventListener('click', handleConnectWallet);\n\nconst handleLogin = (event, role) => {\n  event.preventDefault();\n\n  const wallet_id = walletAddress; \n  const IC = document.getElementById('IC').value;\n  const token = wallet_id;\n\n  const headers = {\n    'method': \"GET\",\n    'Authorization': `Bearer ${token}`,\n  };\n\n  const loginEndpoint = role === 'admin' ? 'adminLogin' : 'login';\n\n  fetch(`http://127.0.0.1:8000/${loginEndpoint}?wallet_id=${wallet_id}&IC=${IC}`, { headers })\n  .then(response => {\n    if (response.ok) {\n      return response.json();\n    } else {\n      throw new Error('Login failed');\n    }\n  })\n  .then(data => {\n    if (data.role === 'admin') {\n      localStorage.setItem('jwtTokenAdmin', data.token);\n      localStorage.setItem('previousPage', 'createVote.html');\n      window.location.replace(`http://127.0.0.1:8080/createVote.html?Authorization=Bearer ${localStorage.getItem('jwtTokenAdmin')}`);\n    } else if (data.role === 'user') {\n      localStorage.setItem('jwtTokenVoter', data.token);\n      localStorage.setItem('previousPage', 'voter.html');\n      window.location.replace(`http://127.0.0.1:8080/voter.html?Authorization=Bearer ${localStorage.getItem('jwtTokenVoter')}`);\n    }\n  })\n  .catch(error => {\n    console.error('Error:', error);\n    showError('Incorrect IC number or Wallet ID');\n  });\n}\n\nconst showError = (message) => {\n  // Remove existing error message if any\n  const existingError = document.getElementById('loginError');\n  if (existingError) {\n    existingError.remove();\n  }\n\n  // Create a new error message element\n  const errorMessage = document.createElement('div');\n  errorMessage.id = 'loginError';\n  errorMessage.style.color = 'red';\n  errorMessage.style.marginTop = '10px';\n  errorMessage.textContent = message;\n\n  // Append the error message element to the form\n  const form = document.getElementById('loginForm') || document.getElementById('adminLoginForm');\n  form.appendChild(errorMessage);\n}\n\nconst loginForm = document.getElementById('loginForm');\nconst adminLoginForm = document.getElementById('adminLoginForm');\n\nif (loginForm) {\n  loginForm.addEventListener('submit', (event) => handleLogin(event, 'user'));\n}\n\nif (adminLoginForm) {\n  adminLoginForm.addEventListener('submit', (event) => handleLogin(event, 'admin'));\n}\n\n\n//# sourceURL=webpack://decentralized-voting/./src/js/login.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/login.js"]();
/******/ 	
/******/ })()
;