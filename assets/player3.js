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
    var selPlayEl, optPlayEl, playerFrame;

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
    selPlayBx = document.createElement('span');
    selPlayBx.classList.add("select-button");
    selPlayBx.classList.add("video-select__select-button");
    selPlayBx.classList.add("video-select__select-button_episode");
    selPlayCont = document.createElement('div');
    selPlayCont.classList.add("video-select__select-container");
    selPlayCont.appendChild(selPlayBx);
    selPlayEl = document.createElement('select');
    selPlayEl.classList.add("select-button__select");
    selPlayEl.classList.add("video-select__select");
    selPlayBx.appendChild(selPlayEl);
    selPlayEl.addEventListener('change', function () {
        getPlayer(players[this.selectedIndex]);
        historyState(players[this.selectedIndex], 1);
    });

    for (var p of players) {
        optPlayEl = document.createElement('option');
        optPlayEl.value = p;
        optPlayEl.text = p;
        if (type == p) {
            optPlayEl.setAttribute('selected', 'selected');
        }
        selPlayEl.appendChild(optPlayEl);
    }

    selectEl.appendChild(selPlayCont);

    // make new selection 2
    selPlayBx = document.createElement('span');
    selPlayBx.classList.add("select-button");
    selPlayBx.classList.add("video-select__select-button");
    selPlayBx.classList.add("video-select__select-button_episode");
    selPlayCont = document.createElement('div');
    selPlayCont.classList.add("video-select__select-container");
    selPlayCont.appendChild(selPlayBx);
    selPlayEl = document.createElement('select');
    selPlayEl.classList.add("select-button__select");
    selPlayEl.classList.add("video-select__select");
    selPlayBx.appendChild(selPlayEl);
    selPlayEl.addEventListener('change', function () {
        getPlayer(type, this.value, 0);
        historyState(type, this.value, 1);
    });

    for (var e in series[type][season]) {
        optPlayEl = document.createElement('option');
        optPlayEl.value = e;
        optPlayEl.text = series[type][season][e].title;
        if (episode == e) {
            selPlayEl.selectedIndex = Array.from(selPlayEl.options).indexOf(optPlayEl);
        }
        selPlayEl.appendChild(optPlayEl);
    }

    selectEl.appendChild(selPlayCont);

    // make new selection 3
    var selSeasonBx = document.createElement('span');
    selSeasonBx.classList.add("select-button");
    selSeasonBx.classList.add("video-select__select-button");
    selSeasonBx.classList.add("video-select__select-button_season");
    var selSeasonCont = document.createElement('div');
    selSeasonCont.classList.add("video-select__select-container");
    selSeasonCont.appendChild(selSeasonBx);
    var selSeasonEl = document.createElement('select');
    selSeasonEl.classList.add("select-button__select");
    selSeasonEl.classList.add("video-select__select");
    selSeasonBx.appendChild(selSeasonEl);
    selSeasonEl.addEventListener('change', function () {
        getPlayer(type, this.value, 0);
        historyState(type, this.value, 1);
    });

    for (var s of seasons) {
        var optSeasonEl = document.createElement('option');
        optSeasonEl.value = s;
        optSeasonEl.text = s;
        if (season == s) {
            optSeasonEl.setAttribute('selected', 'selected');
        }
        selSeasonEl.appendChild(optSeasonEl);
    }

    selectEl.appendChild(selSeasonCont);

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
