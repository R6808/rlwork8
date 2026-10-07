/* ============================================================
   dashboard.js — 校园场所使用指数看板
   用到：ECharts 图表、jQuery 交互、fetch 数据加载（课堂作业六）
   ============================================================ */

(function () {
    'use strict';

    var feedback = document.querySelector('#feedback');
    var zoneTable = document.querySelector('#zone-table');

    var allData = [];
    var barChart = null;
    var pieChart = null;

    /* ---------- 图表初始化 ----------
       注意：同一个容器重复 init 会"叠影"，所以先判断有没有实例。 */
    function ensureCharts() {
        var barEl = document.querySelector('#bar-chart');
        var pieEl = document.querySelector('#pie-chart');

        if (!barChart && barEl) {
            barChart = echarts.getInstanceByDom(barEl) || echarts.init(barEl);
        }
        if (!pieChart && pieEl) {
            pieChart = echarts.getInstanceByDom(pieEl) || echarts.init(pieEl);
        }
    }

    /* ---------- 按类型聚合，用于饼图 ---------- */
    function groupByType(list) {
        var map = {};
        list.forEach(function (item) {
            map[item.type] = (map[item.type] || 0) + item.value;
        });
        return Object.keys(map).map(function (type) {
            return { name: type, value: map[type] };
        });
    }

    /* ---------- 渲染图表 ---------- */
    function renderCharts(list) {
        ensureCharts();

        if (!barChart || !pieChart) {
            Campus.setFeedback(feedback, '图表容器未找到，页面结构可能被改动过。', true);
            return;
        }

        if (list.length === 0) {
            barChart.clear();
            pieChart.clear();
            Campus.setFeedback(feedback, '当前筛选条件下没有数据，图表已清空。', false);
            return;
        }

        barChart.setOption({
            title: { text: '校园各场所使用指数', left: 'center', textStyle: { fontSize: 15 } },
            tooltip: { trigger: 'axis' },
            grid: { left: 60, right: 24, top: 60, bottom: 70 },
            xAxis: {
                type: 'category',
                name: '场所',
                data: list.map(function (item) { return item.name; }),
                axisLabel: { interval: 0, rotate: 30, fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                name: '使用指数',
                max: 100
            },
            series: [{
                type: 'bar',
                data: list.map(function (item) { return item.value; }),
                barMaxWidth: 42,
                itemStyle: { color: '#0d6efd' },
                label: { show: true, position: 'top', fontSize: 11 }
            }]
        }, true);

        var pieData = groupByType(list);

        pieChart.setOption({
            title: { text: '各类型场所占比', left: 'center', textStyle: { fontSize: 15 } },
            tooltip: { trigger: 'item', formatter: '{b}：{c}（{d}%）' },
            legend: { bottom: 6 },
            series: [{
                type: 'pie',
                radius: ['40%', '65%'],
                center: ['50%', '52%'],
                data: pieData,
                label: { formatter: '{b}\n{d}%', fontSize: 11 }
            }]
        }, true);
    }

    /* ---------- 渲染自习室对应表 ---------- */
    function renderZoneTable(zones) {
        zoneTable.innerHTML = '';

        if (!zones || zones.length === 0) {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            td.colSpan = 5;
            td.className = 'text-muted';
            td.textContent = '暂无自习室数据。';
            tr.appendChild(td);
            zoneTable.appendChild(tr);
            return;
        }

        zones.forEach(function (zone) {
            var status = Campus.getSeatStatus({
                free: zone.free,
                total: zone.total
            });
            var rate = Math.round((zone.free / zone.total) * 100);

            var tr = document.createElement('tr');

            var cells = [
                zone.name,
                String(zone.total),
                String(zone.free),
                rate + '%'
            ];

            cells.forEach(function (text, index) {
                var td = document.createElement('td');
                td.textContent = text;
                if (index === 0) { td.className = 'fw-semibold'; }
                tr.appendChild(td);
            });

            var tdStatus = document.createElement('td');
            var badge = document.createElement('span');
            badge.className = 'badge ' + status.badge;
            badge.textContent = status.text;
            tdStatus.appendChild(badge);
            tr.appendChild(tdStatus);

            zoneTable.appendChild(tr);
        });
    }

    /* ---------- 加载完成 ---------- */
    function onLoaded(data) {
        allData = data.activities || [];

        if (allData.length === 0) {
            // 状态二：数据为空 —— 明确提示，不留白屏
            renderCharts([]);
            Campus.setFeedback(feedback, '数据文件加载成功，但里面没有任何场所记录（空数据）。', true);
        } else {
            renderCharts(allData);
            Campus.setFeedback(feedback,
                '数据加载成功，共 ' + allData.length + ' 条场所记录。图 1 为各场所使用指数，图 2 为按类型聚合的占比。',
                false);
        }

        renderZoneTable(data.zones || []);
    }

    /* ---------- 加载失败 ---------- */
    function onFailed(error) {
        console.error('看板数据加载失败：', error);
        // 状态三：断网 / 文件缺失 / 数据格式错 —— 统一给出可读提示
        renderCharts([]);
        renderZoneTable([]);
        Campus.setFeedback(feedback,
            '数据加载失败（' + (error && error.message ? error.message : '未知原因') +
            '）。请检查网络，或确认 data/data.json 存在且格式正确。', true);
    }

    /* ---------- jQuery 筛选交互 ---------- */
    $(function () {
        $('#filters').on('click', 'button', function () {
            var type = $(this).data('type');

            $('#filters button')
                .removeClass('btn-primary')
                .addClass('btn-outline-primary');
            $(this)
                .removeClass('btn-outline-primary')
                .addClass('btn-primary');

            if (type === '全部') {
                renderCharts(allData);
                Campus.setFeedback(feedback, '已显示全部 ' + allData.length + ' 条记录。', false);
            } else {
                var result = allData.filter(function (item) {
                    return item.type === type;
                });
                renderCharts(result);
                Campus.setFeedback(feedback,
                    '已筛选「' + type + '」类场所，共 ' + result.length + ' 条记录。', false);
            }
        });

        window.addEventListener('resize', function () {
            if (barChart) { barChart.resize(); }
            if (pieChart) { pieChart.resize(); }
        });
    });

    /* ---------- 启动 ---------- */
    Campus.loadCampusData()
        .then(onLoaded)
        .catch(onFailed);
})();
