/* ============================================================
   home.js — 首页数据概览
   数据来源：data/data.json（与看板、自习室页同一份，保证数字一致）
   ============================================================ */

(function () {
    'use strict';

    var feedback = document.querySelector('#feedback');
    var elZones = document.querySelector('#stat-zones');
    var elFree = document.querySelector('#stat-free');
    var elTotal = document.querySelector('#stat-total');
    var elAvg = document.querySelector('#stat-avg');

    function setText(el, text, unit) {
        el.textContent = '';
        el.appendChild(document.createTextNode(String(text)));
        if (unit) {
            var span = document.createElement('span');
            span.className = 'unit';
            span.textContent = unit;
            el.appendChild(span);
        }
    }

    function renderStats(data) {
        var zones = data.zones || [];
        var activities = data.activities || [];

        var totalFree = zones.reduce(function (sum, z) { return sum + z.free; }, 0);
        var totalSeat = zones.reduce(function (sum, z) { return sum + z.total; }, 0);

        var avgIndex = activities.length
            ? activities.reduce(function (sum, a) { return sum + a.value; }, 0) / activities.length
            : 0;

        setText(elZones, zones.length, ' 个');
        setText(elFree, totalFree, ' 个');
        setText(elTotal, totalSeat, ' 个');
        setText(elAvg, avgIndex.toFixed(1));

        Campus.setFeedback(feedback,
            '数据加载成功：' + zones.length + ' 个区域，' + activities.length + ' 条场所记录（更新于 '
            + (data.meta && data.meta.updated ? data.meta.updated : '未知') + '）。', false);
    }

    function renderError(message) {
        setText(elZones, '—', '');
        setText(elFree, '—', '');
        setText(elTotal, '—', '');
        setText(elAvg, '—', '');
        Campus.setFeedback(feedback, message, true);
    }

    Campus.loadCampusData()
        .then(renderStats)
        .catch(function (error) {
            console.error('首页数据加载失败：', error);
            renderError('数据加载失败，请检查 data/data.json 是否存在，或用本地服务器方式重新打开页面。');
        });
})();
