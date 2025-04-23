let currentCandidate = null;
let candidatesViewed = 150;
let offersSent = 20;
let offersAccepted = 10;
let companyMessagesSent = 0;

// Функция для поиска кандидатов
function companySearchCandidates() {
    const query = document.getElementById("company-search-input").value.toLowerCase();
    const candidates = document.querySelectorAll(".candidates-list .candidate-card");
    candidates.forEach(candidate => {
        const name = candidate.querySelector("h3").textContent.toLowerCase();
        candidate.style.display = name.includes(query) ? "flex" : "none";
    });
}

// Фильтрация кандидатов
function companyFilterCandidates(filterType, value) {
    const candidates = document.querySelectorAll(".candidates-list .candidate-card");
    const filters = document.querySelectorAll(".filter-chip");

    filters.forEach(filter => {
        if (filter.textContent === value) {
            filter.classList.toggle("active");
        }
    });

    const activeFilters = {};
    filters.forEach(filter => {
        if (filter.classList.contains("active")) {
            const type = filter.getAttribute("onclick").match(/'([^']+)'/g)[0].replace(/'/g, "");
            const val = filter.textContent;
            if (!activeFilters[type]) activeFilters[type] = [];
            activeFilters[type].push(val);
        }
    });

    candidates.forEach(candidate => {
        let show = true;
        for (const [type, values] of Object.entries(activeFilters)) {
            const candidateValue = candidate.getAttribute(`data-${type}`);
            if (!values.includes(candidateValue)) {
                show = false;
                break;
            }
        }
        candidate.style.display = show ? "flex" : "none";
    });
}

// Открытие портфолио кандидата
function openCandidatePortfolio(candidateName) {
    currentCandidate = candidateName;
    switchScreen("candidate-portfolio-screen");
    const candidateCard = document.querySelector(`.candidate-card[onclick="openCandidatePortfolio('${candidateName}')"]`);
    document.getElementById("candidate-name").textContent = candidateName;
    document.getElementById("candidate-skills").textContent = candidateCard.getAttribute("data-skills");
    document.getElementById("candidate-experience").textContent = candidateCard.getAttribute("data-experience");

    const reviews = JSON.parse(localStorage.getItem(`candidate-reviews-${candidateName}`)) || [];
    const reviewsContainer = document.getElementById("candidate-reviews");
    reviewsContainer.innerHTML = reviews.length > 0 ? reviews.map(review => `
        <div class="review-item">
            <p>${review.text}</p>
            <span class="rating">${review.rating}</span>
        </div>
    `).join("") : `<p data-lang="no-reviews">${translations[document.documentElement.lang].no_reviews || "Нет отзывов"}</p>`;

    candidatesViewed++;
    updateAnalytics();
}

// Отправка оффера
function companySendOffer() {
    offersSent++;
    updateAnalytics();
    alert(`Оффер отправлен кандидату ${currentCandidate}!`);
    companyStartChat(); // Автоматически открываем чат после отправки оффера
}

// Начало чата с кандидатом
function companyStartChat() {
    companyOpenChat(currentCandidate);
}

// Открытие чата с кандидатом
function companyOpenChat(candidateName) {
    currentCandidate = candidateName;
    switchScreen("company-chat-screen");
    document.getElementById("company-chat-with").textContent = candidateName;
    loadCompanyChatMessages();
}

// Загрузка сообщений чата компании
function loadCompanyChatMessages() {
    const messages = JSON.parse(localStorage.getItem(`company-chat-${currentCandidate}`)) || [];
    const chatMessages = document.getElementById("company-chat-messages");
    chatMessages.innerHTML = messages.length > 0 ? messages.map(msg => `
        <div class="message ${msg.sender === "company" ? "sent" : ""}">
            <p>${msg.text}</p>
        </div>
    `).join("") : `<p data-lang="no-messages">${translations[document.documentElement.lang].no_messages || "Нет сообщений"}</p>`;
}

// Отправка сообщения от компании
function companySendMessage() {
    const message = document.getElementById("company-chat-input").value;
    if (message) {
        const messages = JSON.parse(localStorage.getItem(`company-chat-${currentCandidate}`)) || [];
        messages.push({ sender: "company", text: message });
        localStorage.setItem(`company-chat-${currentCandidate}`, JSON.stringify(messages));
        companyMessagesSent++;
        updateAnalytics();
        loadCompanyChatMessages();
        document.getElementById("company-chat-input").value = "";
    }
}

// Обновление аналитики
function updateAnalytics() {
    document.getElementById("analytics-candidates-viewed").textContent = candidatesViewed;
    document.getElementById("analytics-offers-sent").textContent = offersSent;
    document.getElementById("analytics-offers-accepted").textContent = offersAccepted;
}

// Инициализация данных компании
function loadCompanyData() {
    updateAnalytics();
}