// Cloudinary Configuration
const CLOUD_NAME = "crkxguin";
const UPLOAD_PRESET = "ml_default";

// Local States
let isAdminUnlocked = false;
let mediaGallery = JSON.parse(localStorage.getItem('sdh_media_assets')) || [];

// Initialize Technical Hub Page
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  updateStats();
});

// Modal Handlers
function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.toggle('show');
  }
}

function closeSettingsModalDirect() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function closeSettingsModal(event) {
  if (event.target.id === 'settingsModal') {
    closeSettingsModalDirect();
  }
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeAuthModalDirect() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function closeAuthModal(event) {
  if (event.target.id === 'authModal') {
    closeAuthModalDirect();
  }
}

// Admin Lock Toggle
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

// Upload Media Asset to Cloudinary
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
      closeSettingsModalDirect();
      alert("🎉 সফলভাবে টেকনিক্যাল হাবে আপলোড হয়েছে!");
    } else {
      alert("আপলোড ব্যর্থ হয়েছে! ক্লাউডিনারী প্রিসেট চেক করুন।");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("আপলোডে সমস্যা হয়েছে!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Render Gallery Elements
function renderGallery(filter = 'all') {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filteredData = mediaGallery.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  if (filteredData.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">টেকনিক্যাল হাবে কোনো ফাইল নেই। গিয়ার আইকনে চাপ দিয়ে আপলোড করুন!</p>`;
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

// Filter Options
function filterCategory(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGallery(cat);
}

// Search Filter
function filterMedia() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = mediaGallery.filter(item => item.title.toLowerCase().includes(query));
  
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">খুঁজে পাওয়া যায়নি!</p>`;
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

// Stats Counter
function updateStats() {
  const photos = mediaGallery.filter(i => i.category === 'photo').length;
  const videos = mediaGallery.filter(i => i.category === 'video').length;

  if (document.getElementById('statPhotos')) document.getElementById('statPhotos').innerText = photos;
  if (document.getElementById('statVideos')) document.getElementById('statVideos').innerText = videos;
  if (document.getElementById('statDownloads')) document.getElementById('statDownloads').innerText = photos + videos;
}

// Theme Toggle
function toggleTheme() {
  if (document.body.getAttribute('data-theme') === 'light') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
}

// Clear Cache Data
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
