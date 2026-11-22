import { CATALOG, NUMBER_COLORS } from './shop-catalog.js';
import { initShop3D } from './shop-3d.js';

if (localStorage.getItem('player_coins') === null) {
    localStorage.setItem('player_coins', '500');
}

const defaultOwned = ['j1', 's1', 'b1', 'g1', 'ball1'];
let ownedItems = JSON.parse(localStorage.getItem('owned_items') || 'null') || defaultOwned;

const state = {
    coins: parseInt(localStorage.getItem('player_coins'), 10),
    jerseys: localStorage.getItem('eq_jerseys') || 'j1',
    shorts: localStorage.getItem('eq_shorts') || 's1',
    boots: localStorage.getItem('eq_boots') || 'b1',
    gloves: localStorage.getItem('eq_gloves') || 'g1',
    balls: localStorage.getItem('eq_balls') || 'ball1',
    number: localStorage.getItem('eq_number') || '10',
    numColor: localStorage.getItem('eq_numColor') || '#ffffff',
    activeTab: 'jerseys',
    preview: {
        jerseys: localStorage.getItem('eq_jerseys') || 'j1',
        shorts: localStorage.getItem('eq_shorts') || 's1',
        boots: localStorage.getItem('eq_boots') || 'b1',
        gloves: localStorage.getItem('eq_gloves') || 'g1',
        balls: localStorage.getItem('eq_balls') || 'ball1'
    }
};

const shop3D = initShop3D(state);

function updateCoinsUI() {
    document.getElementById('coins-display').innerText = `💰 ${state.coins}`;
}
updateCoinsUI();

function showToast(text, isSuccess = false) {
    const toast = document.getElementById('toast');
    toast.innerText = text;
    toast.style.background = isSuccess ? '#16a34a' : '#ef4444';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
}

