(() => {
    'use strict';

    window.addEventListener('error', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        return true;
    });
    window.addEventListener('unhandledrejection', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        return true;
    });

    const noopEl = {
        classList: {
            add: () => {},
            remove: () => {},
            toggle: () => {},
            contains: () => false
        },
        style: {
            setProperty: () => {},
            removeProperty: () => {}
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute: () => {},
        removeAttribute: () => {},
        getAttribute: () => null,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
        textContent: '',
        innerHTML: '',
        src: '',
        muted: true,
        volume: 0,
        pause: () => {},
        play: () => Promise.resolve(),
        load: () => {}
    };

    const $ = (id) => {
        try {
            const el = document.getElementById(id);
            return el || noopEl;
        } catch (_) {
            return noopEl;
        }
    };

    const DEFAULT_AVATAR = 'assets/images/default-avatar.png';

    let config = {
        maxPlayers: 48,
        defaultProfile: {
            displayName: 'Oyuncu',
            username: '@oyuncu',
            avatar: DEFAULT_AVATAR
        },
        background: {
            Effects: {
                enabled: true,
                vignette: true,
                contrast: true,
                darkness: 0.88
            },
            Video: { enabled: false, file: 'assets/video/bg.mp4', volume: 0 },
            Image: {
                enabled: true,
                slideDuration: 3200,
                fadeDuration: 2400,
                images: [
                    'assets/images/1.png',
                    'assets/images/2.png',
                    'assets/images/3.png',
                    'assets/images/4.png',
                    'assets/images/5.png',
                    'assets/images/6.png',
                    'assets/images/7.png',
                    'assets/images/8.png',
                    'assets/images/9.png'
                ]
            }
        },
        musicPlayer: {
            autoplay: true,
            shuffle: false,
            defaultVolume: 0.35,
            defaultOpen: false,
            songs: [
                {
                    title: 'Delorean',
                    artist: 'UZİ',
                    file: 'assets/music/song1.mp3',
                    cover: 'assets/music/covers/song1.jpg'
                },
                {
                    title: 'Fake Stress',
                    artist: 'BATUBOW X KVCKIN',
                    file: 'assets/music/song2.mp3',
                    cover: 'assets/music/covers/song2.png'
                }
            ]
        }
    };

    function applyScale() {
        try {
            const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
            document.documentElement.style.setProperty('--k', Math.max(0.75, Math.min(2.2, k)).toFixed(4));
        } catch (_) {}
    }
    applyScale();
    window.addEventListener('resize', applyScale);

    function parseLuaConfig(luaText) {
        if (!luaText || typeof luaText !== 'string') return null;
        try {
            let clean = luaText
                .replace(/--\[\[[\s\S]*?\]\]/g, '')
                .replace(/--[^\r\n]*/g, '');

            const parsed = JSON.parse(JSON.stringify(config));

            const effectsBlock = clean.match(/(?:Effects|BackgroundEffects)\s*=\s*\{([\s\S]*?)\}/);
            if (effectsBlock) {
                const eText = effectsBlock[1];
                const eEnabled  = eText.match(/enabled\s*=\s*(true|false)/);
                const eVignette = eText.match(/vignette\s*=\s*(true|false)/);
                const eContrast = eText.match(/contrast\s*=\s*(true|false)/);
                const eDarkness = eText.match(/darkness\s*=\s*([0-9.]+)/);
                if (!parsed.background.Effects) parsed.background.Effects = {};
                if (eEnabled)  parsed.background.Effects.enabled  = eEnabled[1] === 'true';
                if (eVignette) parsed.background.Effects.vignette = eVignette[1] === 'true';
                if (eContrast) parsed.background.Effects.contrast = eContrast[1] === 'true';
                if (eDarkness) parsed.background.Effects.darkness = parseFloat(eDarkness[1]);
            }

            const videoBlock = clean.match(/Video\s*=\s*\{([\s\S]*?)\}/);
            if (videoBlock) {
                const vText = videoBlock[1];
                const vEnabled = vText.match(/enabled\s*=\s*(true|false)/);
                const vFile = vText.match(/file\s*=\s*["']([^"']+)["']/);
                const vVol = vText.match(/volume\s*=\s*([0-9.]+)/);
                if (vEnabled) parsed.background.Video.enabled = vEnabled[1] === 'true';
                if (vFile) parsed.background.Video.file = vFile[1];
                if (vVol) parsed.background.Video.volume = parseFloat(vVol[1]);
            }

            const imageBlock = clean.match(/Image\s*=\s*\{([\s\S]*?\})\s*\}/);
            if (imageBlock) {
                const iText = imageBlock[1];
                const iEnabled  = iText.match(/enabled\s*=\s*(true|false)/);
                const iDuration = iText.match(/slideDuration\s*=\s*(\d+)/);
                const iFade     = iText.match(/fadeDuration\s*=\s*(\d+)/);
                if (iEnabled)  parsed.background.Image.enabled       = iEnabled[1] === 'true';
                if (iDuration) parsed.background.Image.slideDuration = parseInt(iDuration[1], 10);
                if (iFade)     parsed.background.Image.fadeDuration  = parseInt(iFade[1], 10);

                const imgArrayMatch = iText.match(/images\s*=\s*\{([\s\S]*?)\}/);
                if (imgArrayMatch) {
                    const imgs = [];
                    const regex = /["']([^"']+)["']/g;
                    let m;
                    while ((m = regex.exec(imgArrayMatch[1])) !== null) {
                        if (m[1]) imgs.push(m[1]);
                    }
                    if (imgs.length > 0) parsed.background.Image.images = imgs;
                }
            }

            const mpAutoplay = clean.match(/autoplay\s*=\s*(true|false)/);
            const mpShuffle  = clean.match(/shuffle\s*=\s*(true|false)/);
            const mpVolume   = clean.match(/defaultVolume\s*=\s*([0-9.]+)/);
            const mpOpen     = clean.match(/defaultOpen\s*=\s*(true|false)/);
            if (mpAutoplay) parsed.musicPlayer.autoplay      = mpAutoplay[1] === 'true';
            if (mpShuffle)  parsed.musicPlayer.shuffle       = mpShuffle[1] === 'true';
            if (mpVolume)   parsed.musicPlayer.defaultVolume = parseFloat(mpVolume[1]);
            if (mpOpen)     parsed.musicPlayer.defaultOpen   = mpOpen[1] === 'true';

            const songsSection = clean.match(/songs\s*=\s*\{([\s\S]*)\}/);
            if (songsSection) {
                const songBlocks = songsSection[1].match(/\{[^{}]+\}/g);
                if (songBlocks && songBlocks.length > 0) {
                    const songs = [];
                    songBlocks.forEach((block) => {
                        const t = block.match(/title\s*=\s*["']([^"']+)["']/);
                        const a = block.match(/artist\s*=\s*["']([^"']+)["']/);
                        const f = block.match(/file\s*=\s*["']([^"']+)["']/);
                        const c = block.match(/cover\s*=\s*["']([^"']+)["']/);
                        if (t && f) {
                            songs.push({
                                title:  t[1],
                                artist: a ? a[1] : '',
                                file:   f[1],
                                cover:  c ? c[1] : 'assets/music/covers/song1.jpg'
                            });
                        }
                    });
                    if (songs.length > 0) parsed.musicPlayer.songs = songs;
                }
            }

            return parsed;
        } catch (_) {
            return null;
        }
    }

    function applyBackgroundEffects() {
        try {
            const b = config.background || {};
            const eff = b.Effects || config.backgroundEffects || config.BackgroundEffects || {
                enabled: true,
                vignette: true,
                contrast: true,
                darkness: 0.88
            };

            const vignetteEl = $('bg-vignette');
            const imgA = $('bg-img-a');
            const imgB = $('bg-img-b');
            const video = $('bg-video');

            const isEnabled = eff.enabled !== false;
            const useVignette = isEnabled && eff.vignette !== false;
            const useContrast = isEnabled && eff.contrast !== false;
            const rawDarkness = (typeof eff.darkness === 'number') ? eff.darkness : parseFloat(eff.darkness);
            const darkness = (!isNaN(rawDarkness) && rawDarkness > 0) ? Math.max(0.1, Math.min(1.0, rawDarkness)) : 0.88;

            if (vignetteEl) {
                if (useVignette) {
                    vignetteEl.classList.add('cinematic-vignette');
                    vignetteEl.style.opacity = String(darkness);
                } else {
                    vignetteEl.classList.remove('cinematic-vignette');
                    vignetteEl.style.opacity = '0';
                }
            }

            [imgA, imgB, video].forEach((el) => {
                if (!el || !el.classList) return;
                if (useContrast) {
                    el.classList.add('cinematic-fx');
                } else {
                    el.classList.remove('cinematic-fx');
                }
            });
        } catch (_) {}
    }

    async function loadConfig() {
        try {
            const luaRes = await fetch('../config.lua', { cache: 'no-store' });
            if (luaRes.ok) {
                const luaText = await luaRes.text();
                const parsedLua = parseLuaConfig(luaText);
                if (parsedLua) {
                    const savedMax = config.maxPlayers;
                    config = Object.assign({}, config, parsedLua);
                    config.maxPlayers = savedMax || 48;
                }
            }
        } catch (_) {}

        const handover = (window.nuiHandoverData && (window.nuiHandoverData.onyxls || window.nuiHandoverData)) || null;
        if (handover && handover.config) {
            config = Object.assign({}, config, handover.config);
        }

        applyBackgroundEffects();
    }

    const ui = {
        avatar: $('avatar-img'),
        name: $('display-name'),
        handle: $('user-handle'),
        ping: $('ping-value'),
        online: $('players-online'),
        max: $('players-max')
    };

    let currentAvatar = '';
    let currentDiscordId = '';
    let hasReceivedServerPing = false;
    let hasResolvedRealDiscord = false;

    try {
        localStorage.removeItem('onyx_lsv2_discord_profile_v1');
    } catch (_) {}

    function setAvatar(src) {
        if (!src || src === currentAvatar) return;
        currentAvatar = src;
        const pre = new Image();
        pre.onload = () => {
            if (currentAvatar !== src) return;
            ui.avatar.classList.add('swap');
            setTimeout(() => {
                ui.avatar.src = src;
                ui.avatar.classList.remove('swap');
            }, 140);
        };
        pre.onerror = () => {
            if (currentAvatar === src) ui.avatar.src = DEFAULT_AVATAR;
        };
        pre.src = src;
    }

    async function resolveDiscordInBrowser(discordId) {
        if (!discordId) return;
        const targetId = String(discordId);
        const endpoints = [
            `https://japi.rest/discord/v1/user/${targetId}`,
            `https://api.lanyard.rest/v1/users/${targetId}`,
            `https://discordlookup.mesalytic.moe/v1/user/${targetId}`
        ];

        for (const url of endpoints) {
            try {
                if (currentDiscordId !== targetId) return;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) continue;
                const json = await res.json();
                const u = (json && json.data && (json.data.discord_user || json.data)) || json;
                if (u && (u.username || u.global_name || u.tag)) {
                    if (currentDiscordId !== targetId) return;
                    hasResolvedRealDiscord = true;
                    const disp = u.global_name || u.display_name || (u.tag ? u.tag.replace(/#0$/, '') : '') || u.username;
                    const handle = u.username ? ('@' + u.username) : null;
                    let av = u.avatarURL || u.avatarUrl || null;
                    if (!av && u.avatar && typeof u.avatar === 'string') {
                        if (u.avatar.startsWith('http')) {
                            av = u.avatar;
                        } else {
                            const ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
                            av = `https://cdn.discordapp.com/avatars/${targetId}/${u.avatar}.${ext}?size=256`;
                        }
                    } else if (!av && u.avatar && u.avatar.link) {
                        av = u.avatar.link + '?size=256';
                    }
                    if (disp) ui.name.textContent = disp;
                    if (handle) ui.handle.textContent = handle;
                    if (av) setAvatar(av);
                    return;
                }
            } catch (_) {}
        }
    }

    function setPlayer(p) {
        if (!p || typeof p !== 'object') return;

        const incomingId = p.discordId ? String(p.discordId) : '';
        const isIncomingVerified = Boolean(
            p.isVerifiedDiscord ||
            (p.avatar && String(p.avatar).includes('cdn.discordapp.com/avatars/'))
        );

        if (incomingId && incomingId !== currentDiscordId) {
            currentDiscordId = incomingId;
            hasResolvedRealDiscord = false;
        }

        if (hasResolvedRealDiscord && !isIncomingVerified && incomingId === currentDiscordId) {
            return;
        }

        if (isIncomingVerified) {
            hasResolvedRealDiscord = true;
        }

        if (p.displayName) {
            ui.name.textContent = p.displayName;
        }
        if (p.username) {
            ui.handle.textContent = p.username.charAt(0) === '@' ? p.username : '@' + p.username;
        }
        if (p.avatar) {
            setAvatar(p.avatar);
        }
        if (currentDiscordId && !hasResolvedRealDiscord) {
            resolveDiscordInBrowser(currentDiscordId);
        }
    }

    function setStats(s) {
        if (!s) return;
        if (typeof s.onlinePlayers === 'number' && s.onlinePlayers > 0) {
            ui.online.textContent = String(Math.round(s.onlinePlayers));
        }
        const max = (typeof s.maxPlayers === 'number' && s.maxPlayers > 0) ? s.maxPlayers : config.maxPlayers;
        if (max && max > 0) {
            ui.max.textContent = '/' + String(max);
        }
    }

    function measureLivePing() {
        ui.ping.textContent = String(24 + Math.floor(Math.random() * 13));
    }

    setInterval(() => {
        measureLivePing();
    }, 1800);

    const bg = {
        a: $('bg-img-a'),
        b: $('bg-img-b'),
        video: $('bg-video'),
        black: $('bg-black')
    };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function loadImage(src) {
        return new Promise((resolve) => {
            if (!src) return resolve(null);
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                const done = () => resolve(src);
                if (img.decode) img.decode().then(done, done); else done();
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    let slideshowRunning = false;

    async function showFirstImage(list) {
        for (const src of list) {
            const ok = await loadImage(src);
            if (ok) {
                bg.a.src = ok;
                bg.a.classList.add('show');
                return true;
            }
        }
        bg.a.src = 'assets/images/1.png';
        bg.a.classList.add('show');
        return true;
    }

    async function startSlideshow(imgCfg) {
        if (slideshowRunning) return;
        slideshowRunning = true;

        const list = (imgCfg && Array.isArray(imgCfg.images)) ? imgCfg.images.filter(Boolean) : [];
        if (!list.length) {
            list.push('assets/images/1.png');
        }

        const hold = Math.max(1500, Number(imgCfg.slideDuration) || 3200);
        const fade = Math.max(1800, Number(imgCfg.fadeDuration) || 2400);
        const half = Math.round(fade / 2);
        bg.black.style.transitionDuration = half + 'ms';

        let loaded = (await Promise.all(list.map(loadImage))).filter(Boolean);
        if (!loaded.length) {
            loaded = ['assets/images/1.png'];
        }

        let front = bg.a;
        let back = bg.b;
        let index = 0;

        if (!front.classList.contains('show') || front.getAttribute('src') !== loaded[0]) {
            front.src = loaded[0];
            front.classList.add('show');
        }

        if (loaded.length === 1) return;

        while (slideshowRunning) {
            await sleep(hold);
            if (!slideshowRunning) break;
            index = (index + 1) % loaded.length;

            back.src = loaded[index];
            if (back.decode) { try { await back.decode(); } catch (_) {} }

            bg.black.classList.add('on');
            await sleep(half + 60);
            if (!slideshowRunning) break;

            back.classList.add('show');
            front.classList.remove('show');
            await sleep(260);

            bg.black.classList.remove('on');
            await sleep(half + 60);

            const t = front; front = back; back = t;
        }
    }

    function startVideo(videoCfg, imgCfg) {
        const v = bg.video;
        const vol = Math.max(0, Math.min(1, Number(videoCfg.volume) || 0));
        v.muted = vol <= 0;
        v.defaultMuted = v.muted;
        v.volume = vol;

        let retries = 0;
        let visible = false;
        let failed = false;
        let lastTime = -1;
        let frozenTicks = 0;

        const reveal = () => {
            if (visible || failed) return;
            visible = true;
            v.classList.add('show');
        };

        const fallback = () => {
            if (failed) return;
            failed = true;
            v.classList.remove('show');
            try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {}
            startSlideshow(imgCfg);
        };

        const tryPlay = () => {
            if (failed || visible) return;
            const p = v.play();
            if (p && typeof p.then === 'function') {
                p.then(reveal).catch(() => {
                    v.muted = true;
                    v.play().then(reveal).catch(() => {
                        retries++;
                        if (retries >= 3) fallback();
                        else setTimeout(tryPlay, 600);
                    });
                });
            } else if (v.readyState >= 2) {
                reveal();
            }
        };

        const watchdog = setInterval(() => {
            if (failed) { clearInterval(watchdog); return; }
            if (v.ended) { v.currentTime = 0; v.play().catch(() => {}); return; }

            if (visible) {
                if (v.currentTime === lastTime && !v.paused) {
                    frozenTicks++;
                    if (frozenTicks >= 5) {
                        clearInterval(watchdog);
                        fallback();
                        return;
                    }
                } else {
                    frozenTicks = 0;
                    lastTime = v.currentTime;
                }
            } else if (v.readyState >= 2) {
                tryPlay();
            }
        }, 1000);

        v.addEventListener('loadeddata', () => { if (v.readyState >= 2) tryPlay(); });
        v.addEventListener('canplay', () => { if (!visible) tryPlay(); });
        v.addEventListener('playing', reveal);
        v.addEventListener('error', fallback);

        const load = () => {
            v.src = videoCfg.file || 'assets/video/bg.mp4';
            try { v.load(); } catch (_) { fallback(); }
            setTimeout(tryPlay, 300);
        };

        setTimeout(() => { if (!visible && v.readyState < 2) fallback(); }, 12000);

        load();
    }

    async function initBackground() {
        applyBackgroundEffects();
        const b = config.background || {};
        const videoCfg = b.Video || {};
        const imgCfg = b.Image || {};
        const imgs = Array.isArray(imgCfg.images) ? imgCfg.images : [];

        if (imgCfg.enabled && !videoCfg.enabled) {
            await showFirstImage(imgs);
            startSlideshow(imgCfg);
        } else if (videoCfg.enabled) {
            showFirstImage(imgs);
            startVideo(videoCfg, imgCfg);
        } else if (imgCfg.enabled) {
            await showFirstImage(imgs);
            startSlideshow(imgCfg);
        } else if (imgs.length) {
            await showFirstImage(imgs);
            startSlideshow(imgCfg);
        } else {
            showFirstImage(['assets/images/1.png']);
        }
    }

    const mp = {
        root: $('music'),
        toggle: $('music-toggle'),
        player: $('player'),
        bloom: $('player-bloom'),
        cover: $('cover-img'),
        info: document.querySelector('.song-info') || noopEl,
        title: $('song-title'),
        artist: $('song-artist'),
        cur: $('time-cur'),
        total: $('time-total'),
        seek: $('seek'),
        seekFill: $('seek-fill'),
        mute: $('mute-btn'),
        w1: $('vol-w1'),
        w2: $('vol-w2'),
        x: $('vol-x'),
        vol: $('vol'),
        volFill: $('vol-fill'),
        prev: $('prev-btn'),
        play: $('play-btn'),
        next: $('next-btn'),
        icoPause: $('ico-pause'),
        icoPlay: $('ico-play')
    };

    const audio = new Audio();
    audio.preload = 'auto';

    let songs = [];
    let songIndex = 0;
    let volume = 0.35;
    let muted = false;
    let seeking = false;
    let draggingVol = false;
    let errorStreak = 0;
    let wantPlay = true;
    let fadeTimer = null;

    const fmt = (s) => {
        if (!Number.isFinite(s) || s < 0) return '0:00';
        s = Math.floor(s);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };

    function setOpen(open) {
        mp.root.classList.toggle('open', open);
        mp.root.classList.toggle('closed', !open);
    }

    mp.toggle.addEventListener('click', () => setOpen(!mp.root.classList.contains('open')));

    function setPlayIcon(playing) {
        mp.icoPause.classList.toggle('hide', !playing);
        mp.icoPlay.classList.toggle('hide', playing);
    }

    function effectiveVolume() { return muted ? 0 : volume; }

    function renderVolume() {
        const v = effectiveVolume();
        mp.volFill.style.width = (v * 100) + '%';
        mp.w1.style.opacity = v > 0 ? '1' : '0';
        mp.w2.style.opacity = v >= 0.5 ? '1' : '0';
        mp.x.style.opacity = v === 0 ? '1' : '0';
    }

    function fadeVolumeTo(target, ms, done) {
        clearInterval(fadeTimer);
        const start = audio.volume;
        const t0 = performance.now();
        fadeTimer = setInterval(() => {
            const t = Math.min(1, (performance.now() - t0) / ms);
            audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
            if (t >= 1) {
                clearInterval(fadeTimer);
                if (done) done();
            }
        }, 30);
    }

    function play() {
        wantPlay = true;
        audio.volume = 0;
        const p = audio.play();
        if (p && p.then) {
            p.then(() => fadeVolumeTo(effectiveVolume(), 700)).catch(() => {
                setPlayIcon(false);
            });
        }
    }

    function pause() {
        wantPlay = false;
        fadeVolumeTo(0, 220, () => audio.pause());
    }

    function extractGlow(img) {
        try {
            const c = document.createElement('canvas');
            c.width = c.height = 24;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, 24, 24);
            const d = ctx.getImageData(0, 0, 24, 24).data;
            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
            r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
            mp.player.style.setProperty('--glow', `rgba(${r}, ${g}, ${b}, 0.28)`);
        } catch (_) {
            mp.player.style.removeProperty('--glow');
        }
    }

    function loadSong(i, autoPlay) {
        if (!songs.length) return;
        songIndex = ((i % songs.length) + songs.length) % songs.length;
        const s = songs[songIndex];

        mp.info.classList.add('swap');
        mp.cover.classList.add('swap');

        setTimeout(() => {
            mp.title.textContent = s.title || 'Bilinmeyen Şarkı';
            mp.artist.textContent = s.artist || '';
            mp.info.classList.remove('swap');

            if (s.cover) {
                const pre = new Image();
                pre.onload = () => {
                    mp.cover.src = s.cover;
                    mp.bloom.style.backgroundImage = `url("${s.cover}")`;
                    extractGlow(pre);
                    mp.cover.classList.remove('swap');
                };
                pre.onerror = () => {
                    mp.cover.removeAttribute('src');
                    mp.bloom.style.backgroundImage = 'none';
                    mp.cover.classList.remove('swap');
                };
                pre.src = s.cover;
            } else {
                mp.cover.removeAttribute('src');
                mp.bloom.style.backgroundImage = 'none';
                mp.cover.classList.remove('swap');
            }
        }, 160);

        mp.cur.textContent = '0:00';
        mp.total.textContent = '0:00';
        mp.seekFill.style.width = '0%';

        audio.src = s.file;
        audio.load();
        if (autoPlay) play(); else setPlayIcon(false);
    }

    audio.addEventListener('loadedmetadata', () => { mp.total.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', () => {
        if (seeking) return;
        const d = audio.duration;
        mp.cur.textContent = fmt(audio.currentTime);
        if (d > 0) mp.seekFill.style.width = (audio.currentTime / d * 100) + '%';
    });
    audio.addEventListener('playing', () => { errorStreak = 0; setPlayIcon(true); });
    audio.addEventListener('play', () => setPlayIcon(true));
    audio.addEventListener('pause', () => setPlayIcon(false));
    audio.addEventListener('ended', () => loadSong(songIndex + 1, true));
    audio.addEventListener('error', () => {
        errorStreak++;
        if (errorStreak < songs.length) loadSong(songIndex + 1, wantPlay);
    });

    mp.play.addEventListener('click', () => { if (audio.paused) play(); else pause(); });
    mp.next.addEventListener('click', () => loadSong(songIndex + 1, true));
    mp.prev.addEventListener('click', () => {
        if (audio.currentTime > 3) audio.currentTime = 0;
        else loadSong(songIndex - 1, true);
    });

    function ratioFrom(e, el) {
        try {
            const r = el.getBoundingClientRect();
            return r.width > 0 ? Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) : 0;
        } catch (_) {
            return 0;
        }
    }

    function seekTo(e) {
        const ratio = ratioFrom(e, mp.seek);
        mp.seekFill.style.width = (ratio * 100) + '%';
        if (audio.duration > 0) {
            mp.cur.textContent = fmt(ratio * audio.duration);
            return ratio * audio.duration;
        }
        return null;
    }

    function volumeTo(e) {
        volume = ratioFrom(e, mp.vol);
        muted = volume === 0;
        clearInterval(fadeTimer);
        audio.volume = effectiveVolume();
        renderVolume();
    }

    mp.seek.addEventListener('mousedown', (e) => { seeking = true; seekTo(e); });
    mp.vol.addEventListener('mousedown', (e) => { draggingVol = true; volumeTo(e); });
    window.addEventListener('mousemove', (e) => {
        if (seeking) seekTo(e);
        if (draggingVol) volumeTo(e);
    });
    window.addEventListener('mouseup', (e) => {
        if (seeking) {
            const t = seekTo(e);
            if (t !== null) audio.currentTime = t;
        }
        seeking = false;
        draggingVol = false;
    });

    mp.mute.addEventListener('click', () => {
        muted = !muted;
        if (!muted && volume === 0) volume = 0.35;
        clearInterval(fadeTimer);
        audio.volume = effectiveVolume();
        renderVolume();
    });

    function initMusic() {
        const mpCfg = config.musicPlayer || {};
        songs = (Array.isArray(mpCfg.songs) ? mpCfg.songs : []).filter((s) => s && s.file);
        volume = Math.max(0, Math.min(1, Number(mpCfg.defaultVolume ?? 0.35)));
        wantPlay = mpCfg.autoplay !== false;

        if (mpCfg.shuffle) {
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }
        }

        setOpen(Boolean(mpCfg.defaultOpen) || location.hash === '#open');
        renderVolume();
        if (!songs.length) {
            mp.title.textContent = 'Müzik Yok';
            mp.artist.textContent = 'config.lua';
            return;
        }
        loadSong(0, wantPlay);

        const unlock = () => {
            if (wantPlay && audio.paused) play();
            window.removeEventListener('mousedown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
            window.removeEventListener('touchstart', unlock, true);
        };
        window.addEventListener('mousedown', unlock, true);
        window.addEventListener('keydown', unlock, true);
        window.addEventListener('touchstart', unlock, true);
    }

    const ring = $('ring-progress');
    const percentEl = $('percent');
    const subtextEl = $('loading-subtext');
    const CIRC = 2 * Math.PI * 18;

    let realProgress = 0;
    let shown = 0;
    let lastRealChange = performance.now();
    let finished = false;
    let customStatusLockUntil = 0;

    function updateStatusByPercent(p) {
        if (!subtextEl || performance.now() < customStatusLockUntil) return;
        let msg = 'Sunucu bağlantısı hazırlanıyor...';
        if (p >= 96) {
            msg = 'Karakter verileri senkronize ediliyor...';
        } else if (p >= 82) {
            msg = 'Oyun dünyası ve oturum başlatılıyor...';
        } else if (p >= 64) {
            msg = 'Araçlar ve kıyafet paketleri yükleniyor...';
        } else if (p >= 44) {
            msg = 'Mapler ve iç mekanlar yükleniyor...';
        } else if (p >= 22) {
            msg = 'Sunucu scriptleri hazırlanıyor...';
        } else if (p >= 6) {
            msg = 'Temel paketler ve varlıklar doğrulanıyor...';
        }
        if (subtextEl.textContent !== msg) {
            subtextEl.textContent = msg;
        }
    }

    function setCustomStatus(msg, lockMs = 1600) {
        if (!subtextEl || !msg) return;
        customStatusLockUntil = performance.now() + lockMs;
        if (subtextEl.textContent !== msg) {
            subtextEl.textContent = msg;
        }
    }

    function setReal(p) {
        p = Math.max(0, Math.min(100, Number(p) || 0));
        if (p > realProgress) {
            realProgress = p;
            lastRealChange = performance.now();
        }
    }

    function renderProgress(p) {
        const clamped = Math.max(0, Math.min(100, p));
        ring.style.strokeDashoffset = String(CIRC - (clamped / 100) * CIRC);
        percentEl.textContent = String(Math.floor(clamped));
        updateStatusByPercent(clamped);
    }

    function tick() {
        let target = realProgress;
        if (!finished) {
            if (performance.now() - lastRealChange > 1200) {
                target = Math.max(target, Math.min(99, shown + 0.05));
                target = Math.min(target, realProgress + 6);
            }
        } else {
            target = 100;
        }

        if (target < shown) {
            target = shown;
        }

        if (shown < target) {
            const step = Math.max(0.04, (target - shown) * 0.08);
            shown = Math.min(target, shown + step);
        }

        renderProgress(shown);
        requestAnimationFrame(tick);
    }

    const mapStages = {
        INIT_CORE: 'Çekirdek dosyalar hazırlanıyor...',
        INIT_BEFORE_MAP_LOADED: 'Scriptler hazırlanıyor...',
        MAP: 'Mapler yükleniyor...',
        INIT_AFTER_MAP_LOADED: 'Harita objeleri yerleştiriliyor...',
        INIT_SESSION: 'Sunucu oturumu başlatılıyor...'
    };

    window.addEventListener('message', (event) => {
        const d = event.data;
        if (!d || typeof d !== 'object') return;

        switch (d.eventName) {
            case 'loadProgress':
                setReal((Number(d.loadFraction) || 0) * 100);
                break;

            case 'startInitFunctionOrder':
                if (d.type && mapStages[d.type]) {
                    setCustomStatus(mapStages[d.type], 2200);
                }
                break;

            case 'startDataFileEntries':
                setCustomStatus('Mapler ve mod paketleri yükleniyor...', 2200);
                break;

            case 'performMapLoadFunction':
                setCustomStatus('Mapler yükleniyor...', 1400);
                break;

            case 'onDataFileEntry':
                if (d.name) {
                    setCustomStatus('Scriptler ve varlıklar hazırlanıyor...', 1200);
                }
                break;

            case 'onyxls:sync':
            case 'onyx:syncData':
                if (d.payload) {
                    if (d.payload.config) {
                        config = Object.assign({}, config, d.payload.config);
                        applyBackgroundEffects();
                    }
                    setPlayer(d.payload.player);
                    setStats(d.payload.stats);
                }
                break;

            case 'onyxls:shutdown':
            case 'onyx:shutdown':
                finished = true;
                setCustomStatus('Giriş tamamlandı, iyi roller!', 5000);
                renderProgress(100);
                fadeVolumeTo(0, 450, () => audio.pause());
                break;
        }
    });

    async function bootstrap() {
        await loadConfig();

        ui.max.textContent = '/' + String(config.maxPlayers || 48);

        const handover = (window.nuiHandoverData && (window.nuiHandoverData.onyxls || window.nuiHandoverData)) || null;
        if (handover) {
            setPlayer(handover.player);
            setStats(handover.stats);
        }
        measureLivePing();

        applyBackgroundEffects();
        initBackground();
        initMusic();
        requestAnimationFrame(tick);
    }

    bootstrap();
})();
