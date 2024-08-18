var nextEp, prevEp,
    players = Object.keys(series);

function getPlayer(type, subType, episode) {
    type = series[type] ? type : players[0];
    subType = series[type][subType] ? subType : Object.keys(series[type])[0];
    episode = series[type][subType][episode] ? episode : 0;

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
    createDropdown(selectEl, players, type, function(selectedType) {
        getPlayer(selectedType, subType, episode);
        historyState(selectedType, subType, episode + 1);
    }, 'player');

    // Создание выпадающего списка для выбора подтипа
    createDropdown(selectEl, Object.keys(series[type]), subType, function(selectedSubType) {
        getPlayer(type, selectedSubType, episode);
        historyState(type, selectedSubType, episode + 1);
    }, 'subPlayer');

    // Создание выпадающего списка для выбора эпизода
    createDropdown(selectEl, series[type][subType], episode, function(selectedEpisodeIndex) {
        getPlayer(type, subType, selectedEpisodeIndex);
        historyState(type, subType, selectedEpisodeIndex + 1);
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

    return { player: type, subPlayer: subType, video: episode + 1 };
}

function createDropdown(container, options, selectedValue, onChange, type) {
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
        optPlayEl.value = index;
        optPlayEl.text = (typeof option === 'object') ? option.title : option; // Если это объект, используем title
        if (option === selectedValue) optPlayEl.setAttribute('selected', 'selected');
        selPlayEl.appendChild(optPlayEl);
    });

    selPlayEl.addEventListener('change', function () {
        onChange(this.options[this.selectedIndex].value);
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
                historyState(type, subType, episode + 2);
            };
            nextEpBtn.classList.remove('link-button_disabled');
            nextEpBtn.addEventListener('click', nextEp);
        }
        if (episode > 0) {
            prevEp = function () {
                getPlayer(type, subType, episode - 1);
                historyState(type, subType, episode);
            };
            prevEpBtn.classList.remove('link-button_disabled');
            prevEpBtn.addEventListener('click', prevEp);
        }
    }
}

function historyState(type, subType, video, method = 'pushState') {
    var state = { player: type, subPlayer: subType, video: video };
    if (method === 'replaceState') {
        window.history.replaceState(state, null, location.pathname + '?' + new URLSearchParams(state).toString());
    } else {
        window.history.pushState(state, null, location.pathname + '?' + new URLSearchParams(state).toString());
    }
}

window.addEventListener('popstate', function (e) {
    var state = e.state ? e.state : { player: '', subPlayer: '', video: 1 };
    getPlayer(state.player, state.subPlayer, state.video - 1);
});

document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var playerTypeReq = params.get('player');
    var subPlayerTypeReq = params.get('subPlayer');
    var videoNumReq = parseInt(params.get('video'));

    var type = playerTypeReq || players[0];
    var subType = subPlayerTypeReq || Object.keys(series[type])[0];
    var video = (videoNumReq && videoNumReq > 0 && videoNumReq - 1 < series[type][subType].length) ? videoNumReq - 1 : 0;

    var curPageData = getPlayer(type, subType, video);
    if (curPageData) {
        historyState(curPageData.player, curPageData.subPlayer, curPageData.video, 'replaceState');
    }
});
