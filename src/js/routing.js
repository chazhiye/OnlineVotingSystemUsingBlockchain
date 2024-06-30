window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('Authorization')?.split(' ')[1];

    if (!token) {
        console.error('Authorization token not found in URL.');
        window.location.replace('http://127.0.0.1:8080');
        return;
    }

    const dashboardButton = document.getElementById('dashboardButton');
    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            const isAdmin = !!localStorage.getItem('jwtTokenAdmin');
            const redirectPage = isAdmin ? 'createVote.html' : 'voter.html';
            window.location.replace(`${redirectPage}?Authorization=Bearer ${token}`);
        });
    }

    const manageUsersButton = document.getElementById('manageUsersButton');
    if (manageUsersButton) {
        manageUsersButton.addEventListener('click', () => {
            window.location.replace(`manageUsers.html?Authorization=Bearer ${token}`);
        });
    }

    const createVoteButton = document.getElementById('createVoteButton');
    if (createVoteButton) {
        createVoteButton.addEventListener('click', () => {
            localStorage.setItem('previousPage', 'createVote.html');
            window.location.replace(`http://127.0.0.1:8080/admin.html?Authorization=Bearer ${token}`);
        });
    }

    const monitorButton = document.getElementById('monitorButton');
    if (monitorButton) {
        monitorButton.addEventListener('click', () => {
            const isAdmin = !!localStorage.getItem('jwtTokenAdmin');
            const redirectPage = isAdmin ? 'adminMonitor.html' : 'monitor.html';
            window.location.replace(`${redirectPage}?Authorization=Bearer ${token}`);
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('jwtTokenAdmin');
            localStorage.removeItem('jwtTokenVoter');
            localStorage.removeItem('previousPage');
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
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    if (sidebar && mainContent) {
        sidebar.classList.toggle('expanded');
        mainContent.classList.toggle('shifted');
    }
}
