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

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
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
            for (const child of list) {
                walkModel(child, callback);
            }
        }
    }

    let originalShirtImage = null;
    let playerModel = null;
    let mixer = null;

    function drawJerseyPattern(ctx, jersey, offsetX, width, height) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(offsetX, 0, width, height);
        ctx.clip();

        ctx.fillStyle = jersey.c1;
        ctx.fillRect(offsetX, 0, width, height);

        ctx.fillStyle = jersey.c2;
        if (jersey.pattern === 'stripes') {
            for (let x = offsetX; x < offsetX + width; x += 32) {
                ctx.fillRect(x, 0, 16, height);
            }
        } else if (jersey.pattern === 'hoops') {
            for (let y = 0; y < height; y += 36) {
                ctx.fillRect(offsetX, y, width, 18);
            }
        } else if (jersey.pattern === 'half') {
            ctx.fillRect(offsetX + width / 2, 0, width / 2, height);
        } else if (jersey.pattern === 'centerBand') {
            ctx.fillRect(offsetX + width * 0.32, 0, width * 0.36, height);
        } else if (jersey.pattern === 'chestBand') {
            ctx.fillRect(offsetX, height * 0.32, width, height * 0.28);
        } else if (jersey.pattern === 'sash') {
            ctx.beginPath();
            ctx.moveTo(offsetX, 0);
            ctx.lineTo(offsetX + width * 0.25, 0);
            ctx.lineTo(offsetX + width, height);
            ctx.lineTo(offsetX + width * 0.75, height);
            ctx.closePath();
            ctx.fill();
        } else if (jersey.pattern === 'sleeves') {
            ctx.fillRect(offsetX, 0, width * 0.22, height);
            ctx.fillRect(offsetX + width * 0.78, 0, width * 0.22, height);
        }

        ctx.restore();
    }
    function createKitTexture() {
        const jersey = CATALOG.jerseys.find(x => x.id === state.preview.jerseys) || CATALOG.jerseys.at(0);
        const shortItem = CATALOG.shorts.find(x => x.id === state.preview.shorts) || CATALOG.shorts.at(0);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = shortItem.c1;
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = shortItem.c2;
        ctx.fillRect(0, 385, 512, 26);

        drawJerseyPattern(ctx, jersey, 0, 256, 305);
        drawJerseyPattern(ctx, jersey, 256, 256, 305);

        if (originalShirtImage) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(originalShirtImage, 0, 0, 512, 512);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.fillStyle = state.numColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.font = '900 70px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(state.number, 384, 145);
        ctx.fillText(state.number, 384, 145);

        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
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

        const kitTexture = createKitTexture();

        walkModel(playerModel, (child) => {
            if (child.isMesh && child.material) {
                const name = (child.name || '').toLowerCase();
                if (name.includes('shirt')) {
                    child.material = child.material.clone();
                    child.material.map = kitTexture;
                    child.material.color.set('#ffffff');
                    child.material.needsUpdate = true;
                } else if (name.includes('shoe')) {
                    child.material = child.material.clone();
                    child.material.color.set(bootItem.c1);
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
                if (name.includes('shirt') && child.material && child.material.map) {
                    originalShirtImage = child.material.map.image;
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
