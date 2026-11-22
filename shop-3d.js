import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { DRACOLoader } from './libs/DRACOLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CATALOG } from './shop-catalog.js';

export function initShop3D(state) {
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

    const gloveMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 7), gloveMat);
    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 7), gloveMat);
    leftGlove.visible = false;
    rightGlove.visible = false;

    let playerModel = null;
    let mixer = null;

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
            ctx.fillRect(256, 0, 256, 512);
        } else if (jersey.pattern === 'centerBand') {
            ctx.fillRect(180, 0, 152, 512);
        } else if (jersey.pattern === 'chestBand') {
            ctx.fillRect(0, 160, 512, 130);
        } else if (jersey.pattern === 'sash') {
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(120, 0); ctx.lineTo(512, 512); ctx.lineTo(392, 512);
            ctx.closePath(); ctx.fill();
        } else if (jersey.pattern === 'sleeves') {
            ctx.fillRect(0, 0, 135, 512);
            ctx.fillRect(377, 0, 135, 512);
        }

        // Номер рівно по центру спини
        ctx.fillStyle = state.numColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.font = '900 96px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(state.number, 128, 220);
        ctx.fillText(state.number, 128, 220);

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

        gloveMat.color.set(gloveItem.c1);
        leftGlove.visible = (state.activeTab === 'gloves');
        rightGlove.visible = (state.activeTab === 'gloves');

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

        let leftHand = null;
        let rightHand = null;
        walkModel(playerModel, (child) => {
            if (child.isBone && child.name) {
                if (child.name.includes('LeftHand')) leftHand = child;
                if (child.name.includes('RightHand')) rightHand = child;
            }
        });

        if (leftHand) leftHand.add(leftGlove);
        if (rightHand) rightHand.add(rightGlove);

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
