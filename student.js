let currentContest = null;
let registeredEvents = [];
let studentLevel = "Новичок";
let studentPoints = 0;
let studentEventsThisMonth = 0;
let studentReviewsWritten = 0;
let studentMessagesSent = 0;
let pushNotificationsEnabled = false;
let friendsList = [];
let friendRequests = [];
let groupsList = [];
let currentGroupChat = null;
let offlineEvents = [];

// ИИ-рекомендации (на основе интересов и активности)
function getAIRecommendations() {
    const interests = ["Экономика", "Аналитика"];
    const events = document.querySelectorAll("#all-events .event-card");
    const recommendedEvents = Array.from(events).filter(event => {
        const eventFormat = event.getAttribute("data-format");
        const eventSkills = event.getAttribute("data-skills");
        return interests.includes(eventFormat) || interests.includes(eventSkills);
    });
    const recommendedContainer = document.getElementById("ai-recommended-events");
    recommendedContainer.innerHTML = recommendedEvents.length > 0 ? recommendedEvents.map(event => event.outerHTML).join("") : `<p data-lang="no-recommendations">${translations[document.documentElement.lang].no_recommendations || "Нет рекомендаций"}</p>`;
}

// Рекомендации (на основе региона и популярности)
function getRecommendedEvents() {
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const region = userData.region || "Торжок";
    const events = document.querySelectorAll("#all-events .event-card");
    const recommendedEvents = Array.from(events).filter(event => {
        const eventLocation = event.querySelector("p").textContent.split("|")[2].trim();
        const popularity = parseInt(event.getAttribute("data-popularity"));
        return eventLocation.includes(region) && popularity > 50;
    });
    const recommendedContainer = document.getElementById("recommended-events");
    recommendedContainer.innerHTML = recommendedEvents.length > 0 ? recommendedEvents.map(event => event.outerHTML).join("") : `<p data-lang="no-recommendations">${translations[document.documentElement.lang].no_recommendations || "Нет рекомендаций"}</p>`;
}

// Функция для регистрации пользователя
function register(role) {
    const name = document.getElementById("name-input").value;
    const age = document.getElementById("age-input").value;
    const region = document.getElementById("region-input").value;

    if (name && age && region) {
        const userData = { role, name, age, region, status: role === "student" ? "Школьник" : "Компания" };
        localStorage.setItem("userData", JSON.stringify(userData));
        loadUserData();
    } else {
        alert("Пожалуйста, заполните все поля!");
    }
}

// Функция для сброса данных
function resetUserData() {
    localStorage.removeItem("userData");
    registeredEvents = [];
    studentPoints = 0;
    studentEventsThisMonth = 0;
    studentReviewsWritten = 0;
    studentMessagesSent = 0;
    pushNotificationsEnabled = false;
    friendsList = [];
    friendRequests = [];
    groupsList = [];
    offlineEvents = [];
    switchScreen("auth-screen");
    document.getElementById("student-nav").style.display = "none";
    document.getElementById("company-nav").style.display = "none";
}

// Переключение экранов
function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
    document.querySelectorAll(".bottom-nav span").forEach(span => span.classList.remove("active"));
    document.querySelector(`.bottom-nav span[onclick="switchScreen('${screenId}')"]`).classList.add("active");

    if (screenId === "student-map-screen") {
        setTimeout(loadEventsMap, 100);
    } else if (screenId === "student-calendar-screen") {
        loadCalendar();
    } else if (screenId === "student-achievements-screen") {
        updateAchievements();
    } else if (screenId === "student-notifications-screen") {
        loadNotifications();
    } else if (screenId === "student-chat-screen") {
        loadChatMessages();
    } else if (screenId === "student-stats-screen") {
        updateStats();
    } else if (screenId === "student-friends-screen") {
        loadFriends();
    } else if (screenId === "student-groups-screen") {
        loadGroups();
    } else if (screenId === "student-offline-screen") {
        loadOfflineEvents();
    }
}

// Функция для поиска мероприятий
function studentSearchEvents() {
    const query = document.getElementById("student-search-input").value.toLowerCase();
    const events = document.querySelectorAll("#all-events .event-card");
    events.forEach(event => {
        const title = event.querySelector("h3").textContent.toLowerCase();
        const description = event.querySelector(".event-description").textContent.toLowerCase();
        event.style.display = (title.includes(query) || description.includes(query)) ? "flex" : "none";
    });
}

