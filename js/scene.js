/* ============================================================
   scene.js — 校园三维导览（Three.js）
   基于课堂作业七的旋转展示台改造：把展台换成校园地面与建筑群。
   职责边界：本文件只管三维场景，不处理页面其它逻辑。
   ============================================================ */

(function () {
    'use strict';

    var container = document.querySelector('#scene-container');
    var feedback = document.querySelector('#feedback');

    // 库没加载成功时给出明确提示，而不是留一块黑屏
    if (typeof THREE === 'undefined') {
        if (feedback) {
            feedback.textContent = '三维库加载失败：请确认 libs/three.min.js 是否存在。';
            feedback.className = 'feedback-error';
        }
        console.error('THREE 未定义，检查脚本引入顺序与文件路径');
        return;
    }

    if (!container) {
        console.error('未找到 #scene-container 容器');
        return;
    }

    var width = container.clientWidth;
    var height = container.clientHeight;

    /* ---------- 场景与相机 ---------- */
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16213e);

    var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(9, 7, 13);
    camera.lookAt(0, 1, 0);

    /* ---------- 渲染器 ---------- */
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    /* ---------- 鼠标控制 ---------- */
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.05;   // 不让相机钻到地面以下

    /* ---------- 光源 ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    var sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 14, 8);
    scene.add(sun);

    var fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(-8, 6, -6);
    scene.add(fill);

    /* ---------- 地面 ---------- */
    var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x2b3a55 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 主干道（贴在地面上的一条浅色带，增强"校园"感）
    var road = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x6b7a99 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 3.6);
    scene.add(road);

    /* ---------- 建筑群 ---------- */
    var campus = new THREE.Group();
    scene.add(campus);

    // 两栋教学楼
    var buildingMatA = new THREE.MeshStandardMaterial({ color: 0xb8c4d9 });
    var buildingMatB = new THREE.MeshStandardMaterial({ color: 0x9fb0cc });

    var teachingA = new THREE.Mesh(new THREE.BoxGeometry(4, 3.6, 3), buildingMatA);
    teachingA.position.set(-6, 1.8, -1);

    var teachingB = new THREE.Mesh(new THREE.BoxGeometry(4, 4.4, 3), buildingMatB);
    teachingB.position.set(-6, 2.2, 3.4);

    campus.add(teachingA);
    campus.add(teachingB);

    // 图书馆：圆柱主体 + 半球圆顶
    var libraryBody = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.4, 3, 32),
        new THREE.MeshStandardMaterial({ color: 0xe8dcc0 })
    );
    libraryBody.position.set(4.5, 1.5, 0);

    var libraryDome = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    libraryDome.position.set(4.5, 3, 0);

    campus.add(libraryBody);
    campus.add(libraryDome);

    // 图书馆门前台阶
    var steps = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.3, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xcbbfa3 })
    );
    steps.position.set(4.5, 0.15, 2.2);
    campus.add(steps);

    /* ---------- 旗杆与红旗 ---------- */
    var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 5, 12),
        new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    pole.position.set(0, 2.5, 0);
    campus.add(pole);

    var flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.0, 12, 6),
        new THREE.MeshStandardMaterial({ color: 0xd62828, side: THREE.DoubleSide })
    );
    flag.position.set(0.85, 4.3, 0);
    campus.add(flag);

    // 记录红旗顶点初始位置，动画里据此计算摆动
    var flagBase = flag.geometry.attributes.position.array.slice();

    /* ---------- 树木 ---------- */
    function makeTree(x, z, scale) {
        var tree = new THREE.Group();

        var trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.1 * scale, 10),
            new THREE.MeshStandardMaterial({ color: 0x6b4b2a })
        );
        trunk.position.y = 0.55 * scale;

        var crown = new THREE.Mesh(
            new THREE.ConeGeometry(0.7 * scale, 1.6 * scale, 14),
            new THREE.MeshStandardMaterial({ color: 0x2e8b57 })
        );
        crown.position.y = 1.75 * scale;

        tree.add(trunk);
        tree.add(crown);
        tree.position.set(x, 0, z);
        return tree;
    }

    campus.add(makeTree(-1.8, -3.6, 1.0));
    campus.add(makeTree(1.6, -3.2, 0.85));
    campus.add(makeTree(7.6, 3.4, 1.1));

    /* ---------- 动画循环 ----------
       页面切到后台时暂停，避免无谓消耗（对应"三维页返回后卡顿"的处理）。 */
    var running = true;
    var clock = new THREE.Clock();

    function animate() {
        if (!running) { return; }
        requestAnimationFrame(animate);

        var t = clock.getElapsedTime();

        // 红旗摆动：按顶点 x 坐标做正弦位移，越靠旗杆外侧摆幅越小
        var pos = flag.geometry.attributes.position;
        for (var i = 0; i < pos.count; i++) {
            var baseX = flagBase[i * 3];
            var baseZ = flagBase[i * 3 + 2];
            pos.setZ(i, baseZ + Math.sin(t * 3 + baseX * 2) * 0.12 * (1 - baseX / 1.6));
        }
        pos.needsUpdate = true;

        // 建筑群缓慢自转，方便观察
        campus.rotation.y += 0.002;

        controls.update();
        renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            running = false;
        } else if (!running) {
            running = true;
            clock.getDelta();     // 丢弃暂停期间累计的时间，避免红旗瞬间跳变
            animate();
        }
    });

    /* ---------- 窗口适配 ---------- */
    window.addEventListener('resize', function () {
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (w === 0 || h === 0) { return; }

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    if (feedback) {
        feedback.textContent = '三维场景已就绪：可拖拽旋转、滚轮缩放。';
        feedback.className = 'feedback-ok';
    }

    animate();
})();
