// Cloudinary Config for Global Media Storage
const CLOUDINARY_CLOUD_NAME = 'zs17v7x6'; 
const CLOUDINARY_UPLOAD_PRESET = 'sdhmedia';

// Initial Default Assets
const initialMedia = [
  { id: 1, title: 'Favicon Icon Asset', category: 'photo', url: 'favicon.png', views: 128, downloads: 42, favorite: false },
  { id: 2, title: 'Sazedul Profile Banner', category: 'photo', url: 'sazedul2029.png', views: 350, downloads: 89, favorite: true }
];

let mediaItems = JSON.parse(localStorage.getItem('sdh_media_v5')) || initialMedia;
let currentUser = JSON.parse(localStorage.getItem('sdh_user')) || null;
let currentCategory = 'all';
let isAdminUnlocked = false;
let isHideViews = false;
let isAutoplay = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
  renderGallery();
  updateStats();
});

// Update Statistics
function updateStats() {
  const photos = mediaItems.filter(i => i.category === 'photo').length;
  const videos = mediaItems.filter(i => i.category === 'video').length;
  const totalDownloads = mediaItems.reduce((acc, curr) => acc + curr.downloads, 0);

  document.getElementById('statPhotos').innerText = photos;
  document.getElementById('statVideos').innerText = videos;
  document.getElementById('statDownloads').innerText = totalDownloads;
}