// Фильтрация мероприятий
function studentFilterEvents(filterType, value) {
    const events = document.querySelectorAll("#all-events .event-card");
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

    events.forEach(event => {
        let show = true;
        for (const [type, values] of Object.entries(activeFilters)) {
            const eventValue = event.getAttribute(`data-${type}`);
            if (!values.includes(eventValue)) {
                show = false;
                break;
            }
        }
        event.style.display = show ? "flex" : "none";
    });
}

// Сортировка мероприятий
function studentSortEvents() {
    const sortBy = document.getElementById("sort-events").value;
    const eventsContainer = document.getElementById("all-events");
    const events = Array.from(eventsContainer.querySelectorAll(".event-card"));

    events.sort((a, b) => {
        if (sortBy === "date") {
            return new Date(a.getAttribute("data-date")) - new Date(b.getAttribute("data-date"));
        } else if (sortBy === "rating") {
            return parseFloat(b.getAttribute("data-rating")) - parseFloat(a.getAttribute("data-rating"));
        } else if (sortBy === "popularity") {
            return parseInt(b.getAttribute("data-popularity")) - parseInt(a.getAttribute("data-popularity"));
        }
        return 0;
    });

    eventsContainer.innerHTML = "";
    events.forEach(event => eventsContainer.appendChild(event));
}

// Лайк мероприятия
function studentToggleLike(likeButton, event) {
    event.stopPropagation();
    likeButton.classList.toggle("liked");
    likeButton.style.color = likeButton.classList.contains("liked") ? "#EF4444" : "#D1D5DB";
}

// Открытие деталей конкурса
function openContest(contestName) {
    currentContest = contestName;
    switchScreen("contest-details-screen");
    const eventCard = document.querySelector(`.event-card[onclick="openContest('${contestName}')"]`);
    document.getElementById("contest-title").textContent = contestName;
    document.getElementById("contest-format").textContent = eventCard.getAttribute("data-format");
    document.getElementById("contest-audience").textContent = eventCard.getAttribute("data-audience");
    document.getElementById("contest-skills").textContent = eventCard.getAttribute("data-skills");
    document.getElementById("contest-date").textContent = eventCard.getAttribute("data-date");
    document.getElementById("contest-difficulty").textContent = eventCard.getAttribute("data-difficulty");

    const reviews = JSON.parse(localStorage.getItem(`reviews-${contestName}`)) || [];
    const reviewsContainer = document.getElementById("contest-reviews");
    reviewsContainer.innerHTML = reviews.length > 0 ? reviews.map(review => `
        <div class="review-item">
            <p>${review.text}</p>
            <span class="rating">${review.rating}</span>
        </div>
    `).join("") : `<p data-lang="no-reviews">${translations[document.documentElement.lang].no_reviews || "Нет отзывов"}</p>`;
}

// Регистрация на конкурс
function studentRegisterForContest() {
    if (!registeredEvents.includes(currentContest)) {
        registeredEvents.push(currentContest);
        studentEventsThisMonth++;
        studentPoints += 10;
        updateAchievements();
        updateStats();
        alert(`Вы зарегистрированы на ${currentContest}!`);
        addNotification(`Вы зарегистрированы на ${currentContest}`);
        if (pushNotificationsEnabled) {
            addNotification(`Напоминание: ${currentContest} скоро начнётся!`);
        }
    } else {
        alert("Вы уже зарегистрированы на это мероприятие!");
    }
}

// Поделиться конкурсом
function studentShareContest() {
    const shareText = `Присоединяйтесь к ${currentContest}! Подробности на всеконкурсы.РФ`;
    if (navigator.share) {
        navigator.share({
            title: currentContest,
            text: shareText,
            url: window.location.href
        });
    } else {
        alert(`Поделитесь: ${shareText}`);
    }
}

