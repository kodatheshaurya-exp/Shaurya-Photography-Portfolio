/* ==========================================================================
   PORTFOLIO — shared behavior
   Nav scroll state, mobile menu, reveal-on-scroll, lightbox, filters, BA slider
   ========================================================================== */
(function(){
  "use strict";

  /* ---------- Hero: shuffle between best/favourite photographs ---------- */
  var heroMedia = document.querySelector('.hero-media');
  if(heroMedia){
    var heroImgs = Array.prototype.slice.call(heroMedia.querySelectorAll('img'));
    if(heroImgs.length > 1){
      // Fisher–Yates shuffle on the array, then reappend in that order —
      // appendChild on an existing node moves it, so this reorders the
      // DOM to match a fresh random running order on every page load.
      for(var k = heroImgs.length - 1; k > 0; k--){
        var j = Math.floor(Math.random() * (k + 1));
        var t = heroImgs[k]; heroImgs[k] = heroImgs[j]; heroImgs[j] = t;
      }
      heroImgs.forEach(function(img){ heroMedia.appendChild(img); });

      var heroCaptionEl = document.querySelector('.hero-caption');
      var heroCurrent = 0;
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function showHero(idx){
        heroImgs.forEach(function(img, i){ img.classList.toggle('is-active', i === idx); });
        if(heroCaptionEl){
          var cap = heroImgs[idx].getAttribute('data-caption');
          if(cap) heroCaptionEl.textContent = cap;
        }
      }
      showHero(0);

      if(!reduceMotion){
        setInterval(function(){
          heroCurrent = (heroCurrent + 1) % heroImgs.length;
          showHero(heroCurrent);
        }, 5000);
      }
    } else if(heroImgs.length === 1){
      heroImgs[0].classList.add('is-active');
    }
  }

  /* ---------- Nav: solid on scroll ---------- */
  var nav = document.querySelector('.site-nav');
  function onScrollNav(){
    if(!nav) return;
    if(window.scrollY > 40) nav.classList.add('is-solid');
    else nav.classList.remove('is-solid');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;
  if(toggle){
    toggle.addEventListener('click', function(){
      var isOpen = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-panel a').forEach(function(a){
      a.addEventListener('click', function(){
        body.classList.remove('nav-open');
        document.documentElement.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll (single, restrained) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- Lazy-loaded thumbnails ----------
     Images use data-src + IntersectionObserver so nothing off-screen
     downloads until it's about to enter the viewport. Combined with
     loading="lazy" as a native fallback. */
  var lazyImgs = document.querySelectorAll('img[data-src]');
  if('IntersectionObserver' in window && lazyImgs.length){
    var lazyIO = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '400px 0px' });
    lazyImgs.forEach(function(img){ lazyIO.observe(img); });
  } else {
    lazyImgs.forEach(function(img){ img.src = img.getAttribute('data-src'); });
  }

  /* ==========================================================================
     LIGHTBOX
     Any element with [data-lightbox] wraps a list of <a data-full data-caption>
     that trigger a shared fullscreen viewer.
     ========================================================================== */
  var lb = document.querySelector('.lightbox');
  if(lb){
    var lbImg1 = lb.querySelector('.lb-img-a');
    var lbImg2 = lb.querySelector('.lb-img-b');
    var activeImg = lbImg1;
    var lbCaption = lb.querySelector('.lb-caption');
    var lbMeta = lb.querySelector('.lb-meta');
    var lbExif = lb.querySelector('.lb-exif');
    var lbCount = lb.querySelector('.lb-count');
    var closeBtn = lb.querySelector('.lb-close');
    var prevBtn = lb.querySelector('.lb-prev');
    var nextBtn = lb.querySelector('.lb-next');
    var stage = lb.querySelector('.lb-stage');

    var items = [];
    var currentIndex = 0;
    var lastFocused = null;

    function collectItems(){
      items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox] a[data-full]'));
    }
    collectItems();

    function showIndex(i){
      if(!items.length) return;
      currentIndex = (i + items.length) % items.length;
      var el = items[currentIndex];
      var full = el.getAttribute('data-full');
      var caption = el.getAttribute('data-caption') || '';
      var meta = el.getAttribute('data-meta') || '';
      var exif = el.getAttribute('data-exif') || '';
      var alt = el.getAttribute('data-alt') || caption || 'Photograph';

      var incoming = activeImg === lbImg1 ? lbImg2 : lbImg1;
      var outgoing = activeImg;

      incoming.src = full;
      incoming.alt = alt;
      incoming.onload = function(){
        incoming.classList.add('is-shown');
        outgoing.classList.remove('is-shown');
      };
      activeImg = incoming;

      lbCaption.textContent = caption;
      lbMeta.textContent = meta;
      if(lbExif){
        lbExif.textContent = exif;
        lbExif.style.display = exif ? 'inline-block' : 'none';
      }
      lbCount.textContent = (currentIndex + 1) + ' / ' + items.length;
    }

    function openLightbox(index){
      collectItems();
      lastFocused = document.activeElement;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      showIndex(index);
      closeBtn.focus();
    }
    function closeLightbox(){
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      lbImg1.classList.remove('is-shown');
      lbImg2.classList.remove('is-shown');
      lbImg1.removeAttribute('src');
      lbImg2.removeAttribute('src');
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.addEventListener('click', function(e){
      var link = e.target.closest('[data-lightbox] a[data-full]');
      if(link){
        e.preventDefault();
        collectItems();
        var idx = items.indexOf(link);
        openLightbox(idx < 0 ? 0 : idx);
      }
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', function(){ showIndex(currentIndex + 1); });
    prevBtn.addEventListener('click', function(){ showIndex(currentIndex - 1); });

    lb.addEventListener('click', function(e){
      if(e.target === lb){ closeLightbox(); }
    });

    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('is-open')) return;
      if(e.key === 'Escape') closeLightbox();
      else if(e.key === 'ArrowRight') showIndex(currentIndex + 1);
      else if(e.key === 'ArrowLeft') showIndex(currentIndex - 1);
    });

    /* touch swipe */
    var touchStartX = null;
    stage.addEventListener('touchstart', function(e){
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', function(e){
      if(touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 44){
        if(dx < 0) showIndex(currentIndex + 1);
        else showIndex(currentIndex - 1);
      }
      touchStartX = null;
    }, { passive: true });
  }

  /* ==========================================================================
     PROJECT GALLERY VIEW SWITCH (notes vs. images-only)
     ========================================================================== */
  document.querySelectorAll('.gallery-switch').forEach(function(sw){
    var wrap = sw.closest('.gallery-view-wrap');
    var gallery = wrap && wrap.querySelector('.project-gallery');
    if(!gallery) return;
    var buttons = sw.querySelectorAll('.switch-btn');
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        buttons.forEach(function(b){ b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed','true');
        gallery.setAttribute('data-view', btn.getAttribute('data-view-btn'));
      });
    });
  });

  /* ==========================================================================
     ALL-WORK FILTER
     ========================================================================== */
  var filterBar = document.querySelector('.filter-bar');
  if(filterBar){
    var chips = filterBar.querySelectorAll('.filter-chip');
    var cells = document.querySelectorAll('.grid-allwork .cell');
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.classList.remove('is-active'); c.setAttribute('aria-pressed','false'); });
        chip.classList.add('is-active');
        chip.setAttribute('aria-pressed','true');
        var genre = chip.getAttribute('data-filter');
        cells.forEach(function(cell){
          var match = genre === 'all' || cell.getAttribute('data-genre') === genre;
          cell.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ==========================================================================
     BEFORE / AFTER SLIDER
     ========================================================================== */
  document.querySelectorAll('.ba-slider').forEach(function(slider){
    var dragging = false;

    function setReveal(pct){
      pct = Math.min(Math.max(pct, 0), 100);
      slider.style.setProperty('--reveal', pct + '%');
      slider.setAttribute('aria-valuenow', String(Math.round(pct)));
    }

    function setPos(clientX){
      var rect = slider.getBoundingClientRect();
      var x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      setReveal((x / rect.width) * 100);
    }

    slider.addEventListener('pointerdown', function(e){
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      setPos(e.clientX);
    });
    slider.addEventListener('pointermove', function(e){
      if(dragging) setPos(e.clientX);
    });
    slider.addEventListener('pointerup', function(){ dragging = false; });
    slider.addEventListener('pointercancel', function(){ dragging = false; });

    /* keyboard access */
    slider.setAttribute('tabindex', '0');
    slider.setAttribute('role', 'slider');
    slider.setAttribute('aria-label', 'Before and after comparison slider');
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '100');
    slider.setAttribute('aria-valuenow', '50');
    slider.addEventListener('keydown', function(e){
      var current = parseFloat(getComputedStyle(slider).getPropertyValue('--reveal')) || 50;
      var step = 5;
      if(e.key === 'ArrowLeft'){ current = Math.max(0, current - step); }
      else if(e.key === 'ArrowRight'){ current = Math.min(100, current + step); }
      else { return; }
      e.preventDefault();
      setReveal(current);
    });
  });

  /* footer year */
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

})();
