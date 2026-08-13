// Cloudinary Configuration
const CLOUD_NAME = "crkxguin";
const UPLOAD_PRESET = "ml_default";

// Local Admin State
let isAdminUnlocked = false;

// Page Load Event
document.addEventListener('DOMContentLoaded', () => {
  fetchGlobalAssets();
});

// Modal Handlers
function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.toggle('show');
}

function closeSettingsModalDirect() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('show');
}

function closeSettingsModal(event) {
  if (event.target.id === 'settingsModal') closeSettingsModalDirect();
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('show');
}

function closeAuthModalDirect() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('show');
}

function closeAuthModal(event) {
  if (event.target.id === 'authModal') closeAuthModalDirect();
}

// Admin Panel Unlock
function toggleAdminAccess() {
  const lockText = document.getElementById('lockText');
  const lockIcon = document.getElementById('lockIcon');
  const uploadForm = document.getElementById('uploadForm');

  if (!isAdminUnlocked) {
    const password = prompt("পাসওয়ার্ড দিন (Default Password: 1234):");
    if (password === "1234") {
      isAdminUnlocked = true;
      if (lockText) lockText.innerText = "Admin Unlocked";
      if (lockIcon) lockIcon.className = "fa-solid fa-unlock";
      if (uploadForm) {
        uploadForm.classList.remove('locked');
        const inputs = uploadForm.querySelectorAll('input, select, button');
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
      alert("স্বাগতম! টেকনিক্যাল প্যানেল আনলক হয়েছে।");
    } else if (password !== null) {
      alert("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড: 1234");
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
    alert("প্যানেল লক করা হয়েছে।");
  }
}

// Upload Media Asset
async function handleUpload(event) {
  event.preventDefault();
  if (!isAdminUnlocked) {
    alert("প্রথমে প্যানেল আনলক করুন!");
    return;
  }

  const titleInput = document.getElementById('mediaTitle');
  const categoryInput = document.getElementById('mediaCategory');
  const fileInput = document.getElementById('mediaFile');
  const submitBtn = document.getElementById('submitUploadBtn');

  if (!fileInput.files[0]) {
    alert("একটি ফাইল সিলেক্ট করুন!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('tags', categoryInput.value);

  submitBtn.disabled = true;
  submitBtn.innerText = "আপলোড হচ্ছে...";

  try {
    const resourceType = categoryInput.value === 'video' ? 'video' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      document.getElementById('uploadForm').reset();
      closeSettingsModalDirect();
      alert("🎉 সফলভাবে ক্লাউডে আপলোড হয়েছে!");
      setTimeout(() => fetchGlobalAssets(), 1000);
    } else {
      alert("আপলোড ব্যর্থ হয়েছে! প্রিসেট নাম চেক করুন।");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("আপলোডে সমস্যা হয়েছে!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Fetch Assets from Cloudinary with f_auto,q_auto Optimization
async function fetchGlobalAssets() {
  const grid = document.getElementById('galleryGrid');
  if (grid) grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">লোড হচ্ছে...</p>`;

  try {
    const imgRes = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/photo.json`).catch(() => null);
    const vidRes = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/video/list/video.json`).catch(() => null);

    let assets = [];

    if (imgRes && imgRes.ok) {
      const imgData = await imgRes.json();
      const images = imgData.resources.map(r => ({
        id: r.public_id,
        title: r.public_id.split('/')[0],
        category: 'photo',
        // f_auto,q_auto যুক্ত করে সাইজ ছোট করার অটো-অপ্টিমাইজেশন
        url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/v${r.version}/${r.public_id}.${r.format}`
      }));
      assets = assets.concat(images);
    }

    if (vidRes && vidRes.ok) {
      const vidData = await vidRes.json();
      const videos = vidData.resources.map(r => ({
        id: r.public_id,
        title: r.public_id.split('/')[0],
        category: 'video',
        // ভিডিওর জন্যও অটো অপ্টিমাইজেশন
        url: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto/v${r.version}/${r.public_id}.${r.format}`
      }));
      assets = assets.concat(videos);
    }

    window.currentAssets = assets;
    renderGallery('all');
    updateStats();
  } catch (err) {
    console.error("Error fetching assets:", err);
    renderGallery('all');
  }
}

// Render Gallery
function renderGallery(filter = 'all') {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const assets = window.currentAssets || [];
  const filteredData = assets.filter(item => filter === 'all' || item.category === filter);

  if (filteredData.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">টেকনিক্যাল হাবে কোনো ফাইল নেই। গিয়ার আইকনে চাপ দিয়ে আপলোড করুন!</p>`;
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
        <a href="${item.url}" target="_blank" download class="download-link">
          <i class="fa-solid fa-download"></i> Download High Res
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterCategory(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGallery(cat);
}

function filterMedia() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const assets = window.currentAssets || [];
  const filtered = assets.filter(item => item.title.toLowerCase().includes(query));
  
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">খুঁজে পাওয়া যায়নি!</p>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    const mediaElement = item.category === 'video' ? `<video src="${item.url}" controls></video>` : `<img src="${item.url}">`;

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

function updateStats() {
  const assets = window.currentAssets || [];
  const photos = assets.filter(i => i.category === 'photo').length;
  const videos = assets.filter(i => i.category === 'video').length;

  if (document.getElementById('statPhotos')) document.getElementById('statPhotos').innerText = photos;
  if (document.getElementById('statVideos')) document.getElementById('statVideos').innerText = videos;
  if (document.getElementById('statDownloads')) document.getElementById('statDownloads').innerText = photos + videos;
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
  alert("ক্যাশ ডাটা রিসেট করা হয়েছে!");
  location.reload();
}

function handleAuth(e) {
  e.preventDefault();
  alert("সফলভাবে লগইন হয়েছে!");
  closeAuthModalDirect();
}
