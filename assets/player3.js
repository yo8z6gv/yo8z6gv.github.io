var nextEp, prevEp,
    players = Object.keys(series);

function getPlayer(type, subType, episode) {
    type = series[type] ? type : players[0];
    subType = series[type][subType] ? subType : Object.keys(series[type])[0];
    episode = series[type][subType][episode] ? episode : 0;

    if (!series[type][subType][episode]) {
        console.error('Episode not found:', type, subType, episode);
        return;
    }

    var selectEl = document.querySelector('#select');
    var playerEl = document.querySelector('#player');
    var playerE2 = document.querySelector('#disqus_thread');

    // Очистка предыдущих элементов
    while (selectEl.firstChild) selectEl.removeChild(selectEl.firstChild);
    while (playerEl.firstChild) playerEl.removeChild(playerEl.firstChild);
    while (playerE2.firstChild) playerE2.removeChild(playerE2.firstChild);

    // Создание контейнеров для каждого выпадающего списка
    var typeSelectContainer = document.createElement('div');
    var subTypeSelectContainer = document.createElement('div');
    var episodeSelectContainer = document.createElement('div');

    selectEl.appendChild(typeSelectContainer);
    selectEl.appendChild(subTypeSelectContainer);
    selectEl.appendChild(episodeSelectContainer);

    // Создание выпадающего списка для типа
    createDropdown(typeSelectContainer, players, players.indexOf(type), function(selectedType) {
        getPlayer(selectedType, subType, episode);
        historyState(selectedType, subType, episode + 1);
    });

    // Создание выпадающего списка для подтипа
    createDropdown(subTypeSelectContainer, Object.keys(series[type]), Object.keys(series[type]).indexOf(subType), function(selectedSubType) {
        getPlayer(type, selectedSubType, episode);
        historyState(type, selectedSubType, episode + 1);
    });

    // Создание выпадающего списка для эпизодов
    createDropdown(episodeSelectContainer, series[type][subType], episode, function(selectedEpisodeIndex) {
        getPlayer(type, subType, selectedEpisodeIndex);
        historyState(type, subType, selectedEpisodeIndex + 1);
    });

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

function createDropdown(container, options, selectedIndex, onChange) {
    var selPlayBx = document.createElement('span');
    selPlayBx.classList.add("select-button", "video-select__select-button", "video-select__select-button_episode");

    var selPlayCont = document.createElement('div');
    selPlayCont.classList.add("video-select__select-container");
    selPlayCont.appendChild(selPlayBx);

    var selPlayEl = document.createElement('select');
    selPlayEl.classList.add("select-button__select", "video-select__select");
    selPlayBx.appendChild(selPlayEl);

    options.forEach((option, index) => {
        var optPlayEl = document.createElement('option');
        optPlayEl.value = index;
        optPlayEl.text = (typeof option === 'object' ? option.title : option) || option;
        if (index == selectedIndex) optPlayEl.selected = true;
        selPlayEl.appendChild(optPlayEl);
    });

    selPlayEl.addEventListener('change', function () {
        onChange(this.selectedIndex);
    });

    container.appendChild(selPlayCont);
}

function updateNavigationButtons(type, subType, episode) {
    var nextEpBtn = document.querySelector('.video-select__link_next');
    var prevEpBtn = document.querySelector('.video-select__link_prev');

    // Очищаем старые события и классы
    if (nextEp) {
        nextEpBtn.removeEventListener('click', nextEp);
        nextEpBtn.classList.add('link-button_disabled');
    }
    if (prevEp) {
        prevEpBtn.removeEventListener('click', prevEp);
        prevEpBtn.classList.add('link-button_disabled');
    }

    // Обновляем новые значения
    nextEp = null;
    prevEp = null;

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

function historyState(type, subType, video, replace = false) {
    var state = { player: type, subPlayer: subType, video: video };
    if (replace) {
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
    var video = (videoNumReq && videoNumReq > 0 && videoNumReq - 1 < series[type][subType].length) ? videoNumReq : 1;

    var curPageData = getPlayer(type, subType, video - 1);
    if (curPageData) {
        historyState(curPageData.player, curPageData.subPlayer, curPageData.video, true);
    }
});
