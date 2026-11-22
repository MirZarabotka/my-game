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

    const shirtMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const sleeveMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const shortMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
    const bootMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
    const gloveMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.135, 0.44, 24), shirtMat);
    torsoMesh.position.set(0, 0.12, 0.01);
    torsoMesh.scale.set(1.18, 1, 0.76);

    const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.22, 16), sleeveMat);
    leftSleeve.position.set(0, 0.11, 0);

    const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.22, 16), sleeveMat);
    rightSleeve.position.set(0, 0.11, 0);

    const pelvisShort = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.18, 20), shortMat);
    pelvisShort.position.set(0, -0.02, 0.01);
    pelvisShort.scale.set(1.15, 1, 0.8);

    const leftLegShort = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.22, 16), shortMat);
    leftLegShort.position.set(0, 0.11, 0);

    const rightLegShort = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.22, 16), shortMat);
    rightLegShort.position.set(0, 0.11, 0);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.07, 0.23), bootMat);
    leftBoot.position.set(0, 0.03, 0.05);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.07, 0.23), bootMat);
    rightBoot.position.set(0, 0.03, 0.05);

    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.15, 0.07), gloveMat);
    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.15, 0.07), gloveMat);
    leftGlove.visible = false;
    rightGlove.visible = false;
    function createJerseyTexture(jersey) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = jersey.c1;
        ctx.fillRect(0, 0, 512, 256);

        ctx.fillStyle = jersey.c2;
        if (jersey.pattern === 'stripes') {
            for (let x = 0; x < 512; x += 32) ctx.fillRect(x, 0, 16, 256);
        } else if (jersey.pattern === 'hoops') {
            for (let y = 0; y < 256; y += 32) ctx.fillRect(0, y, 512, 16);
        } else if (jersey.pattern === 'half') {
            ctx.fillRect(128, 0, 128, 256);
            ctx.fillRect(384, 0, 128, 256);
        } else if (jersey.pattern === 'centerBand') {
            ctx.fillRect(96, 0, 64, 256);
            ctx.fillRect(352, 0, 64, 256);
        } else if (jersey.pattern === 'chestBand') {
            ctx.fillRect(0, 80, 512, 75);
        } else if (jersey.pattern === 'sash') {
            ctx.beginPath();
            ctx.moveTo(40, 0); ctx.lineTo(100, 0); ctx.lineTo(220, 256); ctx.lineTo(160, 256);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(296, 0); ctx.lineTo(356, 0); ctx.lineTo(476, 256); ctx.lineTo(416, 256);
            ctx.closePath(); ctx.fill();
        }

        ctx.fillStyle = state.numColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.font = '900 84px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(state.number, 384, 125);
        ctx.fillText(state.number, 384, 125);

        const tex = new THREE.CanvasTexture(canvas);
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

        shirtMat.map = createJerseyTexture(jersey);
        shirtMat.needsUpdate = true;

        sleeveMat.color.set(jersey.pattern === 'sleeves' ? jersey.c2 : jersey.c1);
        shortMat.color.set(shortItem.c1);
        bootMat.color.set(bootItem.c1);
        gloveMat.color.set(gloveItem.c1);

        leftGlove.visible = (state.activeTab === 'gloves');
        rightGlove.visible = (state.activeTab === 'gloves');

        ballMesh.material.map = createBallTexture(ballItem.c1, ballItem.c2);
        ballMesh.material.needsUpdate = true;
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./libs/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let playerModel = null;
    let mixer = null;

    loader.load('player.glb', (gltf) => {
        playerModel = gltf.scene || (gltf.scenes && gltf.scenes.at(0));
        if (!playerModel) return;

        const bones = {};
        walkModel(playerModel, (child) => {
            if (child.isBone && child.name) {
                if (child.name.includes('Spine1')) bones.spine = child;
                if (child.name.includes('LeftArm') && !child.name.includes('Fore')) bones.leftArm = child;
                if (child.name.includes('RightArm') && !child.name.includes('Fore')) bones.rightArm = child;
                if (child.name.includes('Hips')) bones.hips = child;
                if (child.name.includes('LeftUpLeg')) bones.leftLeg = child;
                if (child.name.includes('RightUpLeg')) bones.rightLeg = child;
                if (child.name.includes('LeftFoot')) bones.leftFoot = child;
                if (child.name.includes('RightFoot')) bones.rightFoot = child;
                if (child.name.includes('LeftHand')) bones.leftHand = child;
                if (child.name.includes('RightHand')) bones.rightHand = child;
            }
        });

        if (bones.spine) bones.spine.add(torsoMesh);
        if (bones.leftArm) bones.leftArm.add(leftSleeve);
        if (bones.rightArm) bones.rightArm.add(rightSleeve);
        if (bones.hips) bones.hips.add(pelvisShort);
        if (bones.leftLeg) bones.leftLeg.add(leftLegShort);
        if (bones.rightLeg) bones.rightLeg.add(rightLegShort);
        if (bones.leftFoot) bones.leftFoot.add(leftBoot);
        if (bones.rightFoot) bones.rightFoot.add(rightBoot);
        if (bones.leftHand) bones.leftHand.add(leftGlove);
        if (bones.rightHand) bones.rightHand.add(rightGlove);

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
