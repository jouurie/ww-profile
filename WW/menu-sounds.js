/* CC0 organic menu sounds. Playback requires a trusted visitor gesture. */
(function (global) {
  'use strict';
  if (global.WWMenuSounds) return;
  const scriptURL = document.currentScript?.src || new URL('../WW/menu-sounds.js', location.href).href;
  const selectors = [
    '.ww-site-header .chapter-nav a', '.ww-site-header .character-menu a',
    '.ww-site-header .characters > summary',
    '#guide .wg-groups button', '#guide .wg-item-selector button',
    '#guide .wg-category-platforms button', '#guide .wg-local-tabs button',
    '#npc .ww-npc-arrow', '#npc .ww-npc-thumb',
    '#truck .wwtruck-categories button', '#truck .wwtruck-thumbnail',
    '.ww-hscroll-controls button', 'footer button[data-scroll-top]'
  ].join(',');
  const tuning = {
    click: { file: 'menu-click.wav', gain: .18, rate: .95, interval: 90 },
    hover: { file: 'menu-hover.wav', gain: .10, rate: .90, interval: 140 }
  };
  const raw = new Map();
  const buffers = new Map();
  const active = new Set();
  const last = { click: -Infinity, hover: -Infinity };
  const counts = { click: 0, hover: 0, ended: 0 };
  let context, filter, decoding, mounted = false, unlocked = false;

  function preload() {
    for (const [kind, settings] of Object.entries(tuning)) {
      const url = new URL('assets/audio/' + settings.file, scriptURL);
      const revision = new URL(scriptURL).searchParams.get('v');
      if (revision) url.searchParams.set('v', revision);
      raw.set(kind, fetch(url).then(response => {
        if (!response.ok) throw Error('Menu sound asset: ' + response.status);
        return response.arrayBuffer();
      }).catch(() => null));
    }
  }
  function activate() {
    unlocked = true;
    const AudioContext = global.AudioContext || global.webkitAudioContext;
    if (!AudioContext) return Promise.resolve(false);
    if (!context || context.state === 'closed') {
      context = new AudioContext();
      filter = context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 2800; filter.Q.value = .7;
      filter.connect(context.destination);
      decoding = Promise.all([...raw].map(async ([kind, promise]) => {
        const data = await promise;
        if (data) buffers.set(kind, await context.decodeAudioData(data.slice(0)));
      })).catch(() => false);
    }
    const resumed = context.state === 'suspended' ? context.resume() : Promise.resolve();
    return Promise.all([resumed, decoding]).then(() => context.state === 'running').catch(() => false);
  }
  function stopVoice(voice) {
    if (voice.stopping) return;
    voice.stopping = true;
    const now = context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + .006);
    try { voice.source.stop(now + .007); } catch { /* The source may have just ended. */ }
  }
  function stop() { active.forEach(stopVoice); }
  async function play(kind) {
    if (!unlocked || document.hidden) return;
    const now = performance.now(), settings = tuning[kind];
    if (now - last[kind] < settings.interval) return;
    last[kind] = now;
    if (!await activate() || document.hidden) return;
    if (performance.now() - now > (kind === 'hover' ? 150 : 500)) return;
    const buffer = buffers.get(kind); if (!buffer) return;
    active.forEach(voice => { if (voice.kind === 'hover' || active.size >= 3) stopVoice(voice); });
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.playbackRate.value = settings.rate;
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(settings.gain, context.currentTime + .003);
    const end = context.currentTime + buffer.duration / settings.rate;
    gain.gain.setValueAtTime(settings.gain, Math.max(context.currentTime + .003, end - .008));
    gain.gain.linearRampToValueAtTime(0, end);
    source.connect(gain); gain.connect(filter);
    const voice = { source, gain, kind, stopping: false };
    source.onended = () => { active.delete(voice); source.disconnect(); gain.disconnect(); counts.ended++; };
    active.add(voice); source.start(); counts[kind]++;
  }
  function menu(target) {
    const control = target?.closest?.(selectors);
    if (!control || control.matches(':disabled,[aria-disabled="true"]') || control.closest('[hidden],[inert]')) return null;
    return control;
  }
  function mount() {
    if (mounted) return;
    mounted = true; preload();
    document.addEventListener('pointerdown', event => { if (event.isTrusted) void activate(); }, true);
    document.addEventListener('keydown', event => { if (event.isTrusted && (event.key === 'Enter' || event.key === ' ')) void activate(); }, true);
    document.addEventListener('click', event => { if (event.isTrusted && menu(event.target)) void play('click'); }, true);
    document.addEventListener('pointerover', event => {
      if (!event.isTrusted || event.pointerType !== 'mouse' || !global.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
      const control = menu(event.target);
      if (control && !control.contains(event.relatedTarget)) void play('hover');
    }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    global.addEventListener('pagehide', stop);
  }
  global.WWMenuSounds = {
    mount, stop,
    get state() {
      return { unlocked, context: context?.state || 'uninitialized', decoded: [...buffers.keys()], active: active.size, counts: { ...counts } };
    }
  };
  mount();
})(window);
