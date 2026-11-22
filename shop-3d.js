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
    function createKitTexture() {
        const jersey = CATALOG.jerseys.find(x => x.id === state.preview.jerseys) || CATALOG.jerseys.at(0);
        const shortItem = CATALOG.shorts.find(x => x.id === state.preview.shorts) || CATALOG.shorts.at(0);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        drawJerseyPattern(ctx, jersey, 512, 305);

        ctx.fillStyle = shortItem.c1;
        ctx.fillRect(0, 305, 512, 207);
        ctx.fillStyle = shortItem.c2;
        ctx.fillRect(0, 385, 512, 26);

        ctx.fillStyle = state.numColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.font = '900 72px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(state.number, 384, 145);
        ctx.fillText(state.number, 384, 145);

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

    function applyMaterialChange(mat, meshName, kitTexture, bootColor) {
        if (!mat) return mat;
        const mName = (mat.name || '').toLowerCase();
        const combined = `${meshName} ${mName}`;

        if (combined.includes('shoe') || combined.includes('boot')) {
            const newMat = mat.clone();
            newMat.map = null;
            newMat.color.set(bootColor);
            newMat.needsUpdate = true;
            return newMat;
        }
        if (combined.includes('hair') || combined.includes('eye') || combined.includes('lash')) {
            return mat;
        }
        // Якщо це окремий матеріал форми (наприклад, Ch38_Shirt або другий слот матеріалу)
        if (mName.includes('shirt') || mName.includes('cloth') || meshName.includes('shirt')) {
            const newMat = mat.clone();
            newMat.map = kitTexture;
            newMat.color.set('#ffffff');
            newMat.needsUpdate = true;
            return newMat;
        }
        return mat;
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

        const kitTexture = createKitTexture();

        walkModel(playerModel, (child) => {
            if (child.isMesh && child.material) {
                const meshName = (child.name || '').toLowerCase();
                if (Array.isArray(child.material)) {
                    child.material = child.material.map((m, idx) => {
                        // У моделях Mixamo з мультиматеріалом слот 1 (або з назвою Shirt) — це одяг
                        if (idx === 1 || (m.name || '').toLowerCase().includes('shirt')) {
                            const cloned = m.clone();
                            cloned.map = kitTexture;
                            cloned.color.set('#ffffff');
                            cloned.needsUpdate = true;
                            return cloned;
                        }
                        return applyMaterialChange(m, meshName, kitTexture, bootItem.c1);
                    });
                } else {
                    child.material = applyMaterialChange(child.material, meshName, kitTexture, bootItem.c1);
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
