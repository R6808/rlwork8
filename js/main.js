/* ============================================================
   main.js — 全站公共逻辑
   职责边界：只放"多个页面都要用"的东西，页面自己的逻辑放各自的 js 文件。
   加载顺序：Bootstrap → ECharts/jQuery（如需要）→ main.js → 页面脚本
   ============================================================ */

(function () {
    'use strict';

    var DATA_URL = 'data/data.json';

    /* ---------- 1. 导航高亮 ----------
       按当前文件名给对应导航项加 active 类，让"当前在哪一页"一目了然。 */
    function markActiveNav() {
        var here = location.pathname.split('/').pop() || 'home.html';
        var links = document.querySelectorAll('.campus-navbar .nav-link');

        for (var i = 0; i < links.length; i++) {
            var target = links[i].getAttribute('href');
            if (target === here) {
                links[i].classList.add('active');
                links[i].setAttribute('aria-current', 'page');
            }
        }
    }

    /* ---------- 2. 座位状态判定 ----------
       把"剩余座位数"翻译成三档状态。
       注意：返回的 text 是文字，调用方还会配颜色，做到"不只用颜色传达信息"。 */
    function getSeatStatus(zone) {
        if (zone.free <= 0) {
            return { key: 'full', text: '已满', badge: 'badge-full' };
        }
        if (zone.free / zone.total < 0.25) {
            return { key: 'few', text: '紧张', badge: 'badge-few' };
        }
        return { key: 'free', text: '充足', badge: 'badge-free' };
    }

    /* ---------- 3. 统一数据加载 ----------
       所有页面都通过这个函数取数据，失败时给出可读提示而不是白屏。 */
    function loadCampusData() {
        return fetch(DATA_URL).then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        });
    }

    /* ---------- 4. 反馈条 ---------- */
    function setFeedback(el, message, isError) {
        if (!el) { return; }
        el.textContent = message;
        el.className = isError ? 'feedback-error' : 'feedback-ok';
    }

    /* ---------- 5. 分级统计（成绩 → A~F） ---------- */
    function toGrade(score) {
        if (score >= 90) { return 'A'; }
        if (score >= 80) { return 'B'; }
        if (score >= 70) { return 'C'; }
        if (score >= 60) { return 'D'; }
        return 'F';
    }

    function cleanScores(list) {
        return list.filter(function (item) {
            return item.score >= 0 && item.score <= 100;
        });
    }

    function average(list) {
        if (list.length === 0) { return 0; }
        var total = list.reduce(function (sum, item) {
            return sum + item.score;
        }, 0);
        return Number((total / list.length).toFixed(2));
    }

    function gradeCount(list) {
        var result = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        list.forEach(function (item) {
            result[toGrade(item.score)]++;
        });
        return result;
    }

    /* ---------- 6. 本地存储（我的预约） ---------- */
    var STORAGE_KEY = 'campus-bookings';

    function readBookings() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            // 存储内容被人为改坏时不至于让整个页面崩掉
            console.warn('本地预约数据解析失败，已重置：', err.message);
            return [];
        }
    }

    function saveBookings(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            return true;
        } catch (err) {
            console.error('本地保存失败：', err.message);
            return false;
        }
    }

    /* ---------- 对外暴露 ---------- */
    window.Campus = {
        DATA_URL: DATA_URL,
        loadCampusData: loadCampusData,
        getSeatStatus: getSeatStatus,
        setFeedback: setFeedback,
        toGrade: toGrade,
        cleanScores: cleanScores,
        average: average,
        gradeCount: gradeCount,
        readBookings: readBookings,
        saveBookings: saveBookings,
        STORAGE_KEY: STORAGE_KEY
    };

    document.addEventListener('DOMContentLoaded', markActiveNav);
})();
