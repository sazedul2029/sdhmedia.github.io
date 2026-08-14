// Cloudinary Configuration
const CLOUD_NAME = "crkxguin";
const UPLOAD_PRESET = "ml_default";

let isAdminUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  fetchGlobalAssets();
});

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

function toggleStatsMenu() {
  const dropdown = document.getElementById('statsDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

window.addEventListener('click', function(e) {
  const dropdown = document.getElementById('statsDropdown');
  const menuBtn = e.target.closest('.menu-dropdown-container');
  if (dropdown && !menuBtn) {
    dropdown.classList.remove('show');
  }
});

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

// Upload Media Asset with Specific Tag
async function handleUpload(event) {
  event.preventDefault();
  if (!isAdminUnlocked) {
    alert("প্রথমে প্যানেল আনলক করুন!");
    return;
  }

  const categoryInput = document.getElementById('mediaCategory').value;
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
  formData.append('tags', categoryInput);

  submitBtn.disabled = true;
  submitBtn.innerText = "আপলোড হচ্ছে...";

  try {
    const isVideo = file.type.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      document.getElementById('uploadForm').reset();
      closeSettingsModalDirect();
      alert("🎉 সফলভাবে উক্ত অ্যালবামে আপলোড হয়েছে!");
      setTimeout(() => fetchGlobalAssets(), 1000);
    } else {
      alert("আপলোড ব্যর্থ হয়েছে!");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("আপলোডে সমস্যা হয়েছে!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Fetch Assets from Cloudinary
async function fetchGlobalAssets() {
  const grid = document.getElementById('galleryGrid');
  if (grid) grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">লোড হচ্ছে...</p>`;

  const categories = ['sdh_hub', 'ecotec', 'energy_env'];
  let assets = [];

  for (const cat of categories) {
    try {
      const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${cat}.json`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const items = data.resources.map(r => ({
          id: r.public_id,
          title: r.public_id.split('/')[0],
          category: cat,
          url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/v${r.version}/${r.public_id}.${r.format}`
        }));
        assets = assets.concat(items);
      }
    } catch (e) {
      console.log("No images in " + cat);
    }
  }

  window.currentAssets = assets;
  renderGallery('all');
  updateStats();
}

// Render Gallery Cards
function renderGallery(filter = 'all') {
  const grid = document.getElementById('galleryGrid');
  const titleElem = document.getElementById('currentCategoryTitle');
  if (!grid) return;
  grid.innerHTML = '';

  const categoryNames = {
    'all': 'All Technical Assets',
    'sdh_hub': 'SDH Media Technical Hub',
    'ecotec': 'ECOTEC POWER LTD',
    'energy_env': 'Energy Efficiency & Environment'
  };

  if (titleElem) titleElem.innerText = categoryNames[filter] || 'Technical Assets';

  const assets = window.currentAssets || [];
  const filteredData = assets.filter(item => filter === 'all' || item.category === filter);

  if (filteredData.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub); padding: 40px;">এই অ্যালবামে এখনো কোনো ফাইল নেই। কন্ট্রোল প্যানেল থেকে আপলোড করুন!</p>`;
    return;
  }

  filteredData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';

    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}" loading="lazy">
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
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderGallery(cat);

  // Auto Scroll to Gallery Grid
  const grid = document.getElementById('galleryGrid');
  if (grid && cat !== 'all') {
    grid.scrollIntoView({ behavior: 'smooth' });
  }
}

function filterMedia() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const assets = window.currentAssets || [];
  const filtered = assets.filter(item => item.title.toLowerCase().includes(query));
  
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <img src="${item.url}">
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
  if (document.getElementById('statPhotos')) document.getElementById('statPhotos').innerText = assets.length;
  if (document.getElementById('statVideos')) document.getElementById('statVideos').innerText = 0;
  if (document.getElementById('statDownloads')) document.getElementById('statDownloads').innerText = assets.length;
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
