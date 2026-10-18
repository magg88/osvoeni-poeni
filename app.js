// Листа на вработени според таблата
const EMPLOYEES = [
    "Марио", "Александар", "Оливера", "Дуле", "Сабрина", "Натали", 
    "Роме", "Филип", "Дритон", "Горан", "Кристијан", "Даниела", 
    "Магдалена", "Тони", "Младен", "Никола", "Марјан", "Марко"
];

// Категории за доделување поени
const CATEGORIES = {
    plus: [
        "🔥 Брзина (Брза изработка во гужва)",
        "🧼 Одржување на хигиена (Чиста станица)",
        "🤝 Тимски дух и помош на колега",
        "💡 Идеја и организација во кујната",
        "⏰ Точност и покривање работни саати",
        "🗳️ Колегијален глас на месецот"
    ],
    minus: [
        "🚬 Непланирани / долги паузи",
        "⏰ Задоцнување на смена",
        "🗣️ Неколегијалност / нарушување атмосфера",
        "🧹 Несредена работна станица"
    ]
};

// Локална состојба на апликацијата
let state = {
    currentUser: null,
    role: 'employee',
    selectedEmployeeForPoint: null,
    currentPointType: 'plus',
    records: JSON.parse(localStorage.getItem('kujna_records')) || {},
    activities: JSON.parse(localStorage.getItem('kujna_activities')) || [],
    ideas: JSON.parse(localStorage.getItem('kujna_ideas')) || []
};

// Иницијализација веднаш при вчитување на DOM
document.addEventListener('DOMContentLoaded', function() {
    initUserDropdowns();
});

// Пополнување на dropdown менија со сите вработени
function initUserDropdowns() {
    const userSelect = document.getElementById('username-select');
    const voteSelect = document.getElementById('vote-candidate-select');
    
    if (userSelect) {
        userSelect.innerHTML = '<option value="">-- Избери вработен --</option>';
        EMPLOYEES.forEach(emp => {
            let opt = document.createElement('option');
            opt.value = emp;
            opt.textContent = emp;
            userSelect.appendChild(opt);
        });
    }

    if (voteSelect) {
        voteSelect.innerHTML = '<option value="">-- Избери колега --</option>';
        EMPLOYEES.forEach(emp => {
            let opt = document.createElement('option');
            opt.value = emp;
            opt.textContent = emp;
            voteSelect.appendChild(opt);
        });
    }
}

// Најава со ПИН за одговорниот
function login() {
    const name = document.getElementById('username-select').value;
    const role = document.getElementById('user-role').value;

    if (!name) return alert('Избери го твоето име од листата!');

    // Заштита: Барај ПИН за шефот
    if (role === 'admin') {
        const password = prompt('Внеси ја тајната лозинка за одговорниот:');
        if (password !== 'deniro1234') {
            return alert('Грешна лозинка! Не можеш да се најавиш како одговорен.');
        }
    }

    state.currentUser = name;
    state.role = role;

    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = `${name} (${role === 'admin' ? 'Шеф' : 'Вработен'})`;

    renderLeaderboard();
    renderActivities();
    renderIdeas();
    updateUserStats();
}

function logout() {
    location.reload();
}

// Пресметка на поени за даден вработен според правилата (3 дела = 1 поен, макс 2 од шеф + 1 од колегијален)
function calculateEmployeePoints(empData) {
    const actions = empData.goodActions || 0;
    let profPoints = Math.floor(actions / 3);
    if (profPoints > 2) profPoints = 2;

    const kolegijalen = empData.kolegijalenPoints || 0;
    const minus = empData.minus || 0;

    const positiveTotal = profPoints + kolegijalen;
    const netTotal = positiveTotal - minus;

    return {
        profPoints,
        kolegijalen,
        positiveTotal,
        minus,
        netTotal,
        goodActions: actions,
        actionsProgress: actions % 3
    };
}

