(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('Authorization')?.split(' ')[1];

    if (!token) {
        console.error('Authorization token not found in URL.');
        window.location.replace('http://127.0.0.1:8080');
        return;
    }

    const checkAdminStatus = async (token) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/checkAdmin', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error checking admin status:', errorText);
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            return result.isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    };

    const setupButtons = async (isAdmin) => {
        const dashboardButton = document.getElementById('dashboardButton');
        if (dashboardButton) {
            dashboardButton.addEventListener('click', () => {
                const redirectPage = isAdmin ? 'createVote.html' : 'voter.html';
                window.location.replace(`${redirectPage}?Authorization=Bearer ${token}`);
            });
        }

        const manageUsersButton = document.getElementById('manageUsersButton');
        if (manageUsersButton) {
            manageUsersButton.addEventListener('click', () => {
                if (isAdmin) {
                    window.location.replace(`manageUsers.html?Authorization=Bearer ${token}`);
                } else {
                    alert('Access denied.');
                }
            });
        }

        const createVoteButton = document.getElementById('createVoteButton');
        if (createVoteButton) {
            createVoteButton.addEventListener('click', () => {
                if (isAdmin) {
                    sessionStorage.setItem('previousPage', 'createVote.html');
                    window.location.replace(`http://127.0.0.1:8080/admin.html?Authorization=Bearer ${token}`);
                } else {
                    alert('Access denied.');
                }
            });
        }

        const monitorButton = document.getElementById('monitorButton');
        if (monitorButton) {
            monitorButton.addEventListener('click', () => {
                const redirectPage = isAdmin ? 'adminMonitor.html' : 'monitor.html';
                window.location.replace(`${redirectPage}?Authorization=Bearer ${token}`);
            });
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                sessionStorage.removeItem('jwtTokenAdmin');
                sessionStorage.removeItem('jwtTokenVoter');
                sessionStorage.removeItem('previousPage');
                window.location.replace(`http://127.0.0.1:8080`);
            });
        }

        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (event) => {
                if (!event.target.matches('button, button *')) {
                    toggleSidebar();
                }
            });
        }
    };

    checkAdminStatus(token).then(isAdmin => {

        setupButtons(isAdmin);
    }).catch(error => {
        console.error('Error setting up buttons:', error);
        window.location.replace('http://127.0.0.1:8080');
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    if (sidebar && mainContent) {
        sidebar.classList.toggle('expanded');
        mainContent.classList.toggle('shifted');
    }
}

},{}]},{},[1]);
