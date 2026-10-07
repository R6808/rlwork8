/* ============================================================
   study-room.js — 自习室查询与我的预约
   用到：DOM 动态渲染、表单筛选、本地存储（对应课堂作业四、五）
   ============================================================ */

(function () {
    'use strict';

    var feedback = document.querySelector('#feedback');
    var form = document.querySelector('#filter-form');
    var slotSelect = document.querySelector('#slot');
    var keywordInput = document.querySelector('#keyword');
    var statusSelect = document.querySelector('#status');
    var resetBtn = document.querySelector('#reset');
    var listBox = document.querySelector('#zone-list');
    var emptyTip = document.querySelector('#empty-tip');
    var favoriteSlot = document.querySelector('#favorite-slot');
    var saveSlotBtn = document.querySelector('#save-slot');
    var clearBtn = document.querySelector('#clear-bookings');
    var bookingList = document.querySelector('#booking-list');

    // 各时间段的上座率系数：用于把"基准空位数"换算成"该时段的空位数"
    // 数值越大表示人越多、空位越少。这样选不同时间段会看到不同结果。
    var SLOT_FACTOR = [1.00, 0.60, 1.00, 0.85, 0.45];

    var allZones = [];
    var allSlots = [];

    /* ---------- 按时间段估算空位 ---------- */
    function freeAt(zone, slotIndex) {
        var factor = SLOT_FACTOR[slotIndex] !== undefined ? SLOT_FACTOR[slotIndex] : 1;
        return Math.max(0, Math.floor(zone.free * factor));
    }

    /* ---------- 筛选逻辑 ---------- */
    function filterZones() {
        var slotIndex = Number(slotSelect.value);
        var keyword = keywordInput.value.trim();
        var wantStatus = statusSelect.value;

        return allZones
            .map(function (zone) {
                return {
                    name: zone.name,
                    total: zone.total,
                    free: freeAt(zone, slotIndex),
                    updated: zone.updated
                };
            })
            .filter(function (zone) {
                var status = Campus.getSeatStatus(zone);
                var matchKeyword = keyword === '' || zone.name.indexOf(keyword) !== -1;
                var matchStatus = wantStatus === 'all' || status.key === wantStatus;
                return matchKeyword && matchStatus;
            });
    }

    /* ---------- 渲染自习室卡片 ---------- */
    function renderZones(zones) {
        listBox.innerHTML = '';

        if (zones.length === 0) {
            emptyTip.hidden = false;
            return;
        }
        emptyTip.hidden = true;

        zones.forEach(function (zone) {
            var status = Campus.getSeatStatus(zone);
            var rate = Math.round((zone.free / zone.total) * 100);

            var col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-lg-4';

            var card = document.createElement('div');
            card.className = 'zone-card' + (status.key === 'full' ? ' is-full' : '');

            var head = document.createElement('div');
            head.className = 'd-flex justify-content-between align-items-start mb-1';

            var name = document.createElement('span');
            name.className = 'zone-name';
            name.textContent = zone.name;

            // 状态用"文字 + 颜色"双重表达，不只用颜色传达信息
            var badge = document.createElement('span');
            badge.className = 'badge ' + status.badge;
            badge.textContent = status.text;

            head.appendChild(name);
            head.appendChild(badge);

            var freeLine = document.createElement('div');
            freeLine.className = 'zone-meta';
            freeLine.textContent = '剩余 ' + zone.free + ' / ' + zone.total + ' 个座位（空位率 ' + rate + '%）';

            var updLine = document.createElement('div');
            updLine.className = 'zone-meta';
            updLine.textContent = '数据更新于 ' + zone.updated;

            var bar = document.createElement('div');
            bar.className = 'progress mt-2';
            bar.style.height = '6px';
            var barInner = document.createElement('div');
            barInner.className = 'progress-bar';
            barInner.style.width = rate + '%';
            bar.appendChild(barInner);

            var bookBtn = document.createElement('button');
            bookBtn.type = 'button';
            bookBtn.className = 'btn btn-sm btn-outline-primary mt-3 w-100';
            bookBtn.textContent = '加入我的预约';
            bookBtn.disabled = status.key === 'full';
            if (status.key === 'full') {
                bookBtn.textContent = '已满，暂不可预约';
            }
            bookBtn.addEventListener('click', function () {
                addBooking(zone.name, slotSelect.options[slotSelect.selectedIndex].text);
            });

            card.appendChild(head);
            card.appendChild(freeLine);
            card.appendChild(updLine);
            card.appendChild(bar);
            card.appendChild(bookBtn);
            col.appendChild(card);
            listBox.appendChild(col);
        });
    }

    /* ---------- 我的预约：本地存储 ---------- */
    function renderBookings() {
        var list = Campus.readBookings();
        bookingList.innerHTML = '';

        if (list.length === 0) {
            var empty = document.createElement('li');
            empty.className = 'list-group-item text-muted';
            empty.textContent = '还没有预约记录。可在上方保存常去时间段，或在卡片上点"加入我的预约"。';
            bookingList.appendChild(empty);
            return;
        }

        list.forEach(function (item, index) {
            var li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';

            var text = document.createElement('span');
            text.textContent = item.type === 'slot'
                ? '常去时间段：' + item.value
                : '预约：' + item.value + '（' + item.slot + '）';

            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'btn btn-sm btn-outline-danger';
            del.textContent = '移除';
            del.addEventListener('click', function () {
                var current = Campus.readBookings();
                current.splice(index, 1);
                Campus.saveBookings(current);
                renderBookings();
                Campus.setFeedback(feedback, '已移除 1 条记录。', false);
            });

            li.appendChild(text);
            li.appendChild(del);
            bookingList.appendChild(li);
        });
    }

    function addBooking(zoneName, slotText) {
        var list = Campus.readBookings();

        var exists = list.some(function (item) {
            return item.type === 'zone' && item.value === zoneName && item.slot === slotText;
        });

        if (exists) {
            Campus.setFeedback(feedback, '「' + zoneName + ' · ' + slotText + '」已经在你的预约里了。', true);
            return;
        }

        list.push({ type: 'zone', value: zoneName, slot: slotText });

        if (Campus.saveBookings(list)) {
            renderBookings();
            Campus.setFeedback(feedback, '已加入我的预约：' + zoneName + '（' + slotText + '）。刷新页面也不会丢。', false);
        } else {
            Campus.setFeedback(feedback, '本地保存失败，可能是浏览器禁用了本地存储。', true);
        }
    }

    /* ---------- 填充下拉框 ---------- */
    function fillSelect(select, slots) {
        select.innerHTML = '';
        slots.forEach(function (slot, index) {
            var option = document.createElement('option');
            option.value = String(index);
            option.textContent = slot;
            select.appendChild(option);
        });
    }

    /* ---------- 初始化 ---------- */
    function init(data) {
        allZones = data.zones || [];
        allSlots = data.seatSlots || [];

        fillSelect(slotSelect, allSlots);
        fillSelect(favoriteSlot, allSlots);

        // 若本地存过"常去时间段"，默认选中它
        var saved = Campus.readBookings().filter(function (item) { return item.type === 'slot'; });
        if (saved.length > 0) {
            var idx = allSlots.indexOf(saved[saved.length - 1].value);
            if (idx >= 0) {
                slotSelect.value = String(idx);
                favoriteSlot.value = String(idx);
            }
        }

        renderZones(filterZones());
        renderBookings();
        Campus.setFeedback(feedback, '数据加载成功：共 ' + allZones.length + ' 个自习室区域。', false);
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        renderZones(filterZones());
    });

    // 下拉框与关键字变化时即时刷新，体验更顺畅
    statusSelect.addEventListener('change', function () { renderZones(filterZones()); });
    keywordInput.addEventListener('input', function () { renderZones(filterZones()); });

    resetBtn.addEventListener('click', function () {
        keywordInput.value = '';
        statusSelect.value = 'all';
        slotSelect.value = '0';
        renderZones(filterZones());
        Campus.setFeedback(feedback, '筛选条件已重置。', false);
    });

    saveSlotBtn.addEventListener('click', function () {
        var slotText = favoriteSlot.options[favoriteSlot.selectedIndex].text;
        var list = Campus.readBookings().filter(function (item) {
            return !(item.type === 'slot' && item.value === slotText);
        });
        list.push({ type: 'slot', value: slotText });

        if (Campus.saveBookings(list)) {
            renderBookings();
            Campus.setFeedback(feedback, '已保存常去时间段：' + slotText + '，下次打开会自动选中。', false);
        }
    });

    clearBtn.addEventListener('click', function () {
        if (!window.confirm('确定清空全部本地预约记录吗？')) {
            return;
        }
        Campus.saveBookings([]);
        renderBookings();
        Campus.setFeedback(feedback, '本地预约记录已清空。', false);
    });

    Campus.loadCampusData()
        .then(init)
        .catch(function (error) {
            console.error('自习室数据加载失败：', error);
            Campus.setFeedback(feedback, '数据加载失败，请检查 data/data.json 是否存在。', true);
            listBox.innerHTML = '';
            emptyTip.hidden = false;
        });
})();
