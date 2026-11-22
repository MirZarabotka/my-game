import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { DRACOLoader } from './libs/DRACOLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CATALOG } from './shop-catalog.js';

export function initShop3D(state) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());

    const fixStyle = document.createElement('style');
    fixStyle.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; user-select: none; }
        body { width: 100vw; height: 100vh; background: #0b1120; color: #f8fafc; display: flex; flex-direction: column; overflow: hidden; }
        .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.08); height: 48px; width: 100%; }
        .back-btn { text-decoration: none; background: #1e293b; color: #f8fafc; padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.12); }
        .header-stats { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; }
        .coins-badge { background: rgba(234,179,8,0.15); color: #facc15; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(234,179,8,0.4); font-weight: 800; font-size: 0.88rem; }
        .preview-card { display: flex; gap: 8px; padding: 8px 10px; background: #111827; border-bottom: 1px solid rgba(255,255,255,0.08); height: 225px; width: 100%; overflow: hidden; }
        .viewport-box { position: relative; width: 145px; height: 100%; border-radius: 12px; overflow: hidden; background: radial-gradient(circle at 50% 35%, #1d4ed8 0%, #0f172a 75%); border: 1px solid rgba(56,189,248,0.25); flex-shrink: 0; }
        #canvas-container { width: 100%; height: 100%; cursor: grab; touch-action: none; }
        .swipe-hint { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.75); color: #cbd5e1; padding: 2px 6px; border-radius: 6px; font-size: 0.62rem; pointer-events: none; white-space: nowrap; }
        .right-controls { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 5px; overflow: hidden; }
        .tabs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; flex: 1; }
        .tab-btn { background: #1e293b; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer; padding: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tab-btn.active { background: #22c55e; color: #052e16; border-color: #4ade80; }
        .selected-bar { display: flex; flex-direction: column; gap: 4px; }
        .selected-name { font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .action-btn { width: 100%; padding: 8px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.8rem; cursor: pointer; }
        .action-btn.equipped { background: #1e293b; color: #4ade80; border: 1px solid rgba(74,222,128,0.35); }
        .action-btn.equip { background: #22c55e; color: #052e16; }
        .action-btn.buy { background: #facc15; color: #422006; }
        .action-btn.no-coins { background: #334155; color: #94a3b8; }
        .items-scroll { flex: 1; width: 100%; overflow-y: auto; padding: 10px 12px 20px 12px; }
        .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 10px; }
        .card { background: #131c31; border: 2px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; }
        .card.equipped { border-color: #22c55e; background: rgba(34,197,94,0.08); }
        .card.inspecting { border-color: #38bdf8; background: rgba(56,189,248,0.1); }
        .card-icon { width: 44px; height: 44px; border-radius: 10px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; border: 2px solid rgba(255,255,255,0.2); }
        .card-title { font-size: 0.8rem; font-weight: 800; color: #f8fafc; margin-bottom: 3px; }
        .card-desc { font-size: 0.66rem; color: #94a3b8; margin-bottom: 8px; min-height: 24px; }
        .card-btn { width: 100%; padding: 6px; border-radius: 8px; border: none; font-size: 0.74rem; font-weight: 800; cursor: pointer; }
        .card-btn.equipped-btn { background: #1e293b; color: #4ade80; }
        .card-btn.owned-btn { background: #334155; color: #f8fafc; }
        .card-btn.buy-btn { background: #facc15; color: #422006; }
        .number-panel { background: #131c31; padding: 12px; border-radius: 12px; }
        .number-panel h4 { font-size: 0.82rem; margin-bottom: 8px; color: #cbd5e1; }
        .num-colors { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .num-color-dot { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; }
        .num-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(42px, 1fr)); gap: 6px; }
        .num-cell { background: #1e293b; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 8px 0; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .num-cell.selected { background: #22c55e; color: #052e16; }
        #toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(80px); background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.82rem; transition: transform 0.3s; z-index: 100; white-space: nowrap; }
        #toast.show { transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(fixStyle);
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.15, 3.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 5, 4);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.4);
    backLight.position.set(-2, 4, -4);
    scene.add(backLight);

    const turf = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.1, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
    );
    turf.position.y = -0.05;
    scene.add(turf);
    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 24, 24),
        new THREE.MeshStandardMaterial({ roughness: 0.4 })
    );
    ballMesh.position.set(0.36, 0.14, 0.25);
    scene.add(ballMesh);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.2;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0.95, 0);
    controls.update();

    function walkModel(obj, callback) {
        if (!obj) return;
        callback(obj);
        if (Array.isArray(obj.children)) {
            for (const child of [...obj.children]) walkModel(child, callback);
        }
    }

    const leftGloveHolder = new THREE.Group();
    const rightGloveHolder = new THREE.Group();
    leftGloveHolder.visible = true;
    rightGloveHolder.visible = true;

    let leftHandBone = null;
    let rightHandBone = null;
    let leftForeArmBone = null;
    let rightForeArmBone = null;
    let glovesLoaded = false;
    const gloveMaterials = [];

    function extractSingleGlove(gloveScene, pickLeft) {
        gloveScene.updateMatrixWorld(true);
        const fullBox = new THREE.Box3().setFromObject(gloveScene);
        const midX = (fullBox.min.x + fullBox.max.x) * 0.5;
        const isSingle = (fullBox.max.x - fullBox.min.x) < (fullBox.max.y - fullBox.min.y) * 1.1;

        const meshGroup = new THREE.Group();

        gloveScene.traverse((node) => {
            if (!node.isMesh || !node.geometry) return;
            const geo = node.geometry.clone();
            geo.applyMatrix4(node.matrixWorld);

            if (!isSingle && geo.index) {
                const pos = geo.attributes.position;
                const idx = geo.index.array;
                const filtered = [];
                for (let i = 0; i < idx.length; i += 3) {
                    const cx = (pos.getX(idx[i]) + pos.getX(idx[i + 1]) + pos.getX(idx[i + 2])) / 3;
                    if (pickLeft ? cx < midX : cx >= midX) {
                        filtered.push(idx[i], idx[i + 1], idx[i + 2]);
                    }
                }
                if (filtered.length === 0) return;
                geo.setIndex(filtered);
            }

            geo.computeBoundingBox();
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            const clonedMats = mats.map((m) => {
                const c = m.clone();
                c.side = THREE.DoubleSide;
                gloveMaterials.push(c);
                return c;
            });

            const mesh = new THREE.Mesh(geo, clonedMats.length === 1 ? clonedMats.at(0) : clonedMats);
            mesh.frustumCulled = false;
            meshGroup.add(mesh);
        });

        const box = new THREE.Box3().setFromObject(meshGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const norm = 1.0 / maxDim;

        meshGroup.scale.setScalar(norm);
        meshGroup.position.set(-center.x * norm, -box.min.y * norm, -center.z * norm);

        const rotateGroup = new THREE.Group();
        rotateGroup.add(meshGroup);
        rotateGroup.rotation.y = pickLeft ? Math.PI / 2 : -Math.PI / 2;

        return rotateGroup;
    }

    function mountGloveModel(gloveScene) {
        const rightUnit = extractSingleGlove(gloveScene, false);
        const leftUnit = extractSingleGlove(gloveScene, true);

        rightGloveHolder.clear();
        leftGloveHolder.clear();
        rightGloveHolder.add(rightUnit);
        leftGloveHolder.add(leftUnit);

        attachToSleeveEnd(rightGloveHolder, rightForeArmBone, rightHandBone);
        attachToSleeveEnd(leftGloveHolder, leftForeArmBone, leftHandBone);
        glovesLoaded = true;
        updateAppearance();
    }

    function attachToSleeveEnd(holder, foreArmBone, handBone) {
        const armBone = foreArmBone || (handBone && handBone.parent);
        if (!armBone) return;

        const wristPos = handBone ? handBone.position.clone() : new THREE.Vector3(0, 24, 0);
        const foreLen = wristPos.length() || 24;
        const dir = wristPos.length() > 0.001 ? wristPos.clone().normalize() : new THREE.Vector3(0, 1, 0);

        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        holder.quaternion.copy(q);

        const gloveSize = foreLen * 0.92;
        holder.scale.setScalar(gloveSize);
        holder.position.copy(wristPos).addScaledVector(dir, -gloveSize * 0.28);
        armBone.add(holder);
    }

    const backNumberMat = new THREE.MeshBasicMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4
    });
    const backNumberMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), backNumberMat);

    let playerModel = null;
    let mixer = null;

    function updateBackNumber() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        ctx.fillStyle = state.numColor;
        ctx.strokeStyle = state.numColor === '#000000' ? '#ffffff' : '#000000';
        ctx.lineWidth = 10;
        ctx.font = '900 165px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(state.number, 128, 128);
        ctx.fillText(state.number, 128, 128);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        backNumberMat.map = tex;
        backNumberMat.needsUpdate = true;
    }

    function createJerseyTexture(jersey) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = jersey.c1;
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = jersey.c2;
        if (jersey.pattern === 'stripes') {
            for (let x = 0; x < 512; x += 44) ctx.fillRect(x, 0, 22, 512);
        } else if (jersey.pattern === 'hoops') {
            for (let y = 0; y < 512; y += 44) ctx.fillRect(0, y, 512, 22);
        } else if (jersey.pattern === 'half') {
            ctx.fillRect(105, 0, 60, 512);
            ctx.fillRect(265, 0, 85, 512);
        } else if (jersey.pattern === 'centerBand') {
            ctx.fillRect(85, 0, 45, 512);
            ctx.fillRect(245, 0, 45, 512);
        } else if (jersey.pattern === 'chestBand') {
            ctx.fillRect(0, 160, 512, 130);
        } else if (jersey.pattern === 'sash') {
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(120, 0); ctx.lineTo(512, 512); ctx.lineTo(392, 512);
            ctx.closePath(); ctx.fill();
        } else if (jersey.pattern === 'sleeves') {
            ctx.fillRect(203, 0, 22, 512);
            ctx.fillRect(398, 0, 114, 512);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    }

    function createBallTexture(c1, c2) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = c1;
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = c2;
        for (let x = 16; x < 256; x += 48) {
            for (let y = 20; y < 128; y += 44) {
                ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    }

    function updateAppearance() {
        const jersey = CATALOG.jerseys.find(x => x.id === state.preview.jerseys) || CATALOG.jerseys.at(0);
        const shortItem = CATALOG.shorts.find(x => x.id === state.preview.shorts) || CATALOG.shorts.at(0);
        const bootItem = CATALOG.boots.find(x => x.id === state.preview.boots) || CATALOG.boots.at(0);
        const gloveItem = CATALOG.gloves.find(x => x.id === state.preview.gloves) || CATALOG.gloves.at(0);
        const ballItem = CATALOG.balls.find(x => x.id === state.preview.balls) || CATALOG.balls.at(0);

        updateBackNumber();

        leftGloveHolder.visible = glovesLoaded;
        rightGloveHolder.visible = glovesLoaded;

        const tintColor = new THREE.Color(gloveItem.c1).lerp(new THREE.Color('#ffffff'), 0.35);
        gloveMaterials.forEach((m) => {
            m.color.copy(tintColor);
            m.needsUpdate = true;
        });
        ballMesh.material.map = createBallTexture(ballItem.c1, ballItem.c2);
        ballMesh.material.needsUpdate = true;

        if (!playerModel) return;

        const jerseyTex = createJerseyTexture(jersey);

        walkModel(playerModel, (child) => {
            if (!child.isMesh || !child.material) return;
            const name = (child.name || '').toLowerCase();

            if (name.includes('shirt') || name.includes('top') || name.includes('jersey') || name.includes('torso')) {
                child.material = new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.7 });
            } else if (name.includes('short') || name.includes('pant')) {
                child.material = new THREE.MeshStandardMaterial({ color: shortItem.c1, roughness: 0.75 });
            } else if (name.includes('shoe') || name.includes('boot')) {
                child.material = new THREE.MeshStandardMaterial({ color: bootItem.c1, roughness: 0.4 });
            } else if (Array.isArray(child.material)) {
                child.material = child.material.map((m, idx) => {
                    const mName = (m.name || '').toLowerCase();
                    if (mName.includes('shirt') || mName.includes('top') || idx === 1) {
                        return new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.7 });
                    }
                    if (mName.includes('short') || idx === 2) {
                        return new THREE.MeshStandardMaterial({ color: shortItem.c1, roughness: 0.75 });
                    }
                    if (mName.includes('shoe') || mName.includes('boot') || idx === 3) {
                        return new THREE.MeshStandardMaterial({ color: bootItem.c1, roughness: 0.4 });
                    }
                    return m;
                });
            }
        });
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./libs/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load('player.glb', (gltf) => {
        playerModel = gltf.scene || (gltf.scenes && gltf.scenes.at(0));
        if (!playerModel) return;

        let spineBone = null;

        walkModel(playerModel, (child) => {
            if (child.isBone && child.name) {
                const n = child.name.toLowerCase();
                if (n.includes('forearm') && n.includes('left')) leftForeArmBone = child;
                if (n.includes('forearm') && n.includes('right')) rightForeArmBone = child;

                if (n.includes('hand') && n.includes('left') && !n.includes('middle') && !n.includes('index') && !n.includes('ring') && !n.includes('pinky') && !n.includes('thumb')) {
                    leftHandBone = child;
                }
                if (n.includes('hand') && n.includes('right') && !n.includes('middle') && !n.includes('index') && !n.includes('ring') && !n.includes('pinky') && !n.includes('thumb')) {
                    rightHandBone = child;
                }

                if (n.includes('spine2') || (!spineBone && n.includes('spine1'))) {
                    spineBone = child;
                }
            }
        });

        if (spineBone) {
            backNumberMesh.position.set(0, 1.5, -11.3);
            backNumberMesh.rotation.set(0, Math.PI, 0);
            spineBone.add(backNumberMesh);
        } else {
            backNumberMesh.scale.set(0.01, 0.01, 0.01);
            backNumberMesh.position.set(0, 1.21, -0.113);
            backNumberMesh.rotation.y = Math.PI;
            playerModel.add(backNumberMesh);
        }

        scene.add(playerModel);

        loader.load(
            './glove.glb?v=3',
            (gloveGltf) => {
                try {
                    const gScene = gloveGltf.scene || (gloveGltf.scenes && gloveGltf.scenes.at(0));
                    if (gScene) mountGloveModel(gScene);
                } catch (e) {
                    console.error('Помилка обробки мешу рукавиць:', e);
                    const hint = document.querySelector('.swipe-hint');
                    if (hint) hint.textContent = 'Помилка мешу: ' + e.message;
                }
            },
            undefined,
            (err) => {
                console.error('Помилка завантаження glove.glb:', err);
                const hint = document.querySelector('.swipe-hint');
                if (hint) hint.textContent = 'Помилка: ' + (err.message || 'load');
            }
        );

        updateAppearance();

        const firstAnim = gltf.animations && gltf.animations.at(0);
        if (firstAnim) {
            mixer = new THREE.AnimationMixer(playerModel);
            mixer.clipAction(firstAnim).play();
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    let lastTime = performance.now();
    function animate(now) {
        requestAnimationFrame(animate);
        const dt = (now - lastTime) * 0.001;
        lastTime = now;

        if (mixer) mixer.update(dt);
        if (glovesLoaded) {
            if (leftHandBone) leftHandBone.scale.setScalar(0.0001);
            if (rightHandBone) rightHandBone.scale.setScalar(0.0001);
        }

        ballMesh.rotation.y += 0.01;
        controls.update();
        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    return {
        updateAppearance,
        faceBack: () => {
            camera.position.set(0, 1.25, -3.0);
            controls.update();
        }
    };
}
