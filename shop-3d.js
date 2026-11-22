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

    const gloveBackMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.08 });
    const glovePalmMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
    const gloveTrimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });

    // Плавна анатомічна 3D-рукавиця (Negative Cut) з фасками, ремінцем і сегментованими пальцями
    function buildProGlove(isLeft) {
        const group = new THREE.Group();
        const dir = isLeft ? -1 : 1;

        // 1. Еластичний бандаж зап'ястя + подвійна застібка-липучка
        const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.18, 24), gloveTrimMat);
        wrist.scale.set(0.72, 1.0, 1.15);
        wrist.position.set(0, 0.09, 0);
        group.add(wrist);

        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.075, 24), glovePalmMat);
        strap.scale.set(0.75, 1.0, 1.18);
        strap.position.set(0, 0.10, 0);
        group.add(strap);

        // 2. Плавний контур долоні (ExtrudeGeometry з округлим bevel)
        const palmShape = new THREE.Shape();
        palmShape.moveTo(-0.18, 0.16);
        palmShape.quadraticCurveTo(-0.24, 0.36, -0.22, 0.56);
        palmShape.quadraticCurveTo(0, 0.61, 0.22, 0.56);
        palmShape.quadraticCurveTo(0.24, 0.36, 0.18, 0.16);
        palmShape.closePath();

        const backGeo = new THREE.ExtrudeGeometry(palmShape, {
            depth: 0.065,
            bevelEnabled: true,
            bevelThickness: 0.025,
            bevelSize: 0.022,
            bevelSegments: 5
        });
        backGeo.rotateY(Math.PI / 2);
        const backMesh = new THREE.Mesh(backGeo, gloveBackMat);
        backMesh.position.set(dir > 0 ? 0.005 : -0.07, 0, 0);
        group.add(backMesh);

        // Внутрішня латексна долоня (дивиться всередину до стегна: -dir * X)
        const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
            depth: 0.035,
            bevelEnabled: true,
            bevelThickness: 0.015,
            bevelSize: 0.015,
            bevelSegments: 4
        });
        palmGeo.rotateY(Math.PI / 2);
        const palmMesh = new THREE.Mesh(palmGeo, glovePalmMat);
        palmMesh.position.set(dir > 0 ? -0.045 : 0.01, 0, 0);
        group.add(palmMesh);

        // 3. Рельєфна зона вибивання кулаком (Punch Zone) на кісточках
        const punchPad = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.36), gloveTrimMat);
        punchPad.position.set(dir * 0.085, 0.49, 0);
        group.add(punchPad);

        // 4. Чотири плавних пальці з легким природним згином у бік долоні
        const fingers = [
            { z: 0.165, len: 0.25, r: 0.046 },
            { z: 0.055, len: 0.30, r: 0.049 },
            { z: -0.055, len: 0.27, r: 0.046 },
            { z: -0.165, len: 0.21, r: 0.041 }
        ];

        fingers.forEach((f) => {
            const fingerGroup = new THREE.Group();
            fingerGroup.position.set(0, 0.56, f.z);
            // Легкий природний загин пальців до долоні
            fingerGroup.rotation.z = dir * 0.14;

            const fBack = new THREE.Mesh(new THREE.CapsuleGeometry(f.r, f.len, 8, 16), gloveBackMat);
            fBack.scale.set(0.75, 1.0, 1.05);
            fBack.position.set(dir * 0.018, f.len * 0.5, 0);
            fingerGroup.add(fBack);

            const fPalm = new THREE.Mesh(new THREE.CapsuleGeometry(f.r * 0.9, f.len * 0.94, 8, 16), glovePalmMat);
            fPalm.scale.set(0.55, 1.0, 1.0);
            fPalm.position.set(-dir * 0.022, f.len * 0.5, 0);
            fingerGroup.add(fPalm);

            group.add(fingerGroup);
        });

        // 5. Великий палець (спереду +Z, трохи відведений для хвату м'яча)
        const thumbGroup = new THREE.Group();
        thumbGroup.position.set(-dir * 0.03, 0.30, 0.20);
        thumbGroup.rotation.x = 0.48;
        thumbGroup.rotation.z = dir * 0.24;

        const tBack = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.20, 8, 16), gloveBackMat);
        tBack.position.set(dir * 0.015, 0.10, 0);
        thumbGroup.add(tBack);

        const tPalm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.18, 8, 16), glovePalmMat);
        tPalm.position.set(-dir * 0.018, 0.10, 0);
        thumbGroup.add(tPalm);

        group.add(thumbGroup);

        group.visible = false;
        return group;
    }

    const leftGlove = buildProGlove(true);
    const rightGlove = buildProGlove(false);
    let leftHandBone = null;
    let rightHandBone = null;
    let leftGloveScale = 18;
    let rightGloveScale = 18;

    function fitGloveOnWrist(glove, foreArmBone, handBone, midBone) {
        foreArmBone.updateWorldMatrix(true, false);
        handBone.updateWorldMatrix(true, false);
        midBone.updateWorldMatrix(true, false);

        const wristPos = handBone.position.clone();
        const foreDir = wristPos.clone().normalize();
        const palmLen = midBone.position.length();
        const gloveLen = palmLen * 2.15;

        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), foreDir);
        glove.quaternion.copy(q);
        glove.scale.setScalar(gloveLen);
        glove.position.copy(wristPos).addScaledVector(foreDir, -palmLen * 0.15);
        foreArmBone.add(glove);
        return gloveLen;
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

        const showGloves = (state.activeTab === 'gloves');
        gloveBackMat.color.set(gloveItem.c1);
        glovePalmMat.color.set(gloveItem.c2);
        leftGlove.visible = showGloves;
        rightGlove.visible = showGloves;

        // Ховаємо голі кисті моделі, коли надіті воротарські рукавиці
        const handScale = showGloves ? 0.001 : 1;
        if (leftHandBone) leftHandBone.scale.setScalar(handScale);
        if (rightHandBone) rightHandBone.scale.setScalar(handScale);

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

        let leftForeArm = null, leftMid = null;
        let rightForeArm = null, rightMid = null;
        let spineBone = null;

        walkModel(playerModel, (child) => {
            if (child.isBone && child.name) {
                if (child.name.includes('LeftForeArm')) leftForeArm = child;
                if (child.name.endsWith('LeftHand')) leftHandBone = child;
                if (child.name.includes('LeftHandMiddle1')) leftMid = child;

                if (child.name.includes('RightForeArm')) rightForeArm = child;
                if (child.name.endsWith('RightHand')) rightHandBone = child;
                if (child.name.includes('RightHandMiddle1')) rightMid = child;

                if (child.name.includes('Spine2') || (!spineBone && child.name.includes('Spine1'))) {
                    spineBone = child;
                }
            }
        });

        if (leftForeArm && leftHandBone && leftMid) {
            leftGloveScale = fitGloveOnWrist(leftGlove, leftForeArm, leftHandBone, leftMid);
        } else if (leftHandBone) {
            leftGlove.scale.setScalar(18);
            leftHandBone.add(leftGlove);
        }

        if (rightForeArm && rightHandBone && rightMid) {
            rightGloveScale = fitGloveOnWrist(rightGlove, rightForeArm, rightHandBone, rightMid);
        } else if (rightHandBone) {
            rightGlove.scale.setScalar(18);
            rightHandBone.add(rightGlove);
        }

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

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        if (mixer) mixer.update(clock.getDelta());
        ballMesh.rotation.y += 0.01;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    return {
        updateAppearance,
        faceBack: () => {
            camera.position.set(0, 1.25, -3.0);
            controls.update();
        }
    };
}
