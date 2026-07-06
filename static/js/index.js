(() => {
  const VIEWER_CACHE_BUST = "20260705-scene6-cuplight";
  const SPLAT_VIEWER_PATH = "static/robosnap/viewers/scene-viewer.html";
  const VIEWER_DEBUG_SUFFIX = "";

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };

  ready(() => {
    setupScrollToTop();
    setupProgressSidebar();
    setupTabs();
    setupVideoPoster();
    setupLayerStackDemo();
    setupScenePairScroller();
    setupDataAugScroller();
    setupRobustRolloutScroller();
    setupSimRealScroller();
    setupSplatViewerControls();
    setupReplayMoreCases();
    setupPlaybackRates();
    setupCopyButtons();
  });

  function setupScrollToTop() {
    const button = document.querySelector(".scroll-to-top");
    if (!button) return;

    const update = () => {
      button.classList.toggle("visible", window.scrollY > 420);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function setupProgressSidebar() {
    const sidebar = document.querySelector(".progress-sidebar");
    const links = Array.from(document.querySelectorAll("[data-section-link]"));
    const sections = links
      .map((link) => document.getElementById(link.dataset.sectionLink))
      .filter(Boolean);

    if (!links.length || !sections.length) return;

    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.sectionLink === id);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActive(visible.target.id);
      },
      {
        root: null,
        rootMargin: "-24% 0px -58% 0px",
        threshold: [0.05, 0.2, 0.45, 0.7]
      }
    );

    sections.forEach((section) => observer.observe(section));

    const updateReadingProgress = () => {
      if (!sidebar) return;
      const root = document.documentElement;
      const scrollable = Math.max(1, root.scrollHeight - root.clientHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      sidebar.style.setProperty("--reading-progress", String(Math.round(progress * 1000) / 1000));
    };

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress, { passive: true });
    updateReadingProgress();
  }

  function setupTabs() {
    const tabLists = document.querySelectorAll("[data-tabs]");

    tabLists.forEach((tabList) => {
      const groupName = tabList.dataset.tabs;
      const buttons = Array.from(tabList.querySelectorAll("[data-tab-target]"));
      const panels = Array.from(document.querySelectorAll(`[data-tab-group="${groupName}"]`));

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.tabTarget;

          buttons.forEach((item) => {
            item.classList.toggle("is-active", item === button);
            item.setAttribute("aria-selected", item === button ? "true" : "false");
          });

          panels.forEach((panel) => {
            const isActive = panel.dataset.tabPanel === target;
            panel.classList.toggle("is-active", isActive);
            panel.hidden = !isActive;
          });
        });
      });
    });
  }

  function setupVideoPoster() {
    const poster = document.querySelector("[data-video-poster]");
    if (!poster) return;

    const button = poster.querySelector("button");
    const src = poster.dataset.videoSrc;
    if (!button || !src) return;

    button.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "RoboSnap video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      poster.replaceWith(iframe);
    }, { once: true });
  }

  function setupLayerStackDemo() {
    const demo = document.querySelector("[data-layer-demo]");
    const trigger = demo?.querySelector("[data-layer-trigger]");
    const output = demo?.querySelector(".layer-stack-output");
    const cards = Array.from(output?.querySelectorAll(".layer-card") || []);
    if (!demo || !trigger || !output || !cards.length) return;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smoothing = reducedMotion ? 1 : 0.2;
    let targetSpread = 0.58;
    let currentSpread = targetSpread;
    let rafId = 0;

    const renderLayers = (spreadValue) => {
      const center = (cards.length - 1) / 2;
      cards.forEach((card, index) => {
        const depth = index - center;
        const x = depth * 46 * spreadValue;
        const y = depth * -5 * spreadValue;
        const z = depth * 42 * spreadValue;
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(-42deg) rotateX(5deg)`;
      });
    };

    const animateLayers = () => {
      currentSpread += (targetSpread - currentSpread) * smoothing;

      if (Math.abs(targetSpread - currentSpread) < 0.001) {
        currentSpread = targetSpread;
      }

      renderLayers(currentSpread);
      rafId = currentSpread === targetSpread ? 0 : window.requestAnimationFrame(animateLayers);
    };

    const setTargetSpread = (value, instant = false) => {
      targetSpread = clamp(value);

      if (instant || reducedMotion) {
        currentSpread = targetSpread;
        renderLayers(currentSpread);
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }

      if (!rafId) {
        rafId = window.requestAnimationFrame(animateLayers);
      }
    };

    const setSpreadFromY = (clientY) => {
      const rect = output.getBoundingClientRect();
      if (!rect.height) return;
      setTargetSpread(1 - (clientY - rect.top) / rect.height);
    };

    const setExpanded = (expanded) => {
      demo.classList.toggle("is-expanded", expanded);
      trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
      output.setAttribute("aria-hidden", expanded ? "false" : "true");
      if (expanded) setTargetSpread(targetSpread);
    };

    trigger.addEventListener("click", () => {
      setExpanded(!demo.classList.contains("is-expanded"));
    });

    output.addEventListener("pointermove", (event) => {
      if (!demo.classList.contains("is-expanded")) return;
      const events = event.getCoalescedEvents?.() || [event];
      setSpreadFromY(events[events.length - 1].clientY);
    });

    output.addEventListener("wheel", (event) => {
      if (!demo.classList.contains("is-expanded")) return;
      event.preventDefault();
      const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? output.clientHeight
          : 1;
      const delta = clamp(event.deltaY * modeScale * 0.0009, -0.075, 0.075);
      setTargetSpread(targetSpread - delta);
    }, { passive: false });

    renderLayers(currentSpread);
  }

  function setupScenePairScroller() {
    const track = document.querySelector("[data-scene-pair-track]");
    if (!track) return;

    const cards = Array.from(track.querySelectorAll(".scene-pair-card"));
    const prev = document.querySelector("[data-scene-pair-prev]");
    const next = document.querySelector("[data-scene-pair-next]");
    const counter = document.getElementById("scene-pair-counter");
    let activeIndex = 0;
    let ticking = false;

    const scrollToIndex = (index) => {
      const targetIndex = Math.max(0, Math.min(cards.length - 1, index));
      const card = cards[targetIndex];
      if (!card) return;

      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft,
        behavior: "smooth"
      });
    };

    const update = () => {
      if (!cards.length) return;

      const nextIndex = cards.reduce((closest, card, index) => {
        const currentDistance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
        const closestDistance = Math.abs(cards[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
        return currentDistance < closestDistance ? index : closest;
      }, 0);

      activeIndex = nextIndex;
      if (counter) {
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      }
      if (prev) prev.disabled = activeIndex === 0;
      if (next) next.disabled = activeIndex === cards.length - 1;
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    prev?.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    next?.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function setupDataAugScroller() {
    const track = document.querySelector("[data-data-aug-track]");
    if (!track) return;

    const slides = Array.from(track.querySelectorAll(".data-aug-slide"));
    const prev = document.querySelector("[data-data-aug-prev]");
    const next = document.querySelector("[data-data-aug-next]");
    const counter = document.getElementById("data-aug-counter");
    let activeIndex = 0;
    let ticking = false;

    const scrollToIndex = (index) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[targetIndex];
      if (!slide) return;

      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: "smooth"
      });
    };

    const update = () => {
      if (!slides.length) return;

      const nextIndex = slides.reduce((closest, slide, index) => {
        const currentDistance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
        const closestDistance = Math.abs(slides[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
        return currentDistance < closestDistance ? index : closest;
      }, 0);

      activeIndex = nextIndex;
      if (counter) {
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      }
      if (prev) prev.disabled = activeIndex === 0;
      if (next) next.disabled = activeIndex === slides.length - 1;
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    prev?.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    next?.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function setupRobustRolloutScroller() {
    const track = document.querySelector("[data-robust-rollout-track]");
    if (!track) return;

    const slides = Array.from(track.querySelectorAll(".robust-rollout-slide"));
    const prev = document.querySelector("[data-robust-rollout-prev]");
    const next = document.querySelector("[data-robust-rollout-next]");
    const counter = document.getElementById("robust-rollout-counter");
    let activeIndex = 0;
    let ticking = false;

    const scrollToIndex = (index) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[targetIndex];
      if (!slide) return;

      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: "smooth"
      });
    };

    const update = () => {
      if (!slides.length) return;

      const nextIndex = slides.reduce((closest, slide, index) => {
        const currentDistance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
        const closestDistance = Math.abs(slides[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
        return currentDistance < closestDistance ? index : closest;
      }, 0);

      activeIndex = nextIndex;
      if (counter) {
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      }
      if (prev) prev.disabled = activeIndex === 0;
      if (next) next.disabled = activeIndex === slides.length - 1;
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    prev?.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    next?.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function setupSimRealScroller() {
    const track = document.querySelector("[data-sim-real-track]");
    if (!track) return;

    const slides = Array.from(track.querySelectorAll(".sim-real-slide"));
    const prev = document.querySelector("[data-sim-real-prev]");
    const next = document.querySelector("[data-sim-real-next]");
    const counter = document.getElementById("sim-real-counter");
    let activeIndex = 0;
    let ticking = false;

    const scrollToIndex = (index) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[targetIndex];
      if (!slide) return;

      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: "smooth"
      });
    };

    const update = () => {
      if (!slides.length) return;

      const nextIndex = slides.reduce((closest, slide, index) => {
        const currentDistance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
        const closestDistance = Math.abs(slides[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
        return currentDistance < closestDistance ? index : closest;
      }, 0);

      activeIndex = nextIndex;
      if (counter) {
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      }
      if (prev) prev.disabled = activeIndex === 0;
      if (next) next.disabled = activeIndex === slides.length - 1;
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    prev?.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    next?.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function setupSplatViewerControls() {
    const frame = document.getElementById("splat-viewer-frame");
    const title = document.getElementById("splat-viewer-title");
    const thumb = document.getElementById("splat-viewer-thumb-image");
    const thumbLabel = document.getElementById("splat-viewer-thumb-label");
    const tabs = Array.from(document.querySelectorAll(".splat-tab[data-splat-scene]"));
    const cardButtons = Array.from(document.querySelectorAll("[data-splat-open]"));

    if (!frame || !tabs.length) return;

    const sceneFromButton = (sceneId) => tabs.find((tab) => tab.dataset.splatScene === sceneId);

    const setScene = (sceneId, scrollToViewer = false) => {
      const tab = sceneFromButton(sceneId);
      if (!tab) return;

      const src = `${SPLAT_VIEWER_PATH}?scene=${encodeURIComponent(sceneId)}&v=${encodeURIComponent(VIEWER_CACHE_BUST)}${VIEWER_DEBUG_SUFFIX}`;
      if (!frame.src.endsWith(src)) frame.src = src;

      frame.title = `Interactive Gaussian splat viewer ${tab.textContent.trim()}`;
      if (title) title.textContent = tab.dataset.splatTitle || frame.title;
      if (thumb) {
        thumb.src = tab.dataset.splatThumb;
        thumb.alt = `Original RGB reference ${tab.textContent.trim()}`;
      }
      if (thumbLabel) thumbLabel.textContent = tab.textContent.trim();

      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (scrollToViewer) {
        document.getElementById("scenes")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => setScene(tab.dataset.splatScene));
    });

    cardButtons.forEach((button) => {
      button.addEventListener("click", () => setScene(button.dataset.splatOpen, true));
    });
  }

  function setupReplayMoreCases() {
    const button = document.querySelector("[data-replay-more-button]");
    const panel = document.querySelector("[data-replay-more-panel]");
    if (!button || !panel) return;

    let loaded = false;

    const loadVideos = () => {
      if (loaded) return;
      panel.querySelectorAll("source[data-src]").forEach((source) => {
        source.src = source.dataset.src;
        source.removeAttribute("data-src");
        source.closest("video")?.load();
      });
      loaded = true;
    };

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      if (expanded) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        button.textContent = "View more cases";
        return;
      }

      loadVideos();
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.textContent = "Hide cases";
    });
  }

  function setupPlaybackRates() {
    const videos = document.querySelectorAll("video[data-playback-rate]");

    videos.forEach((video) => {
      const rate = Number.parseFloat(video.dataset.playbackRate);
      if (!Number.isFinite(rate) || rate <= 0) return;

      const applyRate = () => {
        video.defaultPlaybackRate = rate;
        video.playbackRate = rate;
      };

      applyRate();
      video.addEventListener("loadedmetadata", applyRate);
      video.addEventListener("play", applyRate);
    });
  }

  function setupCopyButtons() {
    const buttons = document.querySelectorAll("[data-copy-target]");

    buttons.forEach((button) => {
      const originalText = button.textContent.trim();

      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target) return;

        const text = target.textContent;

        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }

        button.classList.add("is-copied");
        button.innerHTML = "<i class=\"fas fa-check\"></i><span>Copied</span>";

        window.setTimeout(() => {
          button.classList.remove("is-copied");
          button.innerHTML = `<i class="fas fa-copy"></i><span>${originalText.replace(/^.*Copy$/, "Copy")}</span>`;
        }, 1800);
      });
    });
  }
})();
