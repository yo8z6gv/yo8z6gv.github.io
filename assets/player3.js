var nextEp, prevEp,
    players = Object.keys(series),
    playerIndex = {},
    subPlayerIndex = {};

// Создаем сопоставление текстовых значений с числовыми индексами
players.forEach((player, index) => {
    playerIndex[player] = index;
    subPlayerIndex[player] = {};
    Object.keys(series[player]).forEach((subPlayer, subIndex) => {
        subPlayerIndex[player][subPlayer] = subIndex;
    });
});

function getPlayer(type, subType, episode) {
    // Проверяем и корректируем входные данные
    type = players[playerIndex[type]] ? players[playerIndex[type]] : players[players.length - 1];
    subType = series[type][subType] ? subType : Object.keys(series[type]).pop();
    episode = series[type][subType][episode] ? episode : series[type][subType].length - 1;

    if (!series[type][subType][episode]) {
        return;
    }

    var selectEl = document.querySelector('#select');
    var playerEl = document.querySelector('#player');
    var playerE2 = document.querySelector('#disqus_thread');

    // Очистка предыдущих элементов
    while (selectEl.firstChild) selectEl.removeChild(selectEl.firstChild);
    while (playerEl.firstChild) playerEl.removeChild(playerEl.firstChild);
    while (playerE2.firstChild) playerE2.removeChild(playerE2.firstChild);

    // Создание выпадающего списка для выбора типа
    createDropdown(selectEl, players, playerIndex[type], function(selectedTypeIndex) {
        var selectedType = players[selectedTypeIndex];
        // Сброс остальных значений
        getPlayer(selectedType, Object.keys(series[selectedType]).pop(), series[selectedType][Object.keys(series[selectedType]).pop()].length - 1);
    }, 'player');

    // Создание выпадающего списка для выбора подтипа
    createDropdown(selectEl, Object.keys(series[type]), subPlayerIndex[type][subType], function(selectedSubTypeIndex) {
        var selectedSubType = Object.keys(series[type])[selectedSubTypeIndex];
        // Сброс значения эпизода
        getPlayer(type, selectedSubType, series[type][selectedSubType].length - 1);
    }, 'subPlayer');

    // Создание выпадающего списка для выбора эпизода
    createDropdown(selectEl, series[type][subType], episode, function(selectedEpisodeIndex) {
        getPlayer(type, subType, selectedEpisodeIndex);
    }, 'episode');

    // Добавление iframe
    var playerFrame = document.createElement('iframe');
    playerFrame.src = series[type][subType][episode].url;
    playerFrame.setAttribute('allowFullScreen', 'true');
    playerEl.appendChild(playerFrame);

    // Обновление стрелок "next" и "prev"
    updateNavigationButtons(type, subType, episode);

    // Удаление существующего Disqus thread
    var existingDisqusThread = document.getElementById('disqus_thread');
    if (existingDisqusThread) {
        existingDisqusThread.parentNode.removeChild(existingDisqusThread);
    }

    // Создание нового Disqus thread
    var originalDisqusContainer = document.getElementById('original_disqus_container');
    if (originalDisqusContainer) {
        var newDisqusThread = document.createElement('div');
        newDisqusThread.id = 'disqus_thread';
        originalDisqusContainer.appendChild(newDisqusThread);
    }

    var disqusScript = document.createElement('script');
    disqusScript.src = 'https://tokioshow-zapisi-strimov.disqus.com/embed.js';
    disqusScript.setAttribute('data-timestamp', +new Date());
    (document.head || document.body).appendChild(disqusScript);

    // Обновление URL состояния
    historyState(type, subType, episode + 1);

    // Обновление текста текущего эпизода
    var pageTitleText = document.querySelector('.page-title__text--japanese');
    if (pageTitleText) {
        pageTitleText.textContent = series[type][subType][episode].title;
    }

    return { player: type, subPlayer: subType, video: episode + 1 };
}

