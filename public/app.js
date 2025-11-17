import { auth, provider } from './config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;

// --- 1. Authentication ---
window.loginWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => console.log("Logged in:", result.user.displayName))
        .catch((error) => alert("Login failed: " + error.message));
};

window.logout = () => {
    signOut(auth).then(() => location.reload());
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-pic').src = user.photoURL;
    } else {
        currentUser = null;
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('app-content').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
    }
});

// --- 2. Navigation & UI ---
window.showUpload = () => {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('history-view').classList.add('hidden');
    document.getElementById('upload-view').classList.remove('hidden');
};

// --- 3. Analysis Logic ---
const fileInput = document.getElementById('file-upload');
const analyzeBtn = document.getElementById('analyze-btn');
const fileNameDisplay = document.getElementById('file-name');

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        fileNameDisplay.textContent = "Selected: " + e.target.files[0].name;
        fileNameDisplay.classList.remove('hidden');
        fileNameDisplay.className = "mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold text-center border border-green-200 block";
        analyzeBtn.disabled = false;
    }
});

analyzeBtn.addEventListener('click', async () => {
    if (!fileInput.files[0]) return alert("Select a file first.");
    
    // Show Loading
    document.getElementById('upload-view').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');

    const formData = new FormData();
    formData.append('report', fileInput.files[0]);
    formData.append('userId', currentUser.uid);

    try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.ok) {
            renderDashboard(data);
        } else {
            alert('Error: ' + data.message);
            location.reload();
        }
    } catch (error) {
        console.error(error);
        alert('Server error. Check console.');
        location.reload();
    }
});

function renderDashboard(data) {
    // Hide other views
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('upload-view').classList.add('hidden');
    document.getElementById('history-view').classList.add('hidden');
    
    // Show Dashboard
    document.getElementById('dashboard-view').classList.remove('hidden');

    document.getElementById('score-val').textContent = data.score || "--";
    document.getElementById('summary-text').textContent = data.summary || "No summary available.";

    // Dynamic Vitals
    const vitalsGrid = document.getElementById('vitals-grid');
    vitalsGrid.innerHTML = '';
    if (data.vitals) {
        Object.entries(data.vitals).forEach(([key, value]) => {
            vitalsGrid.innerHTML += `
                <div class="p-3 bg-gray-50 rounded border border-gray-100">
                    <div class="text-xs text-gray-500 uppercase tracking-wide">${key}</div>
                    <div class="font-bold text-gray-800 text-sm">${value}</div>
                </div>`;
        });
    } else {
        vitalsGrid.innerHTML = '<p class="text-gray-400 col-span-2">No vitals extracted.</p>';
    }

    // Recommendations Helper
    const fillList = (id, arr) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        if (arr && arr.length > 0) {
            arr.forEach(txt => el.innerHTML += `<li>${txt}</li>`);
        } else {
            el.innerHTML = '<li class="text-gray-400 italic">No specific suggestions.</li>';
        }
    };
    
    if (data.recommendations) {
        fillList('rec-diet', data.recommendations.diet);
        fillList('rec-exercise', data.recommendations.exercise);
        fillList('rec-lifestyle', data.recommendations.lifestyle);
    } else {
        fillList('rec-diet', []);
        fillList('rec-exercise', []);
        fillList('rec-lifestyle', []);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 4. History Logic (UPDATED) ---
window.loadHistory = async () => {
    if (!currentUser) return;
    
    document.getElementById('upload-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('history-view').classList.remove('hidden');

    const list = document.getElementById('history-list');
    list.innerHTML = '<div class="text-center text-gray-400 py-10"><div class="loader h-8 w-8 mx-auto rounded-full border-2 border-blue-500"></div></div>';

    try {
        const res = await fetch(`/history/${currentUser.uid}`);
        const history = await res.json();

        list.innerHTML = '';
        if (history.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-10">No reports found.</div>';
            return;
        }

        history.forEach(item => {
            // Determine Color
            let scoreClass = "text-gray-600";
            if(item.score >= 80) scoreClass = "text-green-600";
            else if(item.score >= 50) scoreClass = "text-yellow-600";
            else if(item.score > 0) scoreClass = "text-red-600";

            // Create Element (Interactive)
            const card = document.createElement('div');
            card.className = "bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition cursor-pointer hover:bg-blue-50/30 group";
            
            card.innerHTML = `
                <div class="overflow-hidden">
                    <div class="flex items-center gap-2 mb-1">
                         <span class="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">${item.date}</span>
                         <span class="font-bold text-gray-800 truncate group-hover:text-blue-600 transition">${item.fileName}</span>
                    </div>
                    <div class="text-sm text-gray-500 truncate w-64">${item.summary}</div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-3xl font-bold ${scoreClass}">${item.score}</div>
                    <svg class="w-5 h-5 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
            `;

            // CLICK EVENT: Open the dashboard with this item's data
            card.addEventListener('click', () => {
                console.log("Opening report:", item);
                renderDashboard(item);
            });

            list.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="text-red-500 text-center">Failed to load history.</p>';
    }
};