/* ==========================================================================
   ITALICA — карточка товара (1С-Битрикс, ФЕНИКС)
   Дополнение к product-card.css. Верстка не меняется, только поведение.
   Никаких внешних зависимостей: если на сайте подключён GSAP — он будет
   использован для мягкого появления блоков, если нет — сработают CSS-переходы.

   Что делает:
     1. берёт фирменный цвет сайта (фон кнопки «В корзину») и подставляет его
        в акцент карточки, чтобы она не спорила с остальным сайтом;
     2. расставляет тона наличия (есть / мало / нет) по тексту блока;
     3. включает счётчик «03 / 08» в галерее и следит за сменой слайда;
     4. включает «липкую» панель покупки, только если она влезает в экран;
     5. мягко проявляет блоки при прокрутке;
     6. переворачивает стрелку у «Показать все».
   ========================================================================== */
(function () {
    'use strict';

    var D = document;
    var root = D.documentElement;

    /* класс-флаг: скрывать блоки до появления разрешено только если JS живой */
    root.classList.add('ital-js');

    var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var HAS_GSAP = !!window.gsap && !REDUCED;

    function ready(fn) {
        if (D.readyState !== 'loading') { fn(); }
        else { D.addEventListener('DOMContentLoaded', fn); }
    }

    function debounce(fn, wait) {
        var t;
        return function () {
            var args = arguments, ctx = this;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(ctx, args); }, wait || 120);
        };
    }

    /* ---------------------------------------------------------------- 1 */
    /* Акцент = фирменный цвет шаблона */
    function pickAccent() {
        var el = D.querySelector('#main .add2basket') ||
                 D.querySelector('#main .main-color') ||
                 D.querySelector('.add2basket');
        if (!el) { return; }

        var bg = getComputedStyle(el).backgroundColor || '';
        var m = bg.match(/rgba?\(([^)]+)\)/i);
        if (!m) { return; }

        var p = m[1].split(',').map(function (v) { return parseFloat(v); });
        if (p.length < 3 || isNaN(p[0])) { return; }
        if (p.length > 3 && p[3] === 0) { return; }              /* transparent */

        var lum = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
        if (lum > 0.78 || lum < 0.04) { return; }                /* слишком светлый или чёрный */

        var hex = '#' + p.slice(0, 3).map(function (v) {
            return ('0' + Math.round(v).toString(16)).slice(-2);
        }).join('');

        root.style.setProperty('--ital-accent', hex);
        root.style.setProperty('--ital-accent-soft', 'rgba(' + Math.round(p[0]) + ',' + Math.round(p[1]) + ',' + Math.round(p[2]) + ',.10)');
    }

    /* ---------------------------------------------------------------- 2 */
    /* Тон наличия */
    function toneAvailability() {
        var nodes = D.querySelectorAll('#main .detail-available');
        Array.prototype.forEach.call(nodes, function (node) {
            var text = (node.textContent || '').toLowerCase();
            var tone = 'ital-ok';

            if (/нет в наличи|нет$|отсутств|снят|заверш|недоступ/.test(text)) { tone = 'ital-bad'; }
            else if (/мало|заканчив|последн|уточн|под заказ|ожида/.test(text)) { tone = 'ital-warn'; }

            node.classList.remove('ital-ok', 'ital-warn', 'ital-bad');
            node.classList.add(tone);
        });
    }

    /* ---------------------------------------------------------------- 3 */
    /* Счётчик галереи 03 / 08 */
    function galleryCounter() {
        var wrap = D.querySelector('#main .info-left-side .wrapper-picture');
        if (!wrap) { return; }

        function update() {
            var slides = wrap.querySelectorAll('.big-picture');
            if (!slides.length) { return; }

            var index = 0;
            Array.prototype.forEach.call(slides, function (slide, i) {
                if (slide.classList.contains('active')) { index = i; }
            });

            wrap.classList.add('ital-counter');
            wrap.style.setProperty(
                '--ital-counter',
                '"' + ('0' + (index + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2) + '"'
            );
        }

        update();
        wrap.addEventListener('click', function () { setTimeout(update, 0); });

        if (window.MutationObserver) {
            new MutationObserver(debounce(update, 60)).observe(wrap, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    /* ---------------------------------------------------------------- 4 */
    /* Липкая панель покупки: включаем, только если она влезает в экран */
    function stickyPanel() {
        var panel = D.querySelector('#main .info-right-side .info-right-side-inner');
        if (!panel) { return; }

        function update() {
            var h = panel.offsetHeight;
            var fits = h > 0 && h < (window.innerHeight - 90);
            panel.classList.toggle('ital-sticky', fits);
        }

        update();
        window.addEventListener('resize', debounce(update, 150));
        window.addEventListener('load', update);

        if (window.MutationObserver) {
            new MutationObserver(debounce(update, 150)).observe(panel, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
    }

    /* ---------------------------------------------------------------- 5 */
    /* Мягкое появление блоков */
    function revealBlocks() {
        var items = Array.prototype.slice.call(
            D.querySelectorAll('#main .catalog-item, #chars, #similar, #accessory, #news_list')
        );
        if (!items.length) { return; }

        if (REDUCED || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('ital-in'); });
            return;
        }

        if (HAS_GSAP) {
            items.forEach(function (el) {
                el.classList.add('ital-in');                 /* CSS-анимацию отключаем */
                window.gsap.set(el, { opacity: 0, y: 14 });
            });
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                var el = entry.target;

                if (HAS_GSAP) {
                    window.gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
                } else {
                    el.classList.add('ital-in');
                }
                io.unobserve(el);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.02 });

        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------------------------------------------------------------- 6 */
    /* Стрелка у «Показать все» */
    function showHiddenToggles() {
        D.addEventListener('click', function (e) {
            var target = e.target || e.srcElement;
            var link = target && target.closest ? target.closest('.show-hidden') : null;
            if (!link) { return; }
            link.classList.toggle('open');
        });
    }

    /* ---------------------------------------------------------------- run */
    ready(function () {
        pickAccent();
        toneAvailability();
        galleryCounter();
        stickyPanel();
        revealBlocks();
        showHiddenToggles();

        /* ФЕНИКС при выборе торгового предложения перерисовывает часть блоков
           аяксом — держим слушателей в актуальном состоянии */
        var main = D.getElementById('main');
        if (main && window.MutationObserver) {
            new MutationObserver(debounce(function () {
                pickAccent();
                toneAvailability();
            }, 200)).observe(main, { childList: true, subtree: true });
        }
    });
})();