function createDropdown(container, options, selectedIndex, onChange, type) {
    var selPlayBx = document.createElement('span');
    selPlayBx.classList.add("select-button", "video-select__select-button", "video-select__select-button_" + type);

    var selPlayCont = document.createElement('div');
    selPlayCont.classList.add("video-select__select-container");
    selPlayCont.appendChild(selPlayBx);

    var selPlayEl = document.createElement('select');
    selPlayEl.classList.add("select-button__select", "video-select__select");
    selPlayBx.appendChild(selPlayEl);

    options.forEach((option, index) => {
        var optPlayEl = document.createElement('option');
        optPlayEl.value = index; // Используем числовой индекс для значения
        optPlayEl.text = (typeof option === 'object') ? option.title : option; // Если это объект, используем title
        if (index === selectedIndex) optPlayEl.setAttribute('selected', 'selected');
        selPlayEl.appendChild(optPlayEl);
    });

    selPlayEl.addEventListener('change', function () {
        onChange(parseInt(this.value));
    });

    container.appendChild(selPlayCont);
}

function updateNavigationButtons(type, subType, episode) {
    var nextEpBtn = document.querySelector('.video-select__link_next');
    var prevEpBtn = document.querySelector('.video-select__link_prev');

    if (nextEp) {
        nextEpBtn.removeEventListener('click', nextEp);
        nextEpBtn.classList.add('link-button_disabled');
    }
    if (prevEp) {
        prevEpBtn.removeEventListener('click', prevEp);
        prevEpBtn.classList.add('link-button_disabled');
    }

    nextEp = false;
    prevEp = false;

    if (series[type][subType].length > 1) {
        if (episode + 1 < series[type][subType].length) {
            nextEp = function () {
                getPlayer(type, subType, episode + 1);
            };
            nextEpBtn.classList.remove('link-button_disabled');
            nextEpBtn.addEventListener('click', nextEp);
        }
        if (episode > 0) {
            prevEp = function () {
                getPlayer(type, subType, episode - 1);
            };
            prevEpBtn.classList.remove('link-button_disabled');
            prevEpBtn.addEventListener('click', prevEp);
        }
    }
}

function historyState(type, subType, video, method = 'pushState') {
    var typeIndex = playerIndex[type];
    var subTypeIndex = subPlayerIndex[type][subType];
    var state = { player: typeIndex, subPlayer: subTypeIndex, video: video };
    var queryString = new URLSearchParams(state).toString();
    if (method === 'replaceState') {
        window.history.replaceState(state, null, location.pathname + '?' + queryString);
    } else {
        window.history.pushState(state, null, location.pathname + '?' + queryString);
    }
}

window.addEventListener('popstate', function (e) {
    var state = e.state ? e.state : { player: players.length - 1, subPlayer: Object.keys(series[players[players.length - 1]]).length - 1, video: series[players[players.length - 1]][Object.keys(series[players[players.length - 1]])[Object.keys(series[players[players.length - 1]]).length - 1]].length };
    var type = players[state.player] || players[players.length - 1];
    var subType = Object.keys(series[type])[state.subPlayer] || Object.keys(series[type]).pop();
    getPlayer(type, subType, state.video - 1);
});

document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var playerTypeIndex = parseInt(params.get('player'));
    var subPlayerTypeIndex = parseInt(params.get('subPlayer'));
    var videoNumReq = parseInt(params.get('video'));

    var type = (playerTypeIndex !== NaN && playerTypeIndex >= 0 && playerTypeIndex < players.length) ? players[playerTypeIndex] : players[players.length - 1];
    var subType = (subPlayerTypeIndex !== NaN && subPlayerTypeIndex >= 0 && subPlayerTypeIndex < Object.keys(series[type]).length) ? Object.keys(series[type])[subPlayerTypeIndex] : Object.keys(series[type]).pop();
    var video = (videoNumReq !== NaN && videoNumReq > 0 && videoNumReq - 1 < series[type][subType].length) ? videoNumReq - 1 : series[type][subType].length - 1;

    getPlayer(type, subType, video);
});
