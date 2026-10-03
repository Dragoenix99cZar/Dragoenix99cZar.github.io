/**
 * WIP Systems Lab - Interactive Client-Side Search, Filter, and Grid Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const filterPills = document.querySelectorAll('.pill-btn');
  const cards = document.querySelectorAll('.project-card');
  const emptyState = document.getElementById('emptyState');
  const totalCount = document.getElementById('totalCount');

  let currentCategory = 'all';
  let searchQuery = '';

  /**
   * Dynamically computes and updates pill badge counters based on loaded DOM cards
   */
  function updatePillCounts() {
    filterPills.forEach(pill => {
      const filter = pill.dataset.filter;
      let count = 0;
      cards.forEach(card => {
        if (filter === 'all' || (card.dataset.category && card.dataset.category.includes(filter))) {
          count++;
        }
      });
      const baseText = pill.textContent.replace(/\s*\(\d+\)/, '');
      pill.textContent = `${baseText} (${count})`;
    });
  }

  /**
   * Filters and displays project cards according to active category and search terms
   */
  function updateGrid() {
    let visibleCount = 0;

    cards.forEach(card => {
      const categoryMatch = currentCategory === 'all' || (card.dataset.category && card.dataset.category.includes(currentCategory));

      const titleEl = card.querySelector('.card-title');
      const subtitleEl = card.querySelector('.card-subtitle');
      const cardText = (
        (titleEl ? titleEl.textContent : '') + ' ' +
        (subtitleEl ? subtitleEl.textContent : '') + ' ' +
        (card.dataset.tags || '') + ' ' +
        card.textContent
      ).toLowerCase();

      const searchMatch = !searchQuery || cardText.includes(searchQuery);

      if (categoryMatch && searchMatch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    if (totalCount) {
      totalCount.textContent = visibleCount;
    }
  }

  // Filter pill click listener
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.filter;
      updateGrid();
    });
  });

  // Search input typing listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateGrid();
    });
  }

  // Keyboard shortcut: '/' to focus search input
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Initial execution on page load
  updatePillCounts();
  updateGrid();
});
