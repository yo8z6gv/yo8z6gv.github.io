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
var selPlayBx = document.createElement('span');
selPlayBx.classList.add("select-button");
selPlayBx.classList.add("video-select__select-button");
selPlayBx.classList.add("video-select__select-button_episode");
var selPlayCont = document.createElement('div');
selPlayCont.classList.add("video-select__select-container");
selPlayCont.appendChild(selPlayBx);
var selPlayEl = document.createElement('select');
selPlayEl.classList.add("select-button__select");
selPlayEl.classList.add("video-select__select");
selPlayBx.appendChild(selPlayEl);
selPlayEl.addEventListener('change', function () {
    getPlayer(type, this.selectedIndex);
    historyState(type, this.selectedIndex + 1);
});
for (var year in series) {
    var optPlayEl = document.createElement('option');
    optPlayEl.value = year;
    optPlayEl.text = year;
    if (type == year) {
        optPlayEl.setAttribute('selected', 'selected');
    }
    selPlayEl.appendChild(optPlayEl);
}
selectEl.appendChild(selPlayCont);

// make new selection 2
var selMonthBx = document.createElement('span');
selMonthBx.classList.add("select-button");
selMonthBx.classList.add("video-select__select-button");
selMonthBx.classList.add("video-select__select-button_episode");
var selMonthCont = document.createElement('div');
selMonthCont.classList.add("video-select__select-container");
selMonthCont.appendChild(selMonthBx);
var selMonthEl = document.createElement('select');
selMonthEl.classList.add("select-button__select");
selMonthEl.classList.add("video-select__select");
selMonthBx.appendChild(selMonthEl);
selMonthEl.addEventListener('change', function () {
    getPlayer(type, this.value, 0);
    historyState(type, this.value, 1);
});
for (var month in series[type]) {
    var optMonthEl = document.createElement('option');
    optMonthEl.value = month;
    optMonthEl.text = month;
    if (season == month) {
        optMonthEl.setAttribute('selected', 'selected');
    }
    selMonthEl.appendChild(optMonthEl);
}
selectEl.appendChild(selMonthCont);

// make new selection 3
var selEpisodeBx = document.createElement('span');
selEpisodeBx.classList.add("select-button");
selEpisodeBx.classList.add("video-select__select-button");
selEpisodeBx.classList.add("video-select__select-button_season");
var selEpisodeCont = document.createElement('div');
selEpisodeCont.classList.add("video-select__select-container");
selEpisodeCont.appendChild(selEpisodeBx);
var selEpisodeEl = document.createElement('select');
selEpisodeEl.classList.add("select-button__select");
selEpisodeEl.classList.add("video-select__select");
selEpisodeBx.appendChild(selEpisodeEl);
selEpisodeEl.addEventListener('change', function () {
    getPlayer(type, season, this.value);
    historyState(type, season, this.value + 1);
});
for (var i = 0; i < series[type][season].length; i++) {
    var episode = series[type][season][i];
    var optEpisodeEl = document.createElement('option');
    optEpisodeEl.value = i;
    optEpisodeEl.text = episode.title;
    if (episode.url === series[type][season][episode].url) {
        optEpisodeEl.setAttribute('selected', 'selected');
    }
    selEpisodeEl.appendChild(optEpisodeEl);
}
selectEl.appendChild(selEpisodeCont);

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
