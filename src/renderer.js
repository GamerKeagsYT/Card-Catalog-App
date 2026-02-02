const drawerList = document.getElementById('drawerList');
const drawerTitle = document.getElementById('drawerTitle');
const drawerSubtitle = document.getElementById('drawerSubtitle');
const cardContainer = document.getElementById('cardContainer');
const emptyState = document.getElementById('emptyState');
const toggleViewButton = document.getElementById('toggleView');
const newCardButton = document.getElementById('newCardButton');
const newDrawerButton = document.getElementById('newDrawerButton');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const cardModal = document.getElementById('cardModal');
const cardForm = document.getElementById('cardForm');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const drawerSelect = document.getElementById('drawerSelect');

const drawerModal = document.getElementById('drawerModal');
const drawerForm = document.getElementById('drawerForm');
const closeDrawerModal = document.getElementById('closeDrawerModal');
const cancelDrawerModal = document.getElementById('cancelDrawerModal');

const state = {
  data: { drawers: [] },
  activeDrawerId: null,
  viewMode: 'grid',
  history: [],
  future: []
};

const cloneData = (data) => JSON.parse(JSON.stringify(data));

const pushHistory = () => {
  state.history.push(cloneData(state.data));
  if (state.history.length > 50) {
    state.history.shift();
  }
  state.future = [];
};

const undo = () => {
  if (state.history.length === 0) return;
  state.future.push(cloneData(state.data));
  state.data = state.history.pop();
  persist();
  render();
};

const redo = () => {
  if (state.future.length === 0) return;
  state.history.push(cloneData(state.data));
  state.data = state.future.pop();
  persist();
  render();
};

const persist = () => window.catalog.saveData(state.data);

const setViewMode = (mode) => {
  state.viewMode = mode;
  toggleViewButton.textContent = mode === 'grid' ? 'Grid View' : 'Stack View';
  renderCards();
};

const openModal = () => {
  cardModal.classList.add('open');
  cardModal.setAttribute('aria-hidden', 'false');
};

const closeCardModal = () => {
  cardModal.classList.remove('open');
  cardModal.setAttribute('aria-hidden', 'true');
  cardForm.reset();
};

const openDrawerModal = () => {
  drawerModal.classList.add('open');
  drawerModal.setAttribute('aria-hidden', 'false');
};

const closeDrawerModalView = () => {
  drawerModal.classList.remove('open');
  drawerModal.setAttribute('aria-hidden', 'true');
  drawerForm.reset();
};

const renderDrawers = () => {
  drawerList.innerHTML = '';
  drawerSelect.innerHTML = '';

  state.data.drawers.forEach((drawer) => {
    const item = document.createElement('button');
    item.className = `drawer-item${drawer.id === state.activeDrawerId ? ' active' : ''}`;
    item.innerHTML = `<strong>${drawer.name}</strong><span>${drawer.cards.length} cards</span>`;
    item.addEventListener('click', () => {
      state.activeDrawerId = drawer.id;
      render();
    });
    drawerList.appendChild(item);

    const option = document.createElement('option');
    option.value = drawer.id;
    option.textContent = drawer.name;
    if (drawer.id === state.activeDrawerId) {
      option.selected = true;
    }
    drawerSelect.appendChild(option);
  });
};

const activeDrawer = () => state.data.drawers.find((drawer) => drawer.id === state.activeDrawerId);

const normalize = (value) => (value || '').toString().toLowerCase();

const filteredCards = (cards) => {
  const query = normalize(searchInput.value);
  if (!query) return cards;
  return cards.filter((card) => {
    return (
      normalize(card.title).includes(query) ||
      normalize(card.author).includes(query) ||
      normalize(card.subjects).includes(query) ||
      normalize(card.callNumber).includes(query)
    );
  });
};

const sortCards = (cards) => {
  const key = sortSelect.value;
  return [...cards].sort((a, b) => {
    const aValue = normalize(a[key]);
    const bValue = normalize(b[key]);
    return aValue.localeCompare(bValue, undefined, { numeric: true });
  });
};

