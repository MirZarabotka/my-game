import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { DRACOLoader } from './libs/DRACOLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CATALOG } from './shop-catalog.js';

export function initShop3D(state) {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.15, 3.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.4);
    backLight.position.set(-2, 4, -4);
    scene.add(backLight);

    const turf = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.15, 0.1, 36),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
    );
    turf.position.y = -0.05;
    turf.receiveShadow = true;
    scene.add(turf);

    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 24, 24),
        new THREE.MeshStandardMaterial({ roughness: 0.4 })
    );
    ballMesh.position.set(0.36, 0.14, 0.25);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    const gloveMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.08), gloveMat);
    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.08), gloveMat);
    leftGlove.visible = false;
    rightGlove.visible = false;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
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
            const list = [...obj.children];
            for (const child of list) walkModel(child, callback);
        }
    }

    let playerModel = null;
    let mixer = null;
    let baseTextureImg = null;

    function drawJerseyPattern(ctx, jersey, width, height) {
        ctx.fillStyle = jersey.c1;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = jersey.c2;
        if (jersey.pattern === 'stripes') {
            for (let x = 0; x < width; x += 28) ctx.fillRect(x, 0, 14, height);
        } else if (jersey.pattern === 'hoops') {
            for (let y = 0; y < height; y += 34) ctx.fillRect(0, y, width, 17);
        } else if (jersey.pattern === 'half') {
            ctx.fillRect(width * 0.25, 0, width * 0.25, height);
            ctx.fillRect(width * 0.75, 0, width * 0.25, height);
        } else if (jersey.pattern === 'centerBand') {
            ctx.fillRect(width * 0.16, 0, width * 0.18, height);
            ctx.fillRect(width * 0.66, 0, width * 0.18, height);
        } else if (jersey.pattern === 'chestBand') {
            ctx.fillRect(0, height * 0.3, width, height * 0.28);
        } else if (jersey.pattern === 'sash') {
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(width * 0.15, 0);
            ctx.lineTo(width * 0.5, height); ctx.lineTo(width * 0.35, height);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(width * 0.5, 0); ctx.lineTo(width * 0.65, 0);
            ctx.lineTo(width, height); ctx.lineTo(width * 0.85, height);
            ctx.closePath(); ctx.fill();
        } else if (jersey.pattern === 'sleeves') {
            ctx.fillRect(0, 0, width * 0.12, height);
            ctx.fillRect(width * 0.38, 0, width * 0.24, height);
            ctx.fillRect(width * 0.88, 0, width * 0.12, height);
        }
    }
    function createSmartKitTexture() {
        const jersey = CATALOG.jerseys.find(x => x.id === state.preview.jerseys) || CATALOG.jerseys.at(0);
        const shortItem = CATALOG.shorts.find(x => x.id === state.preview.shorts) || CATALOG.shorts.at(0);
        const bootItem = CATALOG.boots.find(x => x.id === state.preview.boots) || CATALOG.boots.at(0);

        const size = 512;
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = size;
        patternCanvas.height = size;
        const pCtx = patternCanvas.getContext('2d');

        drawJerseyPattern(pCtx, jersey, size, 305);
        pCtx.fillStyle = shortItem.c1;
        pCtx.fillRect(0, 305, size, 207);
        pCtx.fillStyle = shortItem.c2;
        pCtx.fillRect(0, 385, size, 26);

        pCtx.fillStyle = state.numColor;
        pCtx.strokeStyle = '#000000';
        pCtx.lineWidth = 6;
        pCtx.font = '900 72px "Segoe UI", sans-serif';
        pCtx.textAlign = 'center';
        pCtx.textBaseline = 'middle';
        pCtx.strokeText(state.number, 384, 145);
        pCtx.fillText(state.number, 384, 145);

        if (baseTextureImg) {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = size;
            outCanvas.height = size;
            const oCtx = outCanvas.getContext('2d');
            oCtx.drawImage(baseTextureImg, 0, 0, size, size);

            const origData = oCtx.getImageData(0, 0, size, size);
            const patData = pCtx.getImageData(0, 0, size, size);
            const bootCol = new THREE.Color(bootItem.c1);
            const bR = Math.round(bootCol.r * 255);
            const bG = Math.round(bootCol.g * 255);
            const bB = Math.round(bootCol.b * 255);

            for (let i = 0; i < origData.data.length; i += 4) {
                const r = origData.data[i];
                const g = origData.data[i + 1];
                const b = origData.data[i + 2];

                // Точний фільтр тільки для бежевої шкіри (червоний рукав тепер не пропускається)
                const isSkin = (
                    r > 135 && g > 85 && b > 55 &&
                    r > g && g > b &&
                    (r - g) >= 12 && (r - g) <= 68 &&
                    (g - b) >= 8 && (g - b) <= 55
                );
                const py = Math.floor((i / 4) / size);
                const isShoe = (py > 410 && r < 75 && g < 75 && b < 75);

                if (isShoe) {
                    origData.data[i] = bR;
                    origData.data[i + 1] = bG;
                    origData.data[i + 2] = bB;
                } else if (!isSkin) {
                    const shade = Math.min(1.25, Math.max(0.6, (r + g + b) / 360));
                    origData.data[i] = Math.min(255, patData.data[i] * shade);
                    origData.data[i + 1] = Math.min(255, patData.data[i + 1] * shade);
                    origData.data[i + 2] = Math.min(255, patData.data[i + 2] * shade);
                }
            }
            oCtx.putImageData(origData, 0, 0);

            const tex = new THREE.CanvasTexture(outCanvas);
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            return tex;
        }

        const tex = new THREE.CanvasTexture(patternCanvas);
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
                ctx.beginPath();
                ctx.arc(x, y, 13, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    }

    function updateAppearance() {
        const bootItem = CATALOG.boots.find(x => x.id === state.preview.boots) || CATALOG.boots.at(0);
        const gloveItem = CATALOG.gloves.find(x => x.id === state.preview.gloves) || CATALOG.gloves.at(0);
        const ballItem = CATALOG.balls.find(x => x.id === state.preview.balls) || CATALOG.balls.at(0);

        ballMesh.material.map = createBallTexture(ballItem.c1, ballItem.c2);
        ballMesh.material.needsUpdate = true;

        gloveMat.color.set(gloveItem.c1);
        leftGlove.visible = (state.activeTab === 'gloves');
        rightGlove.visible = (state.activeTab === 'gloves');

        if (!playerModel) return;

        const kitTexture = createSmartKitTexture();

        walkModel(playerModel, (child) => {
            if (child.isMesh && child.material) {
                const name = (child.name || '').toLowerCase();
                if (name.includes('hair') || name.includes('eye') || name.includes('lash')) return;

                if (name.includes('shoe') || name.includes('boot')) {
                    child.material = new THREE.MeshStandardMaterial({ color: bootItem.c1, roughness: 0.45 });
                } else {
                    child.material = new THREE.MeshStandardMaterial({ map: kitTexture, roughness: 0.75 });
                }
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

        let leftHandBone = null;
        let rightHandBone = null;

        walkModel(playerModel, (child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const name = (child.name || '').toLowerCase();
                if (!name.includes('hair') && !name.includes('eye') && child.material) {
                    const mat = Array.isArray(child.material) ? child.material.at(0) : child.material;
                    if (mat && mat.map && mat.map.image) {
                        baseTextureImg = mat.map.image;
                    }
                }
            }
            if (child.isBone && child.name) {
                if (child.name.includes('LeftHand')) leftHandBone = child;
                if (child.name.includes('RightHand')) rightHandBone = child;
            }
        });

        if (leftHandBone) leftHandBone.add(leftGlove);
        if (rightHandBone) rightHandBone.add(rightGlove);

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
            camera.position.set(0, 1.25, -3.1);
            controls.update();
        }
    };
}
