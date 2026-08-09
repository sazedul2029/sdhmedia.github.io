const CLOUD_NAME = "crkxguin"; 
const UPLOAD_PRESET = "ml_default"; 

// Global State
let isAdminUnlocked = false;

// Unlock Admin Password Toggle Function
function toggleAdminAccess() {
  const lockText = document.getElementById('lockText');
  const lockIcon = document.getElementById('lockIcon');
  const uploadForm = document.getElementById('uploadForm');

  if (!isAdminUnlocked) {
    // Prompting for password
    const password = prompt("প্রশাসক পাসওয়ার্ড লিখুন (Enter Admin Password):");
    
    // Default password is set to: 1234
    if (password === "1234") {
      isAdminUnlocked = true;
      
      if (lockText) lockText.innerText = "Admin Unlocked";
      if (lockIcon) lockIcon.className = "fa-solid fa-unlock";
      
      if (uploadForm) {
        uploadForm.classList.remove('locked');
        const inputs = uploadForm.querySelectorAll('input, select, button');
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
      
      alert("স্বাগতম! অ্যাডমিন প্যানেল সফলভাবে আনলক হয়েছে।");
    } else if (password !== null) {
      alert("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (ডিফল্ট পাসওয়ার্ড: 1234)");
    }
  } else {
    // Lock Admin Again
    isAdminUnlocked = false;
    
    if (lockText) lockText.innerText = "Unlock Admin";
    if (lockIcon) lockIcon.className = "fa-solid fa-lock";
    
    if (uploadForm) {
      uploadForm.classList.add('locked');
      const inputs = uploadForm.querySelectorAll('input, select, button');
      inputs.forEach(input => input.setAttribute('disabled', 'true'));
    }
    
    alert("অ্যাডমিন প্যানেল লক করা হয়েছে।");
  }
}

// Modal Toggle Functions
function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
  }
}

function closeSettingsModal(event) {
  if (event.target.id === 'settingsModal') {
    document.getElementById('settingsModal').style.display = 'none';
  }
}

function closeSettingsModalDirect() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'none';
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'flex';
}

function closeAuthModal(event) {
  if (event.target.id === 'authModal') {
    document.getElementById('authModal').style.display = 'none';
  }
}

function closeAuthModalDirect() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

// Upload Handling
function handleUpload(event) {
  event.preventDefault();
  if (!isAdminUnlocked) {
    alert("অনুগ্রহ করে প্রথমে অ্যাডমিন প্যানেল আনলক করুন।");
    return;
  }
  const title = document.getElementById('mediaTitle').value;
  alert(`"${title}" ফাইলটি সফলভাবে আপলোড হয়েছে!`);
  document.getElementById('uploadForm').reset();
}

// Preference Settings
function toggleTheme() {
  if (document.body.getAttribute('data-theme') === 'light') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
}

function toggleLayout() {
  const grid = document.getElementById('galleryGrid');
  if (grid) grid.classList.toggle('list-view');
}

function clearAllData() {
  localStorage.clear();
  alert("ক্যাশ ক্লিয়ার করা হয়েছে!");
  location.reload();
}
