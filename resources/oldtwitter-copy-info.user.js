// ==UserScript==
// @name         OldTwitter - Copy Tweet Info (with media)
// @namespace    https://github.com/notoiro
// @version      1.0.0
// @description  Adds a button to each tweet in OldTwitter that copies the tweet's text, author, media URLs and permalink to the clipboard.
// @author       notoiro
// @match        https://twitter.com/*
// @match        https://x.com/*
// @match        https://mobile.twitter.com/*
// @match        https://mobile.x.com/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // OldTwitter completely replaces the page and renders tweets asynchronously,
    // long after document-idle, so we watch the DOM instead of running once.
    const PROCESSED_ATTR = 'data-cti-processed';

    function copyToClipboard(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
            return Promise.resolve();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        throw new Error("clipboard");
        // Fallback for very old / restricted contexts
        // const ta = document.createElement('textarea');
        // ta.value = text;
        // ta.style.position = 'fixed';
        // ta.style.opacity = '0';
        // document.body.appendChild(ta);
        // ta.select();
        // try { document.execCommand('copy'); } finally { ta.remove(); }
        // return Promise.resolve();
    }

    function showToast(message, isError) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isError ? '#c0392b' : '#1a1a1a',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            zIndex: 999999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            opacity: '0',
            transition: 'opacity 0.15s ease',
            pointerEvents: 'none',
        });
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 200);
        }, 1800);
    }

    // Turns the rich tweet-body-text-span (which may contain <a> for links/hashtags/mentions
    // and <img> for emoji/hashflags) into plain readable text, keeping emoji alt text.
    function extractText(root) {
        // if (!root) return '';
        // const clone = root.cloneNode(true);
        // clone.querySelectorAll('img').forEach(img => {
        //     const alt = img.getAttribute('alt') || '';
        //     img.replaceWith(document.createTextNode(alt));
        // });
        // clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode('\n')));
        // return clone.textContent.replace(/\u00a0/g, ' ').trim();
    }

   function extractMedia(tweetEl) {
        const mediaContainer = tweetEl.querySelector(':scope > article.tweet-body > .tweet-media, :scope .tweet-media');
        if (!mediaContainer) return [];

        const items = [];
        const seenUrls = new Set();

        mediaContainer.querySelectorAll('video').forEach(video => {
            const poster = video.getAttribute('poster') || null;

            const sources = [];
            video.querySelectorAll('source').forEach(source => {
                const src = source.getAttribute('src') || source.src;
                if (src && !seenUrls.has(src)) sources.push(src);
            });
            if (video.currentSrc && !sources.includes(video.currentSrc)) {
                sources.unshift(video.currentSrc);
            }
            if (sources.length === 0) return; // nothing playable found

            sources.forEach(s => seenUrls.add(s));

            // Heuristic: Twitter GIFs are delivered as muted, looping <video> with no
            // native controls; real videos show the player controls. Adjust here if
            // OldTwitter ever adds an explicit class/attribute to distinguish them.
            const isGif = video.hasAttribute('loop') && !video.hasAttribute('controls');

            items.push({
                type: isGif ? 'gif' : 'video',
                url: sources[0],
                sources,
                poster,
            });
        });

        mediaContainer.querySelectorAll('img').forEach(img => {
            const src = img.currentSrc || img.getAttribute('src');
            if (src && !src.startsWith('data:') && !seenUrls.has(src)) {
                seenUrls.add(src);
                items.push({ type: 'image', url: src });
            }
        });

        return items;
    }

    function extractPermalink(tweetEl) {
        // "tweet-time" (timeline) or "tweet-date" (main tweet view) link to the permalink.
        const link = tweetEl.querySelector(':scope > a.tweet-time, :scope article.tweet-body > a.tweet-date, a.tweet-time, a.tweet-date');
        if (link && link.href) return link.href;
        return location.href.split('?')[0];
    }

    function buildTweetInfo(tweetEl) {
        const handleRaw = tweetEl.querySelector('.tweet-header-handle')?.textContent.trim() || '';
        const permalink = extractPermalink(tweetEl);
        const tweet_id = permalink.split('/').at(-1);
        const handle = handleRaw.startsWith('@') ? handleRaw : (handleRaw ? '@' + handleRaw : '');
        //const name = tweetEl.querySelector('.tweet-header-name')?.textContent.trim() || '';
        const media = extractMedia(tweetEl);

        const result = {
          user_id: handle,
          id: tweet_id,
          media: media,
        };

        return "TWEET_INFO\n" + JSON.stringify(result);
    }

    function makeButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cti-copy-btn';
        btn.title = 'Copy tweet info';
        btn.textContent = '📋';
        Object.assign(btn.style, {
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '26px',
            height: '26px',
            lineHeight: '26px',
            textAlign: 'center',
            fontSize: '13px',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            zIndex: 10,
            padding: '0',
        });
        return btn;
    }

    function addButtonToTweet(tweetEl) {
        if (tweetEl.hasAttribute(PROCESSED_ATTR)) return;
        tweetEl.setAttribute(PROCESSED_ATTR, '1');

        if (getComputedStyle(tweetEl).position === 'static') {
            tweetEl.style.position = 'relative';
        }

        const btn = makeButton();
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const info = buildTweetInfo(tweetEl);
                copyToClipboard(info)
                    .then(() => showToast('Tweet info copied ✅'))
                    .catch(() => showToast('Copy failed ❌', true));
            } catch (err) {
                console.error('[copy-tweet-info]', err);
                showToast('Copy failed ❌', true);
            }
        });

        tweetEl.appendChild(btn);
    }

    function scan(root) {
        (root.matches && root.matches('.tweet') ? [root] : [])
            .concat([...root.querySelectorAll('.tweet')])
            .forEach(addButtonToTweet);
    }

    scan(document.body);

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;
                scan(node);
            });
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
