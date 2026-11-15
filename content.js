(() => {
  // Run in the page world so fetch reaches Telegram's controlling service worker.
  if (globalThis.__telegramVideoSaverV101) return globalThis.__telegramVideoSaverV101.start();
  let busy = false;
  const LIMIT = 1024 * 1024 * 1024;
  function report(message, error = false) {
    let box = document.getElementById('__tvs_status');
    if (!box) {
      box = document.createElement('div'); box.id = '__tvs_status';
      Object.assign(box.style, {position:'fixed',bottom:'24px',right:'24px',zIndex:'2147483647',maxWidth:'360px',padding:'18px',borderRadius:'12px',background:'#142535',color:'#fff',font:'14px/1.5 system-ui',boxShadow:'0 8px 40px #0008',cursor:'pointer'});
      box.setAttribute('role', 'status');
      box.title = 'Click to dismiss'; box.onclick = () => box.remove();
      document.documentElement.append(box);
    }
    box.textContent = message; box.style.border = error ? '1px solid #ff8585' : '1px solid #65cbfa';
  }
  function chooseVideo() {
    return [...document.querySelectorAll('video')].filter(v => {
      const r = v.getBoundingClientRect();
      return r.width > 40 && r.height > 40 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(v).visibility !== 'hidden';
    }).sort((a,b) => {
      const score = v => (!v.paused ? 1e9 : 0) + v.getBoundingClientRect().width * v.getBoundingClientRect().height;
      return score(b)-score(a);
    })[0];
  }
  async function save(video) {
    const source = video.currentSrc || video.src;
    if (!source) throw new Error('No video source yet. Start playback and try again.');
    const url = new URL(source, location.href);
    if (!['blob:', 'https:'].includes(url.protocol) || url.origin !== location.origin) throw new Error('This video uses an unsupported external source.');
    let offset = 0, total = null, mime = '', chunks = [];
    report('Preparing video… Keep this Telegram tab open.');
    do {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);
      try {
        const response = await fetch(url.href, {credentials:'same-origin', signal:controller.signal, headers: url.protocol === 'blob:' ? {} : {Range:`bytes=${offset}-${offset + 512 * 1024 - 1}`}});
        if (response.status === 302 || response.type === 'opaqueredirect') throw new Error('Telegram redirected the video request. Reload Telegram, start playback, then retry.');
        if (![200,206].includes(response.status)) throw new Error(`Video request failed (${response.status}). Play the video and retry.`);
        mime = response.headers.get('content-type') || mime;
        if (mime.includes('mpegurl') || mime.includes('dash') || mime.includes('text/') || mime.includes('json')) throw new Error('This streaming format is not supported.');
        const range = response.headers.get('content-range');
        let expected = null;
        if (response.status === 206) {
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(range || '');
          if (!match || Number(match[1]) !== offset) throw new Error('The player returned an unexpected video range.');
          const end = Number(match[2]), nextTotal = Number(match[3]);
          if (end < offset || nextTotal <= end || (total !== null && nextTotal !== total)) throw new Error('The video changed during download. Please retry.');
          total = nextTotal; expected = end - offset + 1;
        } else if (offset !== 0) throw new Error('The video server stopped supporting partial downloads.');
        const length = Number(response.headers.get('content-length'));
        if ((total || length) > LIMIT) throw new Error('This version supports videos up to 1 GB.');
        const reader = response.body.getReader(); let received = 0;
        while (true) {
          const {done,value} = await reader.read(); if (done) break;
          received += value.byteLength;
          if (offset + received > LIMIT) { await reader.cancel(); throw new Error('This version supports videos up to 1 GB.'); }
          chunks.push(value);
          report(`Saving video… ${((offset + received)/1048576).toFixed(1)} MB${total ? ` of ${(total/1048576).toFixed(1)} MB` : ''}`);
        }
        if (!received || (expected !== null && received !== expected)) throw new Error('The video response was incomplete. Please retry.');
        offset += received;
        if (response.status === 200) total = offset;
      } finally { clearTimeout(timer); }
    } while (offset < total);
    const type = mime.split(';')[0].trim();
    const blob = new Blob(chunks, {type: type || 'video/mp4'}); chunks = [];
    const link = document.createElement('a');
    const blobUrl = URL.createObjectURL(blob);
    link.href = blobUrl;
    link.download = `telegram-video-${new Date().toISOString().replace(/[:.]/g,'-')}.${type.includes('webm') ? 'webm' : type.includes('quicktime') ? 'mov' : 'mp4'}`;
    document.documentElement.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 300000);
    report('Video handed to Chrome. Check your Downloads.');
  }
  function start() {
    if (busy) return {ok:false,error:'A video is already downloading. Check the Telegram tab.'};
    const video = chooseVideo();
    if (!video) return {ok:false,error:'No visible video found. Open the video and start playback first.'};
    if (video.mediaKeys) return {ok:false,error:'Encrypted media is not supported.'};
    busy = true;
    save(video).catch(error => report(error.name === 'AbortError' ? 'Download timed out. Start playback and retry.' : error.message.includes('fetch') ? 'This player uses a MediaSource stream that cannot be saved by this version. Try the other Telegram Web client (/a/ or /k/).' : error.message, true)).finally(() => {busy = false;});
    return {ok:true};
  }
  globalThis.__telegramVideoSaverV101 = {start};
  return start();
})();