// Экспорт в календарь
function studentExportToCalendar() {
    const eventCard = document.querySelector(`.event-card[onclick="openContest('${currentContest}')"]`);
    const eventDate = eventCard.getAttribute("data-date");
    const eventTitle = currentContest;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${eventDate.replace(/-/g, "")}/${eventDate.replace(/-/g, "")}&details=Мероприятие+от+всеконкурсы.РФ`;
    window.open(calendarUrl, "_blank");
}

// Включение/выключение push-уведомлений
function studentTogglePushNotifications() {
    pushNotificationsEnabled = document.getElementById("push-notifications").checked;
    if (pushNotificationsEnabled) {
        addNotification("Push-уведомления включены!");
    }
}

// Оценка мероприятия
function studentRateEvent() {
    const rating = document.getElementById("event-rating").value;
    const eventCard = document.querySelector(`.event-card[onclick="openContest('${currentContest}')"]`);
    let currentRating = parseFloat(eventCard.getAttribute("data-rating"));
    let ratingCount = parseInt(eventCard.getAttribute("data-rating-count") || "0") + 1;
    currentRating = (currentRating * (ratingCount - 1) + parseInt(rating)) / ratingCount;
    eventCard.setAttribute("data-rating", currentRating.toFixed(1));
    eventCard.setAttribute("data-rating-count", ratingCount);
    eventCard.querySelector(".rating").textContent = currentRating.toFixed(1);
    eventCard.querySelector(".event-average-rating span.rating").textContent = currentRating.toFixed(1);
    alert(`Вы оценили ${currentContest} на ${rating} звезд!`);
    studentPoints += 5;
    updateAchievements();
    updateStats();
}

// Отправка отзыва
function studentSubmitReview() {
    const reviewText = document.getElementById("review-text").value;
    const rating = document.getElementById("review-rating").value;
    if (reviewText) {
        const reviews = JSON.parse(localStorage.getItem(`reviews-${currentContest}`)) || [];
        reviews.push({ text: reviewText, rating });
        localStorage.setItem(`reviews-${currentContest}`, JSON.stringify(reviews));
        studentReviewsWritten++;
        studentPoints += 5;
        updateStats();
        openContest(currentContest);
    } else {
        alert("Пожалуйста, напишите отзыв!");
    }
}

// Загрузка карты мероприятий
function loadEventsMap() {
    const map = L.map("events-map").setView([55.7558, 37.6173], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    const events = document.querySelectorAll("#all-events .event-card");
    events.forEach(event => {
        const lat = parseFloat(event.getAttribute("data-lat"));
        const lon = parseFloat(event.getAttribute("data-lon"));
        const title = event.querySelector("h3").textContent;
        L.marker([lat, lon]).addTo(map).bindPopup(title);
    });
}

// Загрузка календаря
function loadCalendar() {
    const calendarEvents = document.getElementById("calendar-events");
    calendarEvents.innerHTML = registeredEvents.length > 0 ? registeredEvents.map(event => `<li>${event}</li>`).join("") : `<p data-lang="no-events">${translations[document.documentElement.lang].no_events || "Нет мероприятий"}</p>`;
}

// Обновление достижений
function updateAchievements() {
    document.getElementById("student-level").textContent = studentLevel;
    document.getElementById("level-progress-bar").innerHTML = `<div class="progress" style="width: ${studentPoints}%"></div>`;
    document.getElementById("level-progress-text").textContent = `${studentPoints} / 100 баллов до следующего уровня`;

    if (studentPoints >= 100 && studentLevel === "Новичок") {
        studentLevel = "Активный участник";
        studentPoints = 0;
        addNotification("Поздравляем! Вы достигли уровня Активный участник!");
    } else if (studentPoints >= 100 && studentLevel === "Активный участник") {
        studentLevel = "Чемпион";
        studentPoints = 0;
        addNotification("Поздравляем! Вы достигли уровня Чемпион!");
    }
}

// Загрузка еженедельных челленджей
function loadWeeklyChallenges() {
    const challenges = [
        { id: 1, title: "Участвуй в 3 мероприятиях", points: 20, completed: registeredEvents.length >= 3 },
        { id: 2, title: "Оставь 2 отзыва", points: 10, completed: studentReviewsWritten >= 2 }
    ];
    const challengesList = document.getElementById("weekly-challenges");
    challengesList.innerHTML = challenges.map(challenge => `
        <li class="challenge-item ${challenge.completed ? "completed" : ""}">
            <div class="challenge-info">
                <h3>${challenge.title}</h3>
                <p>${challenge.points} баллов</p>
            </div>
        </li>
    `).join("");
}

// Загрузка уведомлений
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const notificationsList = document.getElementById("notifications-list");
    notificationsList.innerHTML = notifications.length > 0 ? notifications.map(notification => `<li>${notification}</li>`).join("") : `<p data-lang="no-notifications">${translations[document.documentElement.lang].no_notifications || "Нет уведомлений"}</p>`;
}

// Добавление уведомления
function addNotification(message) {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    notifications.push(message);
    localStorage.setItem("notifications", JSON.stringify(notifications));
    loadNotifications();
}

// Загрузка сообщений чата
function loadChatMessages() {
    const messages = JSON.parse(localStorage.getItem("chat-messages")) || [];
    const chatMessages = document.getElementById("student-chat-messages");
    chatMessages.innerHTML = messages.length > 0 ? messages.map(msg => `
        <div class="message ${msg.sender === "student" ? "sent" : ""}">
            <p>${msg.text}</p>
        </div>
    `).join("") : `<p data-lang="no-messages">${translations[document.documentElement.lang].no_messages || "Нет сообщений"}</p>`;
}

// Отправка сообщения
function studentSendMessage() {
    const message = document.getElementById("student-chat-input").value;
    if (message) {
        const messages = JSON.parse(localStorage.getItem("chat-messages")) || [];
        messages.push({ sender: "student", text: message });
        localStorage.setItem("chat-messages", JSON.stringify(messages));
        studentMessagesSent++;
        updateStats();
        loadChatMessages();
        document.getElementById("student-chat-input").value = "";
    }
}

// Обновление статистики
function updateStats() {
    document.getElementById("stats-events").textContent = studentEventsThisMonth;
    document.getElementById("stats-reviews").textContent = studentReviewsWritten;
    document.getElementById("stats-points").textContent = studentPoints;
    document.getElementById("stats-messages").textContent = studentMessagesSent;
}

// Загрузка друзей
function loadFriends() {
    friendsList = JSON.parse(localStorage.getItem("friendsList")) || [
        { name: "Иван Смирнов", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1470&auto=format&fit=crop" },
        { name: "Анна Кузнецова", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1470&auto=format&fit=crop" }
    ];
    friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || [
        { name: "Екатерина Иванова", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1470&auto=format&fit=crop" }
    ];

    const friendsContainer = document.getElementById("friends-list");
    friendsContainer.innerHTML = friendsList.length > 0 ? friendsList.map(friend => `
        <div class="friend-item">
            <img src="${friend.image}" alt="${friend.name}">
            <div class="info">
                <h3>${friend.name}</h3>
                <p>Друг</p>
            </div>
            <div class="button small" onclick="studentRemoveFriend('${friend.name}')">Удалить</div>
        </div>
    `).join("") : `<p data-lang="no-friends">${translations[document.documentElement.lang].no_friends || "Нет друзей"}</p>`;

    const requestsContainer = document.getElementById("friend-requests");
    requestsContainer.innerHTML = friendRequests.length > 0 ? friendRequests.map(request => `
        <div class="friend-item">
            <img src="${request.image}" alt="${request.name}">
            <div class="info">
                <h3>${request.name}</h3>
                <p>Запрос в друзья</p>
            </div>
            <div class="button small" onclick="studentAcceptFriend('${request.name}')">Принять</div>
        </div>
    `).join("") : `<p data-lang="no-requests">${translations[document.documentElement.lang].no_requests || "Нет запросов"}</p>`;
}

// Поиск друзей
function studentSearchFriends() {
    const query = document.getElementById("friend-search-input").value.toLowerCase();
    const friends = document.querySelectorAll("#friends-list .friend-item");
    friends.forEach(friend => {
        const name = friend.querySelector("h3").textContent.toLowerCase();
        friend.style.display = name.includes(query) ? "flex" : "none";
    });
}

// Принятие друга
function studentAcceptFriend(name) {
    const request = friendRequests.find(req => req.name === name);
    friendRequests = friendRequests.filter(req => req.name !== name);
    friendsList.push(request);
    localStorage.setItem("friendsList", JSON.stringify(friendsList));
    localStorage.setItem("friendRequests", JSON.stringify(friendRequests));
    loadFriends();
    addNotification(`Вы добавили ${name} в друзья!`);
}

// Удаление друга
function studentRemoveFriend(name) {
    friendsList = friendsList.filter(friend => friend.name !== name);
    localStorage.setItem("friendsList", JSON.stringify(friendsList));
    loadFriends();
    addNotification(`${name} удалён из друзей.`);
}

// Загрузка групп
function loadGroups() {
    groupsList = JSON.parse(localStorage.getItem("groupsList")) || [
        { name: "Экономика для школьников", members: 10 },
        { name: "Аналитика и данные", members: 8 }
    ];
    const groupsContainer = document.getElementById("groups-list");
    groupsContainer.innerHTML = groupsList.length > 0 ? groupsList.map(group => `
        <div class="group-item" onclick="studentOpenGroupChat('${group.name}')">
            <h3>${group.name}</h3>
            <p>${group.members} участников</p>
        </div>
    `).join("") : `<p data-lang="no-groups">${translations[document.documentElement.lang].no_groups || "Нет групп"}</p>`;
}

// Создание группы
function studentCreateGroup() {
    const groupName = prompt("Введите название группы:");
    if (groupName) {
        groupsList.push({ name: groupName, members: 1 });
        localStorage.setItem("groupsList", JSON.stringify(groupsList));
        loadGroups();
        addNotification(`Группа ${groupName} создана!`);
    }
}

// Открытие группового чата
function studentOpenGroupChat(groupName) {
    currentGroupChat = groupName;
    switchScreen("student-group-chat-screen");
    document.getElementById("group-chat-title").textContent = groupName;
    loadGroupChatMessages();
}

// Загрузка сообщений группового чата
function loadGroupChatMessages() {
    const messages = JSON.parse(localStorage.getItem(`group-chat-${currentGroupChat}`)) || [];
    const chatMessages = document.getElementById("group-chat-messages");
    chatMessages.innerHTML = messages.length > 0 ? messages.map(msg => `
        <div class="message ${msg.sender === "student" ? "sent" : ""}">
            <p>${msg.text}</p>
        </div>
    `).join("") : `<p data-lang="no-messages">${translations[document.documentElement.lang].no_messages || "Нет сообщений"}</p>`;
}

// Отправка сообщения в групповой чат
function studentSendGroupMessage() {
    const message = document.getElementById("group-chat-input").value;
    if (message) {
        const messages = JSON.parse(localStorage.getItem(`group-chat-${currentGroupChat}`)) || [];
        messages.push({ sender: "student", text: message });
        localStorage.setItem(`group-chat-${currentGroupChat}`, JSON.stringify(messages));
        studentMessagesSent++;
        updateStats();
        loadGroupChatMessages();
        document.getElementById("group-chat-input").value = "";
    }
}

// Загрузка оффлайн-режима
function loadOfflineEvents() {
    offlineEvents = JSON.parse(localStorage.getItem("offlineEvents")) || [];
    const offlineContainer = document.getElementById("offline-events");
    offlineContainer.innerHTML = offlineEvents.length > 0 ? offlineEvents.map(event => `
        <div class="event-card">
            <img src="${event.image}" alt="${event.title}">
            <div class="info">
                <h3>${event.title}</h3>
                <p>${event.details}</p>
            </div>
        </div>
    `).join("") : `<p data-lang="no-saved-events">${translations[document.documentElement.lang].no_saved_events || "Нет сохранённых мероприятий"}</p>`;
}

// Сохранение мероприятия для оффлайн-режима
function saveEventForOffline(eventCard) {
    const event = {
        title: eventCard.querySelector("h3").textContent,
        image: eventCard.querySelector("img").src,
        details: eventCard.querySelector("p").textContent
    };
    offlineEvents.push(event);
    localStorage.setItem("offlineEvents", JSON.stringify(offlineEvents));
    loadOfflineEvents();
}

// Включение детского режима
function studentToggleKidsMode() {
    const phoneScreen = document.querySelector(".phone-screen");
    phoneScreen.classList.toggle("kids-mode");
}

// Поделиться портфолио
function studentSharePortfolio() {
    const portfolioItems = document.querySelectorAll("#portfolio-list li");
    const shareText = Array.from(portfolioItems).map(item => item.textContent).join("\n");
    if (navigator.share) {
        navigator.share({
            title: "Моё портфолио",
            text: shareText,
            url: window.location.href
        });
    } else {
        alert(`Поделитесь портфолио:\n${shareText}`);
    }
}
