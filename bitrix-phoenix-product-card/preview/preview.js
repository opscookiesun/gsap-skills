/* ==========================================================================
   ТОЛЬКО ДЛЯ ПРЕДПРОСМОТРА.
   Имитирует поведение ФЕНИКС: переключение слайдов галереи, счётчик
   количества, «Показать все» в характеристиках. В Битрикс не загружать —
   там это делает ядро шаблона.
   ========================================================================== */
(function () {
    'use strict';

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) { return; }

        /* --- превью галереи --- */
        var thumb = t.closest('.small-picture');
        if (thumb) {
            var wrap = thumb.closest('.wrapper-picture');
            if (!wrap) { return; }
            var id = thumb.getAttribute('data-value');

            Array.prototype.forEach.call(wrap.querySelectorAll('.small-picture'), function (n) {
                n.classList.remove('active');
            });
            Array.prototype.forEach.call(wrap.querySelectorAll('.big-picture'), function (n) {
                n.classList.toggle('active', n.getAttribute('data-id') === id);
            });
            thumb.classList.add('active');
            return;
        }

        /* --- количество --- */
        var input = document.querySelector('#main .product-item-amount-field');
        var plus = t.closest('.product-item-amount-field-btn-plus');
        var minus = t.closest('.product-item-amount-field-btn-minus');
        if (input && (plus || minus)) {
            var v = parseInt(input.value, 10) || 1;
            v = plus ? v + 1 : Math.max(1, v - 1);
            input.value = v;

            var total = document.querySelector('#main .total-value');
            if (total) {
                total.textContent = (7275 * v).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
            }
            return;
        }

        /* --- «Показать все» --- */
        var sh = t.closest('.show-hidden');
        if (sh) {
            var parent = sh.closest('.show-hidden-parent');
            if (!parent) { return; }
            var opened = sh.classList.contains('open');
            Array.prototype.forEach.call(parent.querySelectorAll('.show-hidden-child'), function (n) {
                n.classList.toggle('hidden', !opened);
            });
            sh.querySelector('span').textContent = opened ? 'Показать все' : 'Свернуть';
            return;
        }
    });
})();
