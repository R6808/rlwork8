/* ============================================================
   charts.js — 双库图表对照页
   Chart.js：折线图（时间趋势）+ 环形图（占比）
   ECharts ：柱状图（场所指数），与本页 Chart.js 版对照
   数据源：data/data.json
   ============================================================ */

(function () {
    'use strict';

    var feedback = document.querySelector('#feedback');

    var COLORS = ['#0d6efd', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#20c997'];

    var trendData = null;
    var lineChart = null;
    var doughnutChart = null;
    var echartsBar = null;
    var allActivities = [];

    /* ---------- 按类型筛选出要画的场所 ---------- */
    function pickSeries(type) {
        if (!trendData) { return []; }
        if (type === 'all') { return trendData.series; }
        return trendData.series.filter(function (s) { return s.type === type; });
    }

    /* ---------- Chart.js 折线图 ---------- */
    function renderLine(type) {
        var series = pickSeries(type);

        if (series.length === 0) {
            if (lineChart) { lineChart.destroy(); lineChart = null; }
            Campus.setFeedback(feedback, '该类型下没有场所数据，折线图已清空。', false);
            return;
        }

        var datasets = series.map(function (s, i) {
            return {
                label: s.name,
                data: s.values,
                borderColor: COLORS[i % COLORS.length],
                backgroundColor: COLORS[i % COLORS.length] + '33',
                tension: 0.3,
                fill: false,
                pointRadius: 3
            };
        });

        if (lineChart) {
            // 已初始化过：只换数据，避免重复创建实例
            lineChart.data.datasets = datasets;
            lineChart.update();
        } else {
            lineChart = new Chart(document.querySelector('#trend-chart'), {
                type: 'line',
                data: { labels: trendData.days, datasets: datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: '各场所一周使用指数变化', font: { size: 14 } },
                        legend: { position: 'bottom' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, title: { display: true, text: '使用指数' } },
                        x: { title: { display: true, text: '星期' } }
                    }
                }
            });
        }
    }

    /* ---------- Chart.js 环形图 ---------- */
    function renderDoughnut() {
        if (!trendData) { return; }

        var totals = trendData.series.map(function (s) {
            return s.values.reduce(function (sum, v) { return sum + v; }, 0);
        });

        var labels = trendData.series.map(function (s) { return s.name; });

        if (doughnutChart) {
            doughnutChart.data.labels = labels;
            doughnutChart.data.datasets[0].data = totals;
            doughnutChart.update();
        } else {
            doughnutChart = new Chart(document.querySelector('#share-chart'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: totals,
                        backgroundColor: COLORS.slice(0, labels.length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: '各场所七天使用指数占比', font: { size: 14 } },
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                    var pct = (ctx.parsed / total * 100).toFixed(1);
                                    return ctx.label + '：' + ctx.parsed + '（' + pct + '%）';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    /* ---------- ECharts 柱状图（对照用） ---------- */
    function renderEchartsBar() {
        var el = document.querySelector('#echarts-bar');
        if (!el || typeof echarts === 'undefined') { return; }

        echartsBar = echarts.getInstanceByDom(el) || echarts.init(el);

        if (allActivities.length === 0) {
            echartsBar.clear();
            return;
        }

        echartsBar.setOption({
            title: { text: '校园各场所使用指数（ECharts）', left: 'center', textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'axis' },
            grid: { left: 60, right: 24, top: 55, bottom: 70 },
            xAxis: {
                type: 'category',
                name: '场所',
                data: allActivities.map(function (a) { return a.name; }),
                axisLabel: { interval: 0, rotate: 30, fontSize: 11 }
            },
            yAxis: { type: 'value', name: '使用指数', max: 100 },
            series: [{
                type: 'bar',
                data: allActivities.map(function (a) { return a.value; }),
                barMaxWidth: 38,
                itemStyle: { color: '#0d6efd' }
            }]
        }, true);
    }

    /* ---------- jQuery 交互：切换折线图系列 ---------- */
    $(function () {
        $('#series-filters').on('click', 'button', function () {
            var type = $(this).data('series');

            $('#series-filters button')
                .removeClass('btn-primary')
                .addClass('btn-outline-primary');
            $(this)
                .removeClass('btn-outline-primary')
                .addClass('btn-primary');

            renderLine(type);

            var count = pickSeries(type).length;
            Campus.setFeedback(feedback,
                type === 'all'
                    ? '折线图已显示全部 ' + count + ' 个场所。'
                    : '折线图已筛选「' + type + '」类场所，共 ' + count + ' 个。', false);
        });

        window.addEventListener('resize', function () {
            if (lineChart) { lineChart.resize(); }
            if (doughnutChart) { doughnutChart.resize(); }
            if (echartsBar) { echartsBar.resize(); }
        });
    });

    /* ---------- 启动 ---------- */
    Campus.loadCampusData()
        .then(function (data) {
            trendData = data.usageTrend;
            allActivities = data.activities || [];

            if (!trendData || !trendData.series || trendData.series.length === 0) {
                Campus.setFeedback(feedback, '数据文件加载成功，但 usageTrend 里没有场所数据（空数据）。', true);
                renderEchartsBar();
                return;
            }

            renderLine('all');
            renderDoughnut();
            renderEchartsBar();

            Campus.setFeedback(feedback,
                '数据加载成功：Chart.js 绘制折线图与环形图，ECharts 绘制柱状图，共 ' + trendData.series.length + ' 个场所、'
                + trendData.days.length + ' 天数据。', false);
        })
        .catch(function (error) {
            console.error('双库图表数据加载失败：', error);
            Campus.setFeedback(feedback,
                '数据加载失败（' + (error && error.message ? error.message : '未知原因') +
                '）。请检查网络，或确认 data/data.json 存在且格式正确。', true);
        });
})();
