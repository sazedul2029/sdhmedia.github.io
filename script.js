// নোটসগুলো এখন গিটহাবের JSON ফাইল থেকে আসবে
async function renderAllSystemNotes() {
  const sections = ['mechanical', 'electrical', 'power'];
  
  try {
    const response = await fetch('notes.json'); // গিটহাবের ফাইলের নাম
    const data = await response.json();

    sections.forEach(type => {
      const displayEl = document.getElementById(`${type}DisplayList`);
      if (displayEl) {
        let html = '<ul style="margin: 0; padding-left: 18px; list-style-type: square;">';
        
        // ফাইল থেকে আসা তথ্যগুলো লিস্ট আকারে সাজাবে
        data[type].forEach(item => {
          html += `<li style="margin-bottom: 8px; font-size: 13px;">${item}</li>`;
        });
        
        html += '</ul>';
        displayEl.innerHTML = html;
      }
    });
  } catch (e) {
    console.error("নোটস লোড করতে সমস্যা হচ্ছে:", e);
  }
}
