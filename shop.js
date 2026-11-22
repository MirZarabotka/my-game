import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { DRACOLoader } from './libs/DRACOLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
const targetPos = new THREE.Vector3(0, 1.25, 3.2);
const targetLook = new THREE.Vector3(0, 0.95, 0);
camera.position.copy(targetPos);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3, 6, 4);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
rimLight.position.set(-3, 4, -4);
scene.add(rimLight);

const turf = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.25, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 })
);
turf.position.y = -0.06;
turf.receiveShadow = true;
scene.add(turf);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.3;
controls.maxDistance = 4.8;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.target.copy(targetLook);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./libs/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let mixer;
let playerModel;

function applyColors(kitHex, bootsHex) {
    if (!playerModel) return;
    playerModel.traverse((child) => {
        if (child.isMesh && child.material) {
            const name = child.name.toLowerCase();
            if (bootsHex && name.includes('shoe')) {
                child.material = child.material.clone();
                child.material.color.set(bootsHex);
            } else if (kitHex && name.includes('shirt')) {
                child.material = child.material.clone();
                child.material.color.set(kitHex);
            }
        }
    });
}

loader.load(
    'player.glb',
    (gltf) => {
        playerModel = gltf.scene;
        playerModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const savedKit = localStorage.getItem('kitColor');
        const savedBoots = localStorage.getItem('bootsColor');
        applyColors(savedKit, savedBoots);

        scene.add(playerModel);

        const firstAnim = gltf.animations.at(0);
        if (firstAnim) {
            mixer = new THREE.AnimationMixer(playerModel);
            mixer.clipAction(firstAnim).play();
        }

        const loaderScreen = document.getElementById('loader-screen');
        loaderScreen.style.opacity = '0';
        setTimeout(() => loaderScreen.style.display = 'none', 400);
    },
    undefined,
    (error) => {
        document.getElementById('loader-text').innerText = 'Помилка завантаження player.glb!';
        console.error(error);
    }
);

document.querySelectorAll('#kit-swatches .swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
        const hex = btn.dataset.color;
        localStorage.setItem('kitColor', hex);
        applyColors(hex, null);
    });
});

document.querySelectorAll('#boots-swatches .swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
        const hex = btn.dataset.color;
        localStorage.setItem('bootsColor', hex);
        applyColors(null, hex);
    });
});

document.querySelectorAll('.cam-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const view = btn.dataset.view;
        if (view === 'full') {
            targetPos.set(0, 1.25, 3.2);
            targetLook.set(0, 0.95, 0);
        } else if (view === 'kit') {
            targetPos.set(0, 1.35, 1.8);
            targetLook.set(0, 1.25, 0);
        } else if (view === 'boots') {
            targetPos.set(0.4, 0.45, 1.5);
            targetLook.set(0, 0.2, 0);
        }
    });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
    camera.position.lerp(targetPos, 0.08);
    controls.target.lerp(targetLook, 0.08);
    controls.update();
    renderer.render(scene, camera);
}
animate();
