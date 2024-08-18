var nextEp, prevEp,
    players = Object.keys(series).map((_, index) => index + 1),
    subPlayers = {},
    episodes = {};

Object.keys(series).forEach((type, typeIndex) => {
    subPlayers[type] = Object.keys(series[type]).map((_, index) => index + 1);
    episodes[type] = {};
    Object.keys(series[type]).forEach((subType, subTypeIndex) => {
        episodes[type][subType] = series[type][subType].map((_, index) => index + 1);
    });
});

function getPlayer(typeIndex, subTypeIndex, episodeIndex) {
    const type = Object.keys(series)[typeIndex - 1];
    const subType = Object.keys(series[type])[subTypeIndex - 1];
    const episode = series[type][subType][episodeIndex - 1];

    if (!episode) {
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
    createDropdown(selectEl, players, typeIndex, (selectedTypeIndex) => {
        getPlayer(selectedTypeIndex, subTypeIndex, episodeIndex);
        historyState(selectedTypeIndex, subTypeIndex, episodeIndex);
    }, 'player');

    // Создание выпадающего списка для выбора подтипа
    createDropdown(selectEl, subPlayers[type], subTypeIndex, (selectedSubTypeIndex) => {
        getPlayer(typeIndex, selectedSubTypeIndex, episodeIndex);
        historyState(typeIndex, selectedSubTypeIndex, episodeIndex);
    }, 'subPlayer');

    // Создание выпадающего списка для выбора эпизода
    createDropdown(selectEl, episodes[type][subType], episodeIndex, (selectedEpisodeIndex) => {
        getPlayer(typeIndex, subTypeIndex, selectedEpisodeIndex);
        historyState(typeIndex, subTypeIndex, selectedEpisodeIndex);
    }, 'episode');

    // Добавление iframe
    var playerFrame = document.createElement('iframe');
    playerFrame.src = episode.url;
    playerFrame.setAttribute('allowFullScreen', 'true');
    playerEl.appendChild(playerFrame);

    // Обновление стрелок "next" и "prev"
    updateNavigationButtons(type, subType, episodeIndex);

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

    return { player: typeIndex, subPlayer: subTypeIndex, video: episodeIndex + 1 };
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

    options.forEach((optionIndex) => {
        var optPlayEl = document.createElement('option');
        var optionValue = optionIndex;
        var optionText = getOptionText(type, optionIndex);

        optPlayEl.value = optionIndex;
        optPlayEl.text = optionText;
        if (optionIndex === selectedIndex) optPlayEl.setAttribute('selected', 'selected');
        selPlayEl.appendChild(optPlayEl);
    });

    selPlayEl.addEventListener('change', function () {
        onChange(parseInt(this.value));
    });

    container.appendChild(selPlayCont);
}

function getOptionText(type, index) {
    switch (type) {
        case 'player':
            return Object.keys(series)[index - 1];
        case 'subPlayer':
            const playerType = Object.keys(series)[parseInt(document.querySelector('.video-select__select-button_player select').value) - 1];
            return Object.keys(series[playerType])[index - 1];
        case 'episode':
            const subType = Object.keys(series[Object.keys(series)[parseInt(document.querySelector('.video-select__select-button_player select').value) - 1]])[parseInt(document.querySelector('.video-select__select-button_subPlayer select').value) - 1];
            return series[Object.keys(series)[parseInt(document.querySelector('.video-select__select-button_player select').value) - 1]][subType][index - 1].title;
        default:
            return '';
    }
}

function updateNavigationButtons(type, subType, episodeIndex) {
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
        if (episodeIndex + 1 < series[type][subType].length) {
            nextEp = function () {
                getPlayer(type, subType, episodeIndex + 1);
                historyState(type, subType, episodeIndex + 2);
            };
            nextEpBtn.classList.remove('link-button_disabled');
            nextEpBtn.addEventListener('click', nextEp);
        }
        if (episodeIndex > 0) {
            prevEp = function () {
                getPlayer(type, subType, episodeIndex - 1);
                historyState(type, subType, episodeIndex);
            };
            prevEpBtn.classList.remove('link-button_disabled');
            prevEpBtn.addEventListener('click', prevEp);
        }
    }
}

function historyState(typeIndex, subTypeIndex, episodeIndex, method = 'pushState') {
    var state = { player: typeIndex, subPlayer: subTypeIndex, video: episodeIndex + 1 };
    if (method === 'replaceState') {
        window.history.replaceState(state, null, location.pathname + '?' + new URLSearchParams(state).toString());
    } else {
        window.history.pushState(state, null, location.pathname + '?' + new URLSearchParams(state).toString());
    }
}

window.addEventListener('popstate', function (e) {
    var state = e.state ? e.state : { player: 1, subPlayer: 1, video: 1 };
    getPlayer(state.player, state.subPlayer, state.video - 1);
});

document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var playerTypeReq = parseInt(params.get('player'));
    var subPlayerTypeReq = parseInt(params.get('subPlayer'));
    var videoNumReq = parseInt(params.get('video'));

    var typeIndex = playerTypeReq || 1;
    var subTypeIndex = subPlayerTypeReq || 1;
    var episodeIndex = (videoNumReq && videoNumReq > 0 && videoNumReq - 1 < series[Object.keys(series)[typeIndex - 1]][Object.keys(series[Object.keys(series)[typeIndex - 1]])[subTypeIndex - 1]].length) ? videoNumReq - 1 : 0;

    var curPageData = getPlayer(typeIndex, subTypeIndex, episodeIndex);
    if (curPageData) {
        historyState(curPageData.player, curPageData.subPlayer, curPageData.video, 'replaceState');
    }
});
