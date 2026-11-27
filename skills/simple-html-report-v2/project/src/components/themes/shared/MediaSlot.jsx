// MediaSlot —— 所有主题共用的媒体槽(图片 / 视频占位)。主题页面需要放图时只用它,不自己实现。
//
// 运行在 deck 里时,媒体的读写经 MediaSlotContext 交给宿主(写进 deck 的 view-model,
// 参与撤销、保存和导出);脱离宿主单独预览时退回 localStorage。
// 外观只读主题 token(--theme-surface / --theme-line / --theme-accent / --theme-faint / --theme-font-sans),
// 不带任何主题专属样式。
//
// Props:
//   id          string   槽位 id,同一页内唯一(必填;以数字或 left/right/main 等结尾时对应固定的 images 下标)
//   placeholder string   空态文案                                   默认 'IMAGE'
//   fit         'cover' | 'contain'                                  默认 'cover'
//   radius      number   圆角(px)                                  默认 18
//   onAspect    (ratio:number) => void   媒体加载后回报宽高比
//   className   string   根节点附加类名

import React from 'react';

export const MediaSlotContext = React.createContext(null);

function slideIsActive(node) {
  const slide = node?.closest?.('.slide');
  if (!slide) return true;
  return slide.classList.contains('active') || slide.hasAttribute('data-deck-active');
}