function updateTopPreviewPanel(tabName, item) {
    const titleEl = document.getElementById('preview-title');
    const actionBtn = document.getElementById('preview-action-btn');

    titleEl.innerText = item.name;

    const isEquipped = state[tabName] === item.id;
    const isOwned = ownedItems.includes(item.id);

    if (isEquipped) {
        actionBtn.innerText = 'Одягнено ✓';
        actionBtn.className = 'action-btn equipped';
        actionBtn.onclick = null;
    } else if (isOwned) {
        actionBtn.innerText = 'Одягнути 👕';
        actionBtn.className = 'action-btn equip';
        actionBtn.onclick = () => {
            state[tabName] = item.id;
            localStorage.setItem(`eq_${tabName}`, item.id);
            showToast(`Одягнено: ${item.name}`, true);
            renderTab(tabName);
        };
    } else {
        const canAfford = state.coins >= item.price;
        actionBtn.innerText = `Купити за 💰 ${item.price}`;
        actionBtn.className = `action-btn ${canAfford ? 'buy' : 'no-coins'}`;
        actionBtn.onclick = () => {
            if (state.coins < item.price) {
                showToast(`Не вистачає ${item.price - state.coins} монет! Зіграй матч ⚽`);
                return;
            }
            state.coins -= item.price;
            localStorage.setItem('player_coins', String(state.coins));
            updateCoinsUI();

            ownedItems.push(item.id);
            localStorage.setItem('owned_items', JSON.stringify(ownedItems));

            state[tabName] = item.id;
            localStorage.setItem(`eq_${tabName}`, item.id);

            showToast(`Куплено та одягнено: ${item.name}!`, true);
            renderTab(tabName);
        };
    }
}
function renderTab(tabName) {
    state.activeTab = tabName;
    const scrollContainer = document.getElementById('items-scroll');

    ['jerseys', 'shorts', 'boots', 'gloves', 'balls'].forEach(cat => {
        if (cat !== tabName) state.preview[cat] = state[cat];
    });

    if (tabName === 'number') {
        shop3D.faceBack();
        document.getElementById('preview-title').innerText = `Номер на спині: #${state.number}`;
        const actionBtn = document.getElementById('preview-action-btn');
        actionBtn.innerText = 'Збережено ✓';
        actionBtn.className = 'action-btn equipped';
        actionBtn.onclick = null;

        scrollContainer.innerHTML = `<div class="number-panel">
            <h4>Колір номера на спині:</h4>
            <div class="num-colors">
                ${NUMBER_COLORS.map(c => `<div class="num-color-dot" style="background:${c}; outline:${state.numColor === c ? '3px solid #22c55e' : 'none'}" data-ncol="${c}"></div>`).join('')}
            </div>
            <h4>Обери номер (1 – 99):</h4>
            <div class="num-grid">
                ${Array.from({ length: 99 }, (_, i) => i + 1).map(n => `
                    <button class="num-cell ${String(n) === state.number ? 'selected' : ''}" data-num="${n}">${n}</button>
                `).join('')}
            </div>
        </div>`;

        scrollContainer.querySelectorAll('.num-color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                state.numColor = dot.dataset.ncol;
                localStorage.setItem('eq_numColor', state.numColor);
                shop3D.updateAppearance();
                renderTab('number');
            });
        });

        scrollContainer.querySelectorAll('.num-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                state.number = cell.dataset.num;
                localStorage.setItem('eq_number', state.number);
                shop3D.updateAppearance();
                renderTab('number');
            });
        });

        shop3D.updateAppearance();
        return;
    }

    const list = CATALOG[tabName];
    const previewId = state.preview[tabName];
    const activeItem = list.find(x => x.id === previewId) || list.at(0);
    updateTopPreviewPanel(tabName, activeItem);

    const icons = { jerseys: '👕', shorts: '🩳', boots: '👟', gloves: '🧤', balls: '⚽' };

    scrollContainer.innerHTML = `<div class="items-grid">
        ${list.map(item => {
            const isEquipped = state[tabName] === item.id;
            const isOwned = ownedItems.includes(item.id);
            const isInspecting = previewId === item.id && !isEquipped;
            const bgStyle = item.css ? item.css : `linear-gradient(135deg, ${item.c1} 55%, ${item.c2} 55%)`;

            let btnClass = 'buy-btn';
            let btnText = `💰 ${item.price}`;
            if (isEquipped) {
                btnClass = 'equipped-btn';
                btnText = '✓ Одягнено';
            } else if (isOwned) {
                btnClass = 'owned-btn';
                btnText = '👕 Одягти';
            }

            return `
                <div class="card ${isEquipped ? 'equipped' : ''} ${isInspecting ? 'inspecting' : ''}" data-id="${item.id}">
                    <div class="card-icon" style="background: ${bgStyle};">${icons[tabName]}</div>
                    <div class="card-title">${item.name}</div>
                    <div class="card-desc">${item.desc}</div>
                    <button class="card-btn ${btnClass}">${btnText}</button>
                </div>
            `;
        }).join('')}
    </div>`;

    scrollContainer.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            if (ownedItems.includes(id)) {
                state[tabName] = id;
                state.preview[tabName] = id;
                localStorage.setItem(`eq_${tabName}`, id);
            } else {
                state.preview[tabName] = id;
            }
            shop3D.updateAppearance();
            renderTab(tabName);
        });
    });

    shop3D.updateAppearance();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        state.preview[tab] = state[tab];
        renderTab(tab);
    });
});

renderTab('jerseys');

// Примусове вирівнювання кнопок праворуч без очікування кешу CSS
(function fixLayout() {
    document.body.style.width = '100vw';
    document.body.style.overflowX = 'hidden';
    const card = document.querySelector('.preview-card');
    if (card) {
        card.style.display = 'flex';
        card.style.width = '100%';
        card.style.gap = '8px';
        card.style.padding = '8px 10px';
        card.style.overflow = 'hidden';
    }
    const vBox = document.querySelector('.viewport-box');
    if (vBox) {
        vBox.style.width = '145px';
        vBox.style.flexShrink = '0';
    }
    const rCtrl = document.querySelector('.right-controls');
    if (rCtrl) {
        rCtrl.style.flex = '1';
        rCtrl.style.minWidth = '0';
        rCtrl.style.overflow = 'hidden';
    }
    const tGrid = document.querySelector('.tabs-grid');
    if (tGrid) {
        tGrid.style.display = 'grid';
        tGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        tGrid.style.gap = '5px';
    }
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.fontSize = '0.72rem';
        btn.style.padding = '4px 2px';
        btn.style.minWidth = '0';
        btn.style.overflow = 'hidden';
        btn.style.textOverflow = 'ellipsis';
    });
})();