const renderCards = () => {
  const drawer = activeDrawer();
  cardContainer.innerHTML = '';

  if (!drawer) {
    emptyState.style.display = 'block';
    return;
  }

  const sorted = sortCards(filteredCards(drawer.cards));
  emptyState.style.display = sorted.length === 0 ? 'block' : 'none';

  cardContainer.className = state.viewMode === 'grid' ? 'card-grid' : 'card-stack';

  sorted.forEach((card) => {
    const cardEl = document.createElement('article');
    cardEl.className = 'card';
    cardEl.innerHTML = `
      <div class="card-header">${card.title || 'Untitled Card'}</div>
      <div class="card-meta">${card.callNumber || 'Call Number TBD'} • ${card.year || 'Year TBD'}</div>
      <div class="card-body">
        <div><strong>Author:</strong> ${card.author || '—'}</div>
        <div><strong>Subjects:</strong> ${card.subjects || '—'}</div>
        <div><strong>Notes:</strong> ${card.notes || '—'}</div>
      </div>
      <div class="card-actions">
        ${card.filePath ? '<button class="secondary" data-open="file">Open File</button>' : ''}
      </div>
    `;

    if (card.filePath) {
      cardEl.querySelector('[data-open="file"]').addEventListener('click', () => {
        window.catalog.openFile(card.filePath);
      });
    }

    cardContainer.appendChild(cardEl);
  });
};

const renderHeader = () => {
  const drawer = activeDrawer();
  if (!drawer) {
    drawerTitle.textContent = 'Select a Drawer';
    drawerSubtitle.textContent = 'Create or select a drawer to begin cataloging.';
    return;
  }

  drawerTitle.textContent = drawer.name;
  drawerSubtitle.textContent = `${drawer.cards.length} catalog cards in this drawer.`;
};

const render = () => {
  renderDrawers();
  renderHeader();
  renderCards();
};

const createDrawer = (name) => {
  pushHistory();
  const id = `drawer-${Date.now()}`;
  state.data.drawers.push({ id, name, cards: [] });
  state.activeDrawerId = id;
  persist();
  render();
};

const createCard = (payload) => {
  const drawer = state.data.drawers.find((item) => item.id === payload.drawerId);
  if (!drawer) return;
  pushHistory();
  drawer.cards.push({
    id: `card-${Date.now()}`,
    title: payload.title,
    author: payload.author,
    callNumber: payload.callNumber,
    subjects: payload.subjects,
    year: payload.year,
    notes: payload.notes,
    filePath: payload.filePath || ''
  });
  persist();
  render();
};

const initialize = async () => {
  state.data = await window.catalog.loadData();
  state.activeDrawerId = state.data.drawers[0]?.id || null;
  render();
};

newCardButton.addEventListener('click', () => {
  if (!state.data.drawers.length) {
    openDrawerModal();
    return;
  }
  openModal();
});

newDrawerButton.addEventListener('click', openDrawerModal);
closeModal.addEventListener('click', closeCardModal);
cancelModal.addEventListener('click', closeCardModal);
closeDrawerModal.addEventListener('click', closeDrawerModalView);
cancelDrawerModal.addEventListener('click', closeDrawerModalView);

toggleViewButton.addEventListener('click', () => {
  setViewMode(state.viewMode === 'grid' ? 'stack' : 'grid');
});

searchInput.addEventListener('input', renderCards);
sortSelect.addEventListener('change', renderCards);

cardForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(cardForm);
  const file = cardForm.querySelector('input[name="file"]').files[0];
  createCard({
    title: formData.get('title').trim(),
    author: formData.get('author').trim(),
    callNumber: formData.get('callNumber').trim(),
    subjects: formData.get('subjects').trim(),
    year: formData.get('year').trim(),
    notes: formData.get('notes').trim(),
    drawerId: formData.get('drawer'),
    filePath: file ? file.path : ''
  });
  closeCardModal();
});

drawerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(drawerForm);
  createDrawer(formData.get('drawerName').trim());
  closeDrawerModalView();
});

window.addEventListener('keydown', (event) => {
  const isModifier = event.metaKey || event.ctrlKey;
  if (!isModifier) return;

  if (event.key.toLowerCase() === 'n') {
    event.preventDefault();
    newCardButton.click();
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key.toLowerCase() === 'k') {
    event.preventDefault();
    toggleViewButton.click();
  }

  if (event.key.toLowerCase() === 'z' && event.shiftKey) {
    event.preventDefault();
    redo();
    return;
  }

  if (event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }
});

initialize();
