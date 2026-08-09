// --- CLOUDINARY CONFIGURATION (CONFIGURED WITH YOUR CREDENTIALS) ---
const CLOUD_NAME = "crkxguin";
const UPLOAD_PRESET = "ml_default";

// Local Admin & Media State
let isAdminUnlocked = false;
let mediaGallery = JSON.parse(localStorage.getItem('sdh_media_assets')) || [];

// Initialize Page Load
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  updateStats();
});

// Admin Access Control
function toggleAdminAccess() {
  const lockText = document.getElementById('lockText');
  const lockIcon = document.getElementById('lockIcon');
  const uploadForm = document.getElementById('uploadForm');

  if (!isAdminUnlocked) {
    const password = prompt("অ্যাডমিন পাসওয়ার্ড লিখুন (Enter Admin Password):");
    if (password === "1234") { // Default password
      isAdminUnlocked = true;
      if (lockText) lockText.innerText = "Admin Unlocked";
      if (lockIcon) lockIcon.className = "fa-solid fa-unlock";
      if (uploadForm) {
        uploadForm.classList.remove('locked');
        const inputs = uploadForm.querySelectorAll('input, select, button');
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
      alert("স্বাগতম! অ্যাডমিন প্যানেল আনলক হয়েছে।");
    } else if (password !== Sa528905Zu@) {
      alert("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (ডিফল্ট: Sa528905Zu@)।");
    }
  } else {
    isAdminUnlocked = false;
    if (lockText) lockText.innerText = "Unlock Admin";
    if (lockIcon) lockIcon.className = "fa-solid fa-lock";
    if (uploadForm) {
      uploadForm.classList.add('locked');
      const inputs = uploadForm.querySelectorAll('input, select, button');
      inputs.forEach(input => input.setAttribute('disabled', 'true'));
    }
    alert("অ্যাডমিন প্যানেল পুনরায় লক করা হয়েছে।");
  }
}

// Upload Media to Cloudinary directly
async function handleUpload(event) {
  event.preventDefault();
  if (!isAdminUnlocked) {
    alert("অনুগ্রহ করে প্রথমে অ্যাডমিন প্যানেল আনলক করুন!");
    return;
  }

  const titleInput = document.getElementById('mediaTitle');
  const categoryInput = document.getElementById('mediaCategory');
  const fileInput = document.getElementById('mediaFile');
  const submitBtn = document.getElementById('submitUploadBtn');

  if (!fileInput.files[0]) {
    alert("একটি ফটো বা ভিডিও ফাইল সিলেক্ট করুন!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  submitBtn.disabled = true;
  submitBtn.innerText = "Cloudinary-তে আপলোড হচ্ছে...";

  try {
    const resourceType = categoryInput.value === 'video' ? 'video' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      const newAsset = {
        id: Date.now(),
        title: titleInput.value,
        category: categoryInput.value,
        url: data.secure_url,
        date: new Date().toLocaleDateString()
      };

      mediaGallery.unshift(newAsset);
      localStorage.setItem('sdh_media_assets', JSON.stringify(mediaGallery));

      renderGallery();
      updateStats();
      document.getElementById('uploadForm').reset();
      alert("🎉 সফলভাবে Cloudinary-তে আপলোড ও গ্যালারিতে যুক্ত হয়েছে!");
    } else {
      alert("আপলোড ব্যর্থ হয়েছে! অনুগ্রহ করে Cloudinary Settings চেক করুন।");
    }
  } catch (error) {
    console.error("Upload Error:", error);
    alert("নেটওয়ার্ক বা ফাইল আপলোডে সমস্যা হয়েছে!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Render Gallery Cards
function renderGallery(filter = 'all') {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filteredData = mediaGallery.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  if (filteredData.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 50px;">কোনো মিডিয়া পাওয়া যায়নি। সেটিংসে গিয়ে নতুন কিছু আপলোড করুন!</p>`;
    return;
  }

  filteredData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';

    const mediaElement = item.category === 'video' 
      ? `<video src="${item.url}" controls preload="metadata"></video>`
      : `<img src="${item.url}" alt="${item.title}" loading="lazy">`;

    card.innerHTML = `
      ${mediaElement}
      <div class="card-details">
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span><i class="fa-solid fa-folder"></i> ${item.category.toUpperCase()}</span>
          <span>${item.date}</span>
        </div>
        <a href="${item.url}" target="_blank" download class="download-link">
          <i class="fa-solid fa-download"></i> Download High Res
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Category Filter
function filterCategory(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGallery(cat);
}

// Search Functionality
function filterMedia() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = mediaGallery.filter(item => item.title.toLowerCase().includes(query));
  
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 50px;">খুঁজে পাওয়া যায়নি!</p>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    const mediaElement = item.category === 'video' 
      ? `<video src="${item.url}" controls></video>`
      : `<img src="${item.url}">`;

    card.innerHTML = `
      ${mediaElement}
      <div class="card-details">
        <div class="card-title">${item.title}</div>
        <a href="${item.url}" target="_blank" class="download-link"><i class="fa-solid fa-download"></i> Download</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Dynamic Stats Counter
function updateStats() {
  const photos = mediaGallery.filter(i => i.category === 'photo').length;
  const videos = mediaGallery.filter(i => i.category === 'video').length;

  if (document.getElementById('statPhotos')) document.getElementById('statPhotos').innerText = photos;
  if (document.getElementById('statVideos')) document.getElementById('statVideos').innerText = videos;
  if (document.getElementById('statDownloads')) document.getElementById('statDownloads').innerText = photos + videos;
}

// UI Controls
function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function closeSettingsModal(event) {
  if (event.target.id === 'settingsModal') document.getElementById('settingsModal').style.display = 'none';
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
  if (event.target.id === 'authModal') document.getElementById('authModal').style.display = 'none';
}

function closeAuthModalDirect() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

function toggleTheme() {
  if (document.body.getAttribute('data-theme') === 'light') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
}

function clearAllData() {
  localStorage.clear();
  alert("ক্যাশ রিসেট করা হয়েছে!");
  location.reload();
}

function handleAuth(e) {
  e.preventDefault();
  alert("Login Successful!");
  closeAuthModalDirect();
}