// Рендерирање на Ранг-Листата
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const isAdmin = state.role === 'admin';
    
    const resetBtn = document.getElementById('reset-btn');
    const actionHeader = document.getElementById('action-header');

    if (isAdmin) {
        if (resetBtn) resetBtn.classList.remove('hidden');
        if (actionHeader) actionHeader.classList.remove('hidden');
    } else {
        if (resetBtn) resetBtn.classList.add('hidden');
        if (actionHeader) actionHeader.classList.add('hidden');
    }

    EMPLOYEES.forEach((emp, index) => {
        const empData = state.records[emp] || { goodActions: 0, kolegijalenPoints: 0, minus: 0, oct: 0, nov: 0, dec: 0 };
        const stats = calculateEmployeePoints(empData);
        const total = stats.netTotal;

        let tr = document.createElement('tr');
        
        let actionCol = '';
        if (isAdmin) {
            actionCol = `
                <td class="admin-only">
                    <button class="badge-btn plus" onclick="openPointModal('${emp}', 'plus')">+1 Дело</button>
                    <button class="badge-btn minus" onclick="openPointModal('${emp}', 'minus')">-1 Поен</button>
                </td>
            `;
        }

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${emp}</strong> <br><small style="color: #94a3b8;">(Дела: ${stats.goodActions}/6)</small></td>
            <td>${total}</td>
            <td>0</td>
            <td>0</td>
            <td><strong>${total}</strong></td>
            ${actionCol}
        `;
        tbody.appendChild(tr);
    });
}

// Статистика за најавениот корисник
function updateUserStats() {
    if (!state.currentUser) return;
    const empData = state.records[state.currentUser] || { goodActions: 0, kolegijalenPoints: 0, minus: 0 };
    const stats = calculateEmployeePoints(empData);

    document.getElementById('my-plus').innerText = `${stats.positiveTotal} (${stats.goodActions} дела)`;
    document.getElementById('my-minus').innerText = stats.minus;
    document.getElementById('my-total').innerText = stats.netTotal;
}

// Модали за Доделување Поени (Админ)
function openPointModal(employee, type) {
    state.selectedEmployeeForPoint = employee;
    setPointType(type);
    document.getElementById('modal-title').innerText = `Запиши за: ${employee}`;
    document.getElementById('point-modal').classList.remove('hidden');
}

function closePointModal() {
    document.getElementById('point-modal').classList.add('hidden');
}

function setPointType(type) {
    state.currentPointType = type;
    const catSelect = document.getElementById('category-select');
    catSelect.innerHTML = '';

    CATEGORIES[type].forEach(cat => {
        let opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    });

    document.getElementById('btn-type-plus').className = `btn-type ${type === 'plus' ? 'active-plus' : ''}`;
    document.getElementById('btn-type-minus').className = `btn-type ${type === 'minus' ? 'active-minus' : ''}`;
}

// Снимање на Поен / Дело
function submitPoint() {
    const emp = state.selectedEmployeeForPoint;
    const category = document.getElementById('category-select').value;
    const note = document.getElementById('point-note').value;
    const type = state.currentPointType;

    if (!state.records[emp]) {
        state.records[emp] = { goodActions: 0, kolegijalenPoints: 0, minus: 0, oct: 0, nov: 0, dec: 0 };
    }

    let alertMsg = '';

    if (type === 'plus') {
        if (category.includes("Колегијален глас")) {
            if (state.records[emp].kolegijalenPoints >= 1) {
                alert('Вработениот веќе има добиено колегијален глас за овој месец!');
                return;
            }
            state.records[emp].kolegijalenPoints = 1;
            alertMsg = `Доделен колегијален глас за ${emp}!`;
        } else {
            if (state.records[emp].goodActions >= 6) {
                alert('Вработениот веќе го достигна максимумот од 6 позитивни дела (2 поени од шефот) за овој месец!');
                return;
            }
            state.records[emp].goodActions += 1;
            const newActions = state.records[emp].goodActions;
            
            if (newActions % 3 === 0) {
                alertMsg = `👏 Браво! ${emp} собра 3 добри дела и освои +1 Поен во табелата!`;
                if (typeof confetti === 'function') {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            } else {
                alertMsg = `Регистрирано позитивно дело за ${emp} (${newActions % 3}/3 до следниот поен).`;
            }
        }
    } else {
        state.records[emp].minus += 1;
        alertMsg = `Запишан негативен поен (-1) за ${emp}.`;
    }

    const currentStats = calculateEmployeePoints(state.records[emp]);
    state.records[emp].oct = currentStats.netTotal;

    const activityText = `${type === 'plus' ? '✓' : 'X'} ${emp} - [${category}] ${note ? '- ' + note : ''}`;
    state.activities.unshift(activityText);

    localStorage.setItem('kujna_records', JSON.stringify(state.records));
    localStorage.setItem('kujna_activities', JSON.stringify(state.activities));

    renderLeaderboard();
    renderActivities();
    updateUserStats();
    closePointModal();

    if (alertMsg) alert(alertMsg);
}

function renderActivities() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    list.innerHTML = '';
    state.activities.slice(0, 10).forEach(act => {
        let li = document.createElement('li');
        li.innerText = act;
        list.appendChild(li);
    });
}

// Анонимни Идеи и Предлози
// Прикажување/криење на полето за име според изборот
function toggleAuthorNameInput() {
    const authorType = document.getElementById('idea-author-type').value;
    const authorNameGroup = document.getElementById('author-name-group');
    if (authorType === 'public') {
        authorNameGroup.classList.remove('hidden');
        if (state.currentUser) {
            document.getElementById('idea-author-name').value = state.currentUser;
        }
    } else {
        authorNameGroup.classList.add('hidden');
    }
}

// Испраќање на идеја / пофалба / поплака
function submitIdea() {
    const type = document.getElementById('idea-type').value;
    const category = document.getElementById('idea-category').value;
    const authorType = document.getElementById('idea-author-type').value;
    const text = document.getElementById('idea-text').value.trim();

    if (!text) {
        return alert('Ве молиме внесете ја вашата порака пред да ја испратите!');
    }

    let authorName = "🕵️ Анонимно";
    if (authorType === 'public') {
        const inputName = document.getElementById('idea-author-name').value.trim();
        if (inputName) {
            authorName = `👤 ${inputName}`;
        } else if (state.currentUser) {
            authorName = `👤 ${state.currentUser}`;
        } else {
            authorName = "👤 Вработен";
        }
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const newIdea = {
        type: type,
        category: category,
        author: authorName,
        text: text,
        date: dateStr
    };

    state.ideas.unshift(newIdea);
    localStorage.setItem('kujna_ideas', JSON.stringify(state.ideas));

    document.getElementById('idea-text').value = '';
    alert('Вашата порака е успешно испратена!');

    renderIdeas();
}

function renderIdeas() {
    const list = document.getElementById('ideas-list');
    if (!list) return;
    list.innerHTML = '';

    if (state.ideas.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Сè уште нема споделено пораки.</p>';
        return;
    }

    state.ideas.slice(0, 10).forEach(idea => {
        const item = document.createElement('div');
        item.className = 'idea-item';
        
        const typeText = idea.type || '💡 Идеја / Предлог';
        const authorText = idea.author || '🕵️ Анонимно';

        item.innerHTML = `
            <div class="idea-header">
                <span>${typeText} • ${idea.category}</span>
                <span>${idea.date}</span>
            </div>
            <div class="idea-body">${idea.text}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; text-align: right; font-weight: 600;">
                Од: ${authorText}
            </div>
        `;
        list.appendChild(item);
    });
}
// Колегијално гласање
function openVoteModal() { document.getElementById('vote-modal').classList.remove('hidden'); }
function closeVoteModal() { document.getElementById('vote-modal').classList.add('hidden'); }

function submitKolegijalenGlas() {
    const candidate = document.getElementById('vote-candidate-select').value;
    if (!candidate) return alert('Избери колега!');
    if (candidate === state.currentUser) return alert('Не можеш да гласаш за самиот себе!');

    if (!state.records[candidate]) {
        state.records[candidate] = { goodActions: 0, kolegijalenPoints: 0, minus: 0, oct: 0, nov: 0, dec: 0 };
    }

    if (state.records[candidate].kolegijalenPoints >= 1) {
        return alert(`${candidate} веќе има добиено колегијален поен за овој месец!`);
    }

    state.selectedEmployeeForPoint = candidate;
    state.currentPointType = 'plus';

    const kolegijalenCategory = CATEGORIES.plus.find(c => c.includes("Колегијален глас")) || CATEGORIES.plus[5];
    
    const catSelect = document.getElementById('category-select');
    if (catSelect) {
        catSelect.innerHTML = '';
        let opt = document.createElement('option');
        opt.value = kolegijalenCategory;
        opt.textContent = kolegijalenCategory;
        catSelect.appendChild(opt);
    }
    
    document.getElementById('point-note').value = `Гласано од ${state.currentUser}`;
    
    submitPoint();
    closeVoteModal();
}

// Отворање/Затворање на правилата за вработените
function toggleRules() {
    const rulesContent = document.getElementById('rules-content');
    const arrow = document.getElementById('rules-arrow');
    
    if (rulesContent.classList.contains('hidden')) {
        rulesContent.classList.remove('hidden');
        arrow.innerText = '▲';
    } else {
        rulesContent.classList.add('hidden');
        arrow.innerText = '▼';
    }
}

// Целосно ресетирање на сите поени, активности и предлози (за одговорниот)
function resetAllData() {
    const confirmReset = confirm("Дали си сигурен дека сакаш да ги ресетираш сите поени, активности и анонимни предлози на нула?");
    if (confirmReset) {
        localStorage.removeItem('kujna_records');
        localStorage.removeItem('kujna_activities');
        localStorage.removeItem('kujna_ideas');
        
        state.records = {};
        state.activities = [];
        state.ideas = [];
        
        renderLeaderboard();
        renderActivities();
        renderIdeas();
        updateUserStats();
        
        alert("Сите поени, активности и анонимни предлози се успешно ресетирани!");
    }
}