// A slide that isn't on-stage shouldn't hold a live <video> — an inactive
// deck can have dozens of slides mounted at once (overview/adjacent
// preload), each with an uploaded video silently decoding in the
// background.
function useActiveMedia(ref) {
  const [active, setActive] = React.useState(false);
  React.useEffect(() => {
    const update = () => setActive(slideIsActive(ref.current));
    update();
    const slide = ref.current?.closest?.('.slide');
    if (!slide || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(update);
    observer.observe(slide, { attributes: true, attributeFilter: ['class', 'data-deck-active'] });
    return () => observer.disconnect();
  }, [ref]);
  return active;
}

function MediaSlot({ id, placeholder = 'IMAGE', fit = 'cover', radius = 18, onAspect, className = '' }) {
  const storeKey = id ? `media-slot:${id}` : null;
  const mediaHost = React.useContext(MediaSlotContext);
  const hasHostMedia = Boolean(mediaHost?.get || mediaHost?.set);
  const [localMedia, setLocalMedia] = React.useState(() => {
    if (hasHostMedia) return null;
    try { return storeKey ? readStoredMedia(localStorage.getItem(storeKey) || '') : null; } catch (e) { return null; }
  });
  // A host-bridged slot's media lives in the deck's view-model, not local
  // React state — read it fresh every render instead of mirroring it into
  // state via an effect. A host-driven prop update re-renders this
  // component synchronously (same tick), so state+effect mirroring lags by
  // a passive-effect flush — too slow for a release pass that reads DOM in
  // the same tick as the triggering prop change (e.g. adjacent preload).
  const media = hasHostMedia ? normalizeHostMedia(mediaHost?.get?.(id, 0)) : localMedia;
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const domActive = useActiveMedia(rootRef);
  // A host-bridged slot (client-runtime's keyed image bridge) exposes
  // isActive() reflecting the live `data-deck-active`/`.active` state at
  // render time — trust that directly instead of the DOM-observer
  // fallback, which only catches up one tick (a passive-effect flush)
  // after a host-driven re-render, too late for a synchronous release
  // pass that runs in the same tick as the preload transition.
  const mediaActive = mediaHost?.isActive ? mediaHost.isActive() !== false : domActive;
  // English decks show a neutral 'Upload' in the empty slot instead of the
  // per-page Chinese placeholder copy. SSR (no window) keeps the original.
  const isEn = typeof window !== 'undefined' && window.__deckI18n?.isEn;

  React.useEffect(() => { injectMediaSlotStyle(); }, []);

  // Re-read from localStorage when id changes (slots reused across counts
  // keep their own image). The host-bridged path needs no such effect —
  // `media` above already reads mediaHost fresh on every render.
  React.useEffect(() => {
    if (hasHostMedia) return;
    try { setLocalMedia(storeKey ? readStoredMedia(localStorage.getItem(storeKey) || '') : null); } catch (e) { /* noop */ }
  }, [storeKey, id, hasHostMedia]);

  const report = React.useCallback((item) => {
    if (!onAspect || !item?.src) return;
    if (item.kind === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.onloadedmetadata = () => {
        if (video.videoWidth && video.videoHeight) onAspect(video.videoWidth / video.videoHeight);
      };
      video.src = item.src;
      return;
    }
    const im = new Image();
    im.onload = () => onAspect(im.naturalWidth / im.naturalHeight);
    im.src = item.src;
  }, [onAspect]);

  const reportedSrcRef = React.useRef(null);
  React.useEffect(() => {
    if (!media?.src) return;
    const signature = `${media.kind || ''}:${media.src}`;
    if (reportedSrcRef.current === signature) return;
    reportedSrcRef.current = signature;
    report(media);
    // Only re-run when the actual media content changes; `report`'s identity
    // can churn on every render if the caller passes an inline `onAspect`,
    // which previously caused an image/video reload + onAspect call loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media?.src, media?.kind]);

  React.useEffect(() => {
    if (media?.kind !== 'video' || !mediaActive || !videoRef.current) return;
    const video = videoRef.current;
    video.muted = true;
    if (video.readyState < 2) video.load?.();
    video.play?.().catch(() => {});
    return () => {
      video.pause?.();
      video.removeAttribute?.('src');
      video.load?.();
    };
  }, [media?.kind, media?.src, mediaActive]);

  const save = (item) => {
    if (mediaHost?.set) {
      // Host-bridged: mediaHost.set writes into the view-model and triggers
      // a synchronous re-render of this slide, which re-reads `media` fresh
      // above — no local state to update.
      mediaHost.set(id, 0, item);
      return;
    }
    setLocalMedia(item);
    try {
      if (item && storeKey) localStorage.setItem(storeKey, JSON.stringify(item));
      else if (storeKey) localStorage.removeItem(storeKey);
    } catch (e) { /* quota */ }
  };

  const ingest = (file) => {
    if (!file || !/^(image|video)\//.test(file.type || '')) return;
    if (hasHostMedia && mediaHost?.drop) {
      mediaHost.drop(id, 0, file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const item = {
        src: url,
        type: file.type,
        kind: file.type.startsWith('video/') ? 'video' : 'image',
      };
      save(item);
    };
    reader.readAsDataURL(file);
  };

  const stopSlotNavigation = (e) => e.stopPropagation();
  const openPicker = (e) => {
    e.stopPropagation();
    inputRef.current && inputRef.current.click();
  };
  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); setOver(false); ingest(e.dataTransfer.files && e.dataTransfer.files[0]); };
  const clear = (e) => {
    e.stopPropagation();
    save(null);
  };

  return (
    <div ref={rootRef} className={`media-slot ${over ? 'is-over' : ''} ${media?.src ? 'is-filled' : ''} ${className}`}
         data-dashi-slot-id={id || undefined}
         style={{ borderRadius: radius }}
         onPointerDown={stopSlotNavigation}
         onMouseDown={stopSlotNavigation}
         onClick={openPicker}
         onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
         onDragLeave={(e) => { e.stopPropagation(); setOver(false); }}
         onDrop={onDrop}>
      {media?.src ? (
        <>
          {media.kind === 'video'
            ? (mediaActive
              ? <video key={media.src} ref={videoRef} className="media-slot-img" src={media.src} muted playsInline loop autoPlay preload="metadata" style={{ objectFit: fit }} />
              : <MediaSlotVideoPoster src={media.src} fit={fit} />)
            : <img className="media-slot-img" src={media.src} alt="" loading="lazy" decoding="async" style={{ objectFit: fit }} />}
          <button className="media-slot-clear" onClick={clear} aria-label="清除媒体">✕</button>
        </>
      ) : (
        <div className="media-slot-empty">
          <span className="media-slot-label">{isEn ? 'Upload' : placeholder}</span>
          <span className="media-slot-hint">点击或拖入媒体</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/*" hidden
             onClick={(e) => e.stopPropagation()}
             onChange={(e) => { ingest(e.target.files && e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}

function normalizeHostMedia(value) {
  if (!value) return null;
  if (typeof value === 'string') return { src: value, kind: looksLikeVideoSrc(value) ? 'video' : 'image' };
  if (typeof value === 'object') {
    const src = value.src || value.url || value.u;
    if (!src) return null;
    return {
      ...value,
      src,
      kind: value.kind || (String(value.type || src).startsWith('video/') || looksLikeVideoSrc(src) ? 'video' : 'image'),
    };
  }
  return null;
}

function readStoredMedia(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.src) return {
      ...parsed,
      kind: parsed.kind || (String(parsed.type || parsed.src).startsWith('video/') || looksLikeVideoSrc(parsed.src) ? 'video' : 'image'),
    };
  } catch {}
  return { src: raw, kind: looksLikeVideoSrc(raw) ? 'video' : 'image' };
}

function looksLikeVideoSrc(src) {
  return String(src || '').startsWith('data:video/')
    || /\.(mp4|m4v|mov|webm|ogv)(?:[?#].*)?$/i.test(String(src || ''));
}

function videoPosterSrc(src) {
  const s = String(src || '');
  return /\.(mp4|m4v|mov|webm|ogv)(?:[?#].*)?$/i.test(s)
    ? s.replace(/\.(mp4|m4v|mov|webm|ogv)(?:[?#].*)?$/i, '.poster.jpg')
    : '';
}

function MediaSlotVideoPoster({ src, fit }) {
  const poster = videoPosterSrc(src);
  return poster ? (
    <img className="media-slot-img" src={poster} alt="" loading="lazy" decoding="async" data-dashi-video-poster="true" style={{ objectFit: fit }} />
  ) : (
    <div className="media-slot-img" aria-hidden="true" data-dashi-video-poster="true" />
  );
}

function injectMediaSlotStyle() {
  if (document.getElementById('media-slot-style')) return;
  const s = document.createElement('style');
  s.id = 'media-slot-style';
  s.textContent = `
  .media-slot{position:relative;width:100%;height:100%;overflow:hidden;cursor:pointer;
    background:
      repeating-linear-gradient(135deg, rgba(0,0,0,.05) 0 2px, transparent 2px 11px),
      var(--theme-surface, #f2f2f2);
    box-shadow: inset 0 0 0 1px var(--theme-line, rgba(0,0,0,.14));
    transition:box-shadow .18s ease, background .18s ease;}
  .media-slot.is-over{box-shadow: inset 0 0 0 1.5px var(--theme-accent, #444444);}
  .media-slot.is-filled{background:var(--theme-surface,#f2f2f2);box-shadow:none;}
  .media-slot-img{position:absolute;inset:0;width:100%;height:100%;display:block;}
  .media-slot-empty{position:absolute;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:12px;text-align:center;padding:18px;}
  .media-slot-label{font-family:var(--theme-font-sans,system-ui,sans-serif);
    font-size:24px;letter-spacing:.16em;
    color:var(--theme-faint, rgba(0,0,0,.45));}
  .media-slot-hint{font-family:var(--theme-font-sans,system-ui,sans-serif);
    font-size:24px;letter-spacing:.04em;color:var(--theme-faint, rgba(0,0,0,.32));}
  .media-slot-clear{position:absolute;top:12px;right:12px;width:40px;height:40px;border:0;
    border-radius:50%;background:rgba(8,9,11,.55);color:#fff;font-size:24px;line-height:1;
    cursor:pointer;opacity:0;transition:opacity .15s ease;backdrop-filter:blur(6px);}
  .media-slot:hover .media-slot-clear{opacity:1;}
  `;
  document.head.appendChild(s);
}

export { MediaSlot };
export default MediaSlot;
