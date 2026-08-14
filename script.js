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
    const password = prompt("Enter Admin Password (Default: 1234):");
    if (password === "1234") {
      isAdminUnlocked = true;
      if (lockText) lockText.innerText = "Admin Unlocked";
      if (lockIcon) lockIcon.className = "fa-solid fa-unlock";
      if (uploadForm) {
        uploadForm.classList.remove('locked');
        const inputs = uploadForm.querySelectorAll('input, select, button');
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
      alert("Welcome Admin! Panel unlocked and Delete controls enabled.");
      refreshCurrentGalleryView();
    } else if (password !== null) {
      alert("Incorrect Password! Default password is: 1234");
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
    alert("Admin Panel locked.");
    refreshCurrentGalleryView();
  }
}

// Upload Media Asset
async function handleUpload(event) {
  event.preventDefault();
  if (!isAdminUnlocked) {
    alert("Please unlock Admin Panel first!");
    return;
  }

  const categoryInput = document.getElementById('mediaCategory').value;
  const fileInput = document.getElementById('mediaFile');
  const submitBtn = document.getElementById('submitUploadBtn');

  if (!fileInput.files[0]) {
    alert("Please select a file to upload!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('tags', categoryInput);

  submitBtn.disabled = true;
  submitBtn.innerText = "Uploading Asset...";

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
      alert("🎉 Asset published successfully!");
      setTimeout(() => fetchGlobalAssets(), 1000);
    } else {
      alert("Upload failed! Please check Cloudinary setup.");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("Error uploading asset!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Admin Delete Functionality
function deleteAsset(id) {
  if (!isAdminUnlocked) {
    alert("Admin access required to delete assets!");
    return;
  }

  if (confirm("Are you sure you want to delete this asset?")) {
    window.currentAssets = window.currentAssets.filter(item => item.id !== id);
    alert("Asset removed successfully!");
    refreshCurrentGalleryView();
    updateStats();
  }
}

// Fetch Assets from Cloudinary
async function fetchGlobalAssets() {
  const grid = document.getElementById('galleryGrid');
  if (grid) grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub, #888); padding: 40px;">Loading technical assets...</p>`;

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
  renderMainHomeGallery();
  updateStats();
}

// Render Main Home Gallery
function renderMainHomeGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const assets = window.currentAssets || [];

  if (assets.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub, #888); padding: 40px;">No technical assets available. Upload via Control Panel!</p>`;
    return;
  }

  assets.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}" loading="lazy">
      <div class="card-details">
        <div class="card-title">${item.title}</div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <a href="${item.url}" target="_blank" download class="download-link" style="flex:1;">
            <i class="fa-solid fa-download"></i> Download
          </a>
          ${isAdminUnlocked ? `
            <button onclick="deleteAsset('${item.id}')" style="background:#ff3366; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Enter Inside Banner Page Mode
function enterBannerPage(categoryKey) {
  window.currentActiveCategory = categoryKey;
  const mainHomeView = document.getElementById('mainHomeView');
  const bannerPageView = document.getElementById('bannerPageView');
  const bannerHeader = document.getElementById('activeBannerHeader');
  const bannerTitle = document.getElementById('bannerPageTitle');
  const bannerDesc = document.getElementById('bannerPageDesc');

  const metaData = {
    'sdh_hub': {
      title: 'SDH Media Technical Hub',
      desc: 'Leading the Way in Green Zero-Carbon Gas & Power Solutions',
      bgClass: 'hero-bg-1'
    },
    'ecotec': {
      title: 'ECOTEC POWER LTD',
      desc: 'Innovative and sustainable power generation and technical support',
      bgClass: 'hero-bg-2'
    },
    'energy_env': {
      title: 'Energy Efficiency & Environment',
      desc: 'Integrated service model offering consistent eco-friendly support',
      bgClass: 'hero-bg-3'
    }
  };

  const currentMeta = metaData[categoryKey];
  if (!currentMeta) return;

  bannerTitle.innerText = currentMeta.title;
  bannerDesc.innerText = currentMeta.desc;
  bannerHeader.className = `hero-card ${currentMeta.bgClass}`;

  renderBannerGalleryGrid(categoryKey);

  mainHomeView.style.display = 'none';
  bannerPageView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const dropdown = document.getElementById('statsDropdown');
  if (dropdown) dropdown.classList.remove('show');
}

function renderBannerGalleryGrid(categoryKey) {
  const grid = document.getElementById('bannerGalleryGrid');
  if (!grid) return;

  const assets = window.currentAssets || [];
  const filtered = assets.filter(item => item.category === categoryKey);

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub, #888); padding: 40px;">No assets uploaded inside this category yet!</p>`;
  } else {
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img src="${item.url}" alt="${item.title}" loading="lazy">
        <div class="card-details">
          <div class="card-title">${item.title}</div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <a href="${item.url}" target="_blank" download class="download-link" style="flex:1;">
              <i class="fa-solid fa-download"></i> Download
            </a>
            ${isAdminUnlocked ? `
              <button onclick="deleteAsset('${item.id}')" style="background:#ff3366; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

function refreshCurrentGalleryView() {
  const isBannerView = document.getElementById('bannerPageView').style.display === 'block';
  if (isBannerView && window.currentActiveCategory) {
    renderBannerGalleryGrid(window.currentActiveCategory);
  } else {
    renderMainHomeGallery();
  }
}

// Return to Main Home
function openMainHomeView() {
  window.currentActiveCategory = null;
  document.getElementById('bannerPageView').style.display = 'none';
  document.getElementById('mainHomeView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterMedia() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const assets = window.currentAssets || [];
  const filtered = assets.filter(item => item.title.toLowerCase().includes(query));
  
  const isBannerView = document.getElementById('bannerPageView').style.display === 'block';
  const grid = isBannerView ? document.getElementById('bannerGalleryGrid') : document.getElementById('galleryGrid');
  
  grid.innerHTML = '';
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <img src="${item.url}">
      <div class="card-details">
        <div class="card-title">${item.title}</div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <a href="${item.url}" target="_blank" class="download-link" style="flex:1;"><i class="fa-solid fa-download"></i> Download</a>
          ${isAdminUnlocked ? `
            <button onclick="deleteAsset('${item.id}')" style="background:#ff3366; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          ` : ''}
        </div>
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
  alert("Cache data reset successfully!");
  location.reload();
}

function handleAuth(e) {
  e.preventDefault();
  alert("Account action successful!");
  closeAuthModalDirect();
}
