// Cloudinary Configuration
const CLOUD_NAME = "crkxguin";
const UPLOAD_PRESET = "ml_default"; 

let isAdminUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  fetchGlobalAssets();
  renderAllSystemNotes();
});

// Settings & Modal Controls
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

// SECURE ADMIN TOGGLE
function toggleAdminAccess() {
  const lockText = document.getElementById('lockText');
  const lockIcon = document.getElementById('lockIcon');
  const uploadForm = document.getElementById('uploadForm');
  const adminControls = document.querySelectorAll('.admin-note-controls');

  if (!isAdminUnlocked) {
    const password = prompt("Enter Admin Secret Key:");
    if (password === "20292030") {
      isAdminUnlocked = true;
      if (lockText) lockText.innerText = "Admin Unlocked";
      if (lockIcon) lockIcon.className = "fa-solid fa-unlock";
      if (uploadForm) {
        uploadForm.classList.remove('locked');
        const inputs = uploadForm.querySelectorAll('input, select, button');
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
      adminControls.forEach(ctrl => ctrl.style.display = 'block');
      alert("Welcome Admin! Access granted.");
      renderAllSystemNotes();
      refreshCurrentGalleryView();
    } else if (password !== null) {
      alert("Access Denied! Incorrect Secret Key.");
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
    adminControls.forEach(ctrl => ctrl.style.display = 'none');
    alert("Admin Panel locked.");
    renderAllSystemNotes();
    refreshCurrentGalleryView();
  }
}

// Upload Asset Function
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
      setTimeout(() => fetchGlobalAssets(), 1500);
    } else {
      alert("Upload failed! Make sure 'ml_default' preset is set to Unsigned in Cloudinary.");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("Error uploading asset!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Publish Asset";
  }
}

// Fetch Assets from Cloudinary
async function fetchGlobalAssets() {
  const grid = document.getElementById('galleryGrid');
  if (grid) grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub, #888); padding: 40px;">Loading technical assets...</p>`;

  const categories = ['home', 'sdh_hub', 'ecotec', 'energy_env'];
  let assets = [];

  for (const cat of categories) {
    try {
      const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${cat}.json?timestamp=${new Date().getTime()}`).catch(() => null);
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
      console.log("No images in category: " + cat);
    }
  }

  window.currentAssets = assets;
  refreshCurrentGalleryView();
  updateStats();
}

// Render Main Home Gallery
function renderMainHomeGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const assets = window.currentAssets || [];
  const homeAssets = assets.filter(item => item.category === 'home');

  if (homeAssets.length === 0) {
    grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: var(--text-sub, #888); padding: 40px;">No general assets uploaded to Home gallery yet.</p>`;
    return;
  }

  homeAssets.forEach(item => {
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
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Render Inside Banner Gallery
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
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

// SYSTEM NOTES (FETCH FROM notes.json)
async function renderAllSystemNotes() {
  const sections = ['mechanical', 'electrical', 'power'];
  try {
    const response = await fetch('notes.json?cache_bypass=' + new Date().getTime());
    if (!response.ok) throw new Error("notes.json file missing");
    
    const data = await response.json();

    sections.forEach(type => {
      const displayEl = document.getElementById(`${type}DisplayList`);
      if (displayEl) {
        let html = '<ul style="margin: 0; padding-left: 18px; list-style-type: square; color: var(--text-main, #fff);">';
        if (data[type] && data[type].length > 0) {
          data[type].forEach(item => {
            html += `<li style="margin-bottom: 8px; font-size: 13px;">${item}</li>`;
          });
        } else {
          html += `<li style="font-size: 12px; color: #888;">No notes added yet.</li>`;
        }
        html += '</ul>';
        displayEl.innerHTML = html;
      }
    });
  } catch (e) {
    console.error("Notes error:", e);
    sections.forEach(type => {
      const displayEl = document.getElementById(`${type}DisplayList`);
      if (displayEl) {
        displayEl.innerHTML = `<p style="color: #ff4d4d; font-size: 12px; margin:0;">Ensure notes.json file is saved in Github!</p>`;
      }
    });
  }
}

// Navigation & Page Change
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

function refreshCurrentGalleryView() {
  const isBannerView = document.getElementById('bannerPageView') && document.getElementById('bannerPageView').style.display === 'block';
  if (isBannerView && window.currentActiveCategory) {
    renderBannerGalleryGrid(window.currentActiveCategory);
  } else {
    renderMainHomeGallery();
  }
}

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
  
  const isBannerView = document.getElementById('bannerPageView') && document.getElementById('bannerPageView').style.display === 'block';
  const grid = isBannerView ? document.getElementById('bannerGalleryGrid') : document.getElementById('galleryGrid');
  
  if (!grid) return;
  grid.innerHTML = '';
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}">
      <div class="card-details">
        <div class="card-title">${item.title}</div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <a href="${item.url}" target="_blank" class="download-link" style="flex:1;"><i class="fa-solid fa-download"></i> Download</a>
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
  alert("Cache reset!");
  location.reload();
}

function handleAuth(e) {
  e.preventDefault();
  alert("Account action successful!");
  closeAuthModalDirect();
}