// Render Gallery Grid
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  const searchVal = document.getElementById('searchInput').value.toLowerCase();

  const filtered = mediaItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchVal);
    const matchesCategory = currentCategory === 'all' || 
      (currentCategory === 'fav' ? item.favorite : item.category === currentCategory);
    return matchesSearch && matchesCategory;
  });

  if(filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: var(--text-muted);"><h3>কোনো মিডিয়া খুঁজে পাওয়া যায়নি!</h3></div>';
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = `media-card ${item.category}`;

    const mediaTag = item.category === 'photo'
      ? `<img src="${item.url}" alt="${item.title}" onclick="viewMedia(${item.id})">`
      : `<video src="${item.url}" ${isAutoplay ? 'autoplay loop muted' : ''} onclick="viewMedia(${item.id})"></video>`;

    const deleteBtn = isAdminUnlocked 
      ? `<button class="btn-delete" onclick="deleteMedia(${item.id})"><i class="fa-solid fa-trash"></i></button>` 
      : '';

    const viewsDisplay = isHideViews ? '' : `<span><i class="fa-regular fa-eye"></i> ${item.views} Views</span>`;

    card.innerHTML = `
      <div class="media-wrapper">
        ${mediaTag}
      </div>
      <div class="card-info">
        <div>
          <div class="card-title">${item.title}</div>
          <div class="card-stats">
            ${viewsDisplay}
            <span><i class="fa-solid fa-download"></i> ${item.downloads} DLs</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="fav-btn ${item.favorite ? 'active' : ''}" onclick="toggleFav(${item.id})">
            <i class="${item.favorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <div class="action-btns">
            <button onclick="shareMedia('${item.title}', '${item.url}')"><i class="fa-solid fa-share-nodes"></i></button>
            <button onclick="downloadMedia(${item.id}, '${item.url}')"><i class="fa-solid fa-download"></i></button>
            ${deleteBtn}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  saveData();
  updateStats();
}

// Admin Security Lock System
function toggleAdminAccess() {
  if(!isAdminUnlocked) {
    const pass = prompt("অ্যাডমিন এলাকা আনলক করতে পাসওয়ার্ড দিন:");
    if(pass === "1234") { // Default Pass: 1234
      isAdminUnlocked = true;
      document.getElementById('lockIcon').className = 'fa-solid fa-lock-open';
      document.getElementById('lockText').innerText = 'Admin Unlocked';
      document.getElementById('uploadForm').classList.remove('locked');
      
      document.getElementById('mediaTitle').disabled = false;
      document.getElementById('mediaCategory').disabled = false;
      document.getElementById('mediaFile').disabled = false;
      document.getElementById('submitUploadBtn').disabled = false;
      
      alert("অ্যাডমিন প্যানেল আনলক হয়েছে!");
      renderGallery();
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  } else {
    isAdminUnlocked = false;
    document.getElementById('lockIcon').className = 'fa-solid fa-lock';
    document.getElementById('lockText').innerText = 'Unlock Admin';
    document.getElementById('uploadForm').classList.add('locked');
    
    document.getElementById('mediaTitle').disabled = true;
    document.getElementById('mediaCategory').disabled = true;
    document.getElementById('mediaFile').disabled = true;
    document.getElementById('submitUploadBtn').disabled = true;
    
    renderGallery();
  }
}

// Global File Upload via Cloudinary API
async function handleUpload(e) {
  e.preventDefault();
  if(!isAdminUnlocked) return;

  const title = document.getElementById('mediaTitle').value;
  const category = document.getElementById('mediaCategory').value;
  const fileInput = document.getElementById('mediaFile');
  const file = fileInput.files[0];

  if(!file) return;

  const progressDiv = document.getElementById('uploadProgress');
  progressDiv.innerText = "সার্ভারে আপলোড হচ্ছে, দয়া করে একটু অপেক্ষা করুন...";

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const resourceType = category === 'video' ? 'video' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      const newItem = {
        id: Date.now(),
        title: title,
        category: category,
        url: data.secure_url,
        views: 0,
        downloads: 0,
        favorite: false
      };
      mediaItems.unshift(newItem);
      renderGallery();
      document.getElementById('uploadForm').reset();
      progressDiv.innerText = "আপলোড সফল হয়েছে! এখন সবাই দেখতে পাবে।";
      setTimeout(() => { progressDiv.innerText = ""; }, 3000);
    } else {
      alert("আপলোড ব্যর্থ হয়েছে! Cloudinary সেটিংস আবার চেক করুন।");
      progressDiv.innerText = "";
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন।");
    progressDiv.innerText = "";
  }
}

// Settings Modal Controls
function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}
function closeSettingsModalDirect() { document.getElementById('settingsModal').style.display = 'none'; }
function closeSettingsModal(e) {
  if(e.target.id === 'settingsModal') document.getElementById('settingsModal').style.display = 'none';
}

// Advanced Preferences Settings
function toggleAutoplay(element) {
  isAutoplay = element.checked;
  renderGallery();
}

function toggleHideViews(element) {
  isHideViews = element.checked;
  renderGallery();
}

function clearAllData() {
  if(confirm("আপনি কি নিশ্চিত যে আপনার স্থানীয় ক্যাশ রিসেট করতে চান?")) {
    localStorage.removeItem('sdh_media_v5');
    mediaItems = initialMedia;
    renderGallery();
    alert("সাইট রিসেট করা হয়েছে।");
  }
}

// Lightbox
function viewMedia(id) {
  const item = mediaItems.find(i => i.id === id);
  if(!item) return;

  item.views += 1;
  renderGallery();

  const lightbox = document.getElementById('lightbox');
  const body = document.getElementById('lightboxBody');
  const caption = document.getElementById('lightboxCaption');

  body.innerHTML = item.category === 'photo' 
    ? `<img src="${item.url}">` 
    : `<video src="${item.url}" controls autoplay></video>`;

  caption.innerText = item.title;
  lightbox.style.display = 'flex';
}

function closeLightbox(e) {
  if(e.target.id === 'lightbox' || e.target.classList.contains('close-btn')) {
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lightboxBody').innerHTML = '';
  }
}

// Download Counter
function downloadMedia(id, url) {
  mediaItems = mediaItems.map(item => {
    if(item.id === id) item.downloads += 1;
    return item;
  });
  renderGallery();

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = `SDH-Media-${id}`;
  a.click();
}

// Favorites
function toggleFav(id) {
  mediaItems = mediaItems.map(item => {
    if(item.id === id) item.favorite = !item.favorite;
    return item;
  });
  renderGallery();
}

// Delete Item
function deleteMedia(id) {
  if(confirm('আপনি কি এই মিডিয়াটি মুছে ফেলতে চান?')) {
    mediaItems = mediaItems.filter(item => item.id !== id);
    renderGallery();
  }
}

// Share Feature
function shareMedia(title, url) {
  if(navigator.share) {
    navigator.share({ title: title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('ওয়েবসাইট লিংক কপি হয়েছে!');
  }
}

// Category Filter
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}

function filterMedia() { renderGallery(); }

// Layout & Theme Toggle
function toggleLayout() {
  const grid = document.getElementById('galleryGrid');
  grid.classList.toggle('list-view');
  document.getElementById('viewToggleBtn').innerHTML = grid.classList.contains('list-view')
    ? '<i class="fa-solid fa-border-all"></i>'
    : '<i class="fa-solid fa-list"></i>';
}

function toggleTheme() {
  const body = document.body;
  if(body.getAttribute('data-theme') === 'light') {
    body.removeAttribute('data-theme');
    document.getElementById('themeBtn').innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    body.setAttribute('data-theme', 'light');
    document.getElementById('themeBtn').innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}

// User Auth System
function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeAuthModalDirect() { document.getElementById('authModal').style.display = 'none'; }
function closeAuthModal(e) {
  if(e.target.id === 'authModal') document.getElementById('authModal').style.display = 'none';
}

function handleAuth(e) {
  e.preventDefault();
  const name = document.getElementById('userName').value;
  currentUser = { name };
  localStorage.setItem('sdh_user', JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModalDirect();
  alert(`স্বাগতম, ${name}!`);
}

function updateUserUI() {
  if(currentUser) {
    document.getElementById('authBtnText').innerText = `Hi, ${currentUser.name.split(' ')[0]}`;
  }
}

// Save Data
function saveData() {
  localStorage.setItem('sdh_media_v5', JSON.stringify(mediaItems));
        }
        
