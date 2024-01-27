// set defaults
var nextEp, prevEp,
    players = Object.keys(series),
    seasons = Object.keys(series[players[0]]);

// getPlayer
function getPlayer(type, season, episode) {
    // collect data
    type = series[type] ? type : players[0];
    season = series[type][season] ? season : seasons[0];
    episode = series[type][season][episode] ? episode : 0;

    if (!series[type][season][episode]) {
        return;
    }

    // predef
    var selectEl = document.querySelector('#select');
    var playerEl = document.querySelector('#player');
    var playerE2 = document.querySelector('#disqus_thread');
    var selPlayEl, selMonthEl, selEpisodeEl, optPlayEl, optMonthEl, optEpisodeEl, playerFrame;

    // clean up elements
    while (selectEl.firstChild) {
        selectEl.removeChild(selectEl.firstChild);
    }

    while (playerEl.firstChild) {
        playerEl.removeChild(playerEl.firstChild);
    }

    while (playerE2.firstChild) {
        playerE2.removeChild(playerE2.firstChild);
    }

    // make new selection 1
    selPlayEl = createSelect('player', players, type);
    selectEl.appendChild(selPlayEl);

    // make new selection 2
    selMonthEl = createSelect('season', seasons, season);
    selectEl.appendChild(selMonthEl);

    // make new selection 3
    selEpisodeEl = createSelect('episode', series[type][season], episode);
    selectEl.appendChild(selEpisodeEl);

    // next - prev
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

    // reset buttons function
    nextEp = false, prevEp = false;

    // make buttons
    if (series[type][season].length > 1) {
        if (episode + 1 < series[type][season].length) {
            nextEp = function () {
                getPlayer(type, season, episode + 1);
                historyState(type, season, episode + 2);
            };
            nextEpBtn.classList.remove('link-button_disabled');
            nextEpBtn.addEventListener('click', nextEp);
        }

        if (episode > 0) {
            prevEp = function () {
                getPlayer(type, season, episode - 1);
                historyState(type, season, episode);
            };
            prevEpBtn.classList.remove('link-button_disabled');
            prevEpBtn.addEventListener('click', prevEp);
        }
    }

    // add iframe
    playerFrame = document.createElement('iframe');
    playerFrame.src = series[type][season][episode].url;
    playerFrame.setAttribute('allowFullScreen', 'true');
    playerEl.appendChild(playerFrame);

    // Remove existing Disqus thread
    var existingDisqusThread = document.getElementById('disqus_thread');
    if (existingDisqusThread) {
        existingDisqusThread.parentNode.removeChild(existingDisqusThread);
    }

    // Find the original location where Disqus should be placed
    var originalDisqusContainer = document.getElementById('original_disqus_container');
    if (originalDisqusContainer) {
        // Create a new Disqus thread element
        var newDisqusThread = document.createElement('div');
        newDisqusThread.id = 'disqus_thread';
        originalDisqusContainer.appendChild(newDisqusThread);
    }

    // Load Disqus script from scratch
    var disqusScript = document.createElement('script');
    disqusScript.src = 'https://tokioshow-zapisi-strimov.disqus.com/embed.js'; // replace with your Disqus shortname
    disqusScript.setAttribute('data-timestamp', +new Date());
    (document.head || document.body).appendChild(disqusScript);

    // return data
    return { player: type, season: season, video: episode + 1 };
}

function createSelect(name, options, selectedValue) {
    var selBx = document.createElement('span');
    selBx.classList.add('select-button');
    selBx.classList.add('video-select__select-button');
    selBx.classList.add('video-select__select-button_' + name);
    var selCont = document.createElement('div');
    selCont.classList.add('video-select__select-container');
    selCont.appendChild(selBx);
    var selEl = document.createElement('select');
    selEl.classList.add('select-button__select');
    selEl.classList.add('video-select__select');
    selBx.appendChild(selEl);
    selEl.addEventListener('change', function () {
        var index = this.selectedIndex;
        switch (name) {
            case 'player':
                getPlayer(options[index], 0, 0);
                historyState(options[index], 0, 1);
                break;
            case 'season':
                getPlayer(type, options[index], 0);
                historyState(type, options[index], 1);
                break;
            case 'episode':
                getPlayer(type, season, index);
                historyState(type, season, index + 1);
                break;
            default:
                break;
        }
    });
    for (var i = 0; i < options.length; i++) {
        var optEl = document.createElement('option');
        optEl.value = i;
        optEl.text = options[i];
        if (selectedValue === i) {
            optEl.setAttribute('selected', 'selected');
        }
        selEl.appendChild(optEl);
    }
    return selCont;
}

var historyState = function (type, season, video, func) {
    state = { player: type, season: season, video: video };
    func = func ? func : 'pushState';
    window.history[func](state, null, location.pathname + '?' + new URLSearchParams(state).toString());
}

window.addEventListener('popstate', function (e) {
    state = e.state ? e.state : { player: '', season: '', video: 1 };
    getPlayer(state.player, state.season, state.video - 1);
});

document.addEventListener('DOMContentLoaded', function () {
    var playerTypeReq = new URLSearchParams(window.location.search).get('player');
    var seasonReq = new URLSearchParams(window.location.search).get('season');
    var videoNumReq = parseInt(new URLSearchParams(window.location.search).get('video'));

    playerTypeReq = players.indexOf(playerTypeReq) > -1 ? playerTypeReq : players[0];
    seasonReq = seasonReq && seasons.indexOf(seasonReq) > -1 ? seasonReq : seasons[0];
    videoNumReq = videoNumReq && videoNumReq > 0 && videoNumReq - 1 < series[playerTypeReq][seasonReq].length ? videoNumReq : 1;

    var curPageData = getPlayer(playerTypeReq, seasonReq, videoNumReq - 1);

    if (curPageData) {
        historyState(curPageData.player, curPageData.season, curPageData.video, 'replaceState');
    }
});
