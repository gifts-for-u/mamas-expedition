/**
 * ============================================================
 * SCENE3D.JS — Interactive Three.js 3D Stage for Mamas Expedition
 * ============================================================
 * Procedural stylized 3D parcel ("pakeett"), 4-flower bouquet,
 * wax-sealed apology envelope, fanned jajan voucher stack,
 * warm bokeh particles, GSAP camera choreography & touch raycaster.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';

export class ExpeditionScene3D {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.mode = 'BOX_CLOSED'; // BOX_CLOSED | BOX_OPENED | FLOWERS | LETTER | VOUCHER
    this.isBoxOpen = false;
    this.isAnimatingOpen = false;
    this.bouquetEndingActive = false;
    this.selectedFlowerId = null;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };

    this.interactiveRoots = [];
    this.flowerGroups = new Map();
    this.burstParticles = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._initRenderer();
    this._initSceneAndLights();
    this._buildStage();
    this._buildAmbientParticles();
    this._buildParcelBox();
    this._buildEmergingItems();
    this._bindEvents();
    this._animate();
  }

  _initRenderer() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x110c1c, 0.042);

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 60);
    this.camera.position.set(0.35, 3.1, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 9.5;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 0.9, 0);
  }

  _initSceneAndLights() {
    // Warm twilight ambient fill
    const hemi = new THREE.HemisphereLight(0xffdfba, 0x241638, 0.85);
    this.scene.add(hemi);

    // Warm golden key light with soft shadow
    const keyLight = new THREE.DirectionalLight(0xffd296, 1.9);
    keyLight.position.set(4.2, 7.5, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Rose-pink rim light from back-left for cinematic depth
    const rimLight = new THREE.DirectionalLight(0xf288a4, 1.15);
    rimLight.position.set(-4.5, 4.2, -4.5);
    this.scene.add(rimLight);

    // Subtle cool lavender fill from front-left
    const fillLight = new THREE.PointLight(0x9b82d6, 0.7, 14);
    fillLight.position.set(-3.5, 2.2, 3.5);
    this.scene.add(fillLight);

    // Inner parcel glow light (activates when box opens)
    this.boxGlowLight = new THREE.PointLight(0xffb76b, 0.0, 7.5, 1.6);
    this.boxGlowLight.position.set(0, 1.15, 0);
    this.scene.add(this.boxGlowLight);

    // Bouquet highlight light (intensifies during flower focus & ending)
    this.bouquetGlowLight = new THREE.PointLight(0xff9eb8, 0.0, 6.0, 1.8);
    this.bouquetGlowLight.position.set(0, 2.4, 0.6);
    this.scene.add(this.bouquetGlowLight);
  }

  _buildStage() {
    // Matte dark-velvet circular pedestal
    const pedestalGeo = new THREE.CylinderGeometry(4.4, 4.7, 0.36, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1b1328,
      roughness: 0.85,
      metalness: 0.08,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.18;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Delicate warm golden ring accent on stage
    const ringGeo = new THREE.RingGeometry(2.65, 2.71, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf4be6b,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    this.scene.add(ring);
  }

  _createBokehTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 245, 224, 1)');
    grad.addColorStop(0.35, 'rgba(244, 190, 107, 0.65)');
    grad.addColorStop(1, 'rgba(244, 190, 107, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  _buildAmbientParticles() {
    const count = 85;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 1.6 + Math.random() * 6.5;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.2 + Math.random() * 4.8;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.12 + Math.random() * 0.25;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: this._createBokehTexture(),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.ambientParticles = new THREE.Points(geo, mat);
    this.ambientParticleSpeeds = speeds;
    this.scene.add(this.ambientParticles);
  }

  _createShippingLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Warm cream shipping sticker background
    ctx.fillStyle = '#fbf2e3';
    ctx.fillRect(0, 0, 512, 320);

    // Subtle border frame
    ctx.strokeStyle = '#3a2736';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 484, 292);

    // Top bar
    ctx.fillStyle = '#241828';
    ctx.fillRect(14, 14, 484, 54);

    ctx.fillStyle = '#f4be6b';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(CONFIG.parcel.sender, 32, 49);

    ctx.fillStyle = '#f288a4';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRIORITY', 388, 49);

    // Main playful "pakeett" stamp
    ctx.fillStyle = '#241828';
    ctx.font = 'bold 74px monospace';
    ctx.fillText(CONFIG.parcel.mainLabel, 34, 152);

    // Recipient line
    ctx.fillStyle = '#7c5368';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`TO: ${CONFIG.parcel.recipient}`, 34, 202);

    // Divider
    ctx.strokeStyle = '#d3bfa6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, 222);
    ctx.lineTo(480, 222);
    ctx.stroke();

    // Decorative barcode with anniversary easter egg
    const barStartX = 36;
    for (let i = 0; i < 38; i++) {
      const w = (i % 3 === 0 ? 5 : 2.5);
      ctx.fillStyle = '#241828';
      ctx.fillRect(barStartX + i * 7.5, 236, w, 40);
    }
    ctx.fillStyle = '#5f4656';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`#${CONFIG.parcel.trackingCode}`, 354, 266);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _buildParcelBox() {
    this.parcelGroup = new THREE.Group();
    this.parcelGroup.userData.interactiveType = 'box';

    const boxW = 2.45;
    const boxH = 1.42;
    const boxD = 1.85;
    const wall = 0.08;

    const outerMat = new THREE.MeshStandardMaterial({
      color: 0xc99668,
      roughness: 0.78,
      metalness: 0.04,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x3b2436,
      roughness: 0.9,
    });
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xe66a88,
      roughness: 0.35,
      metalness: 0.15,
    });

    // Hollow box walls so interior is truly open
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(boxW, wall, boxD), outerMat);
    bottom.position.y = wall / 2;
    bottom.receiveShadow = true;
    bottom.castShadow = true;
    this.parcelGroup.add(bottom);

    const velvetFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(boxW - wall * 2.1, boxD - wall * 2.1),
      innerMat
    );
    velvetFloor.rotation.x = -Math.PI / 2;
    velvetFloor.position.y = wall + 0.005;
    this.parcelGroup.add(velvetFloor);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, wall), outerMat);
    frontWall.position.set(0, boxH / 2, boxD / 2 - wall / 2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    this.parcelGroup.add(frontWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, wall), outerMat);
    backWall.position.set(0, boxH / 2, -boxD / 2 + wall / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.parcelGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wall, boxH, boxD - wall * 2), outerMat);
    leftWall.position.set(-boxW / 2 + wall / 2, boxH / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.parcelGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wall, boxH, boxD - wall * 2), outerMat);
    rightWall.position.set(boxW / 2 - wall / 2, boxH / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.parcelGroup.add(rightWall);

    // Front "pakeett" shipping sticker
    const labelTex = this._createShippingLabelTexture();
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.52, 0.95),
      new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.55 })
    );
    labelMesh.position.set(0, 0.74, boxD / 2 + 0.008);
    this.parcelGroup.add(labelMesh);

    // Side satin ribbon straps on box body
    const ribbonSideL = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH + 0.01, 0.24), ribbonMat);
    ribbonSideL.position.set(-boxW / 2 - 0.005, boxH / 2, 0);
    this.parcelGroup.add(ribbonSideL);

    const ribbonSideR = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH + 0.01, 0.24), ribbonMat);
    ribbonSideR.position.set(boxW / 2 + 0.005, boxH / 2, 0);
    this.parcelGroup.add(ribbonSideR);

    // Hinged Lid Pivot (back top edge)
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(0, boxH, -boxD / 2);
    this.parcelGroup.add(this.lidPivot);

    const lidThickness = 0.16;
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xd6a477,
      roughness: 0.72,
      metalness: 0.05,
    });
    const lidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.12, lidThickness, boxD + 0.12),
      lidMat
    );
    lidMesh.position.set(0, lidThickness / 2, boxD / 2);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    this.lidPivot.add(lidMesh);

    // Cross ribbons on lid
    const lidRibX = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.15, lidThickness + 0.02, 0.24),
      ribbonMat
    );
    lidRibX.position.set(0, lidThickness / 2, boxD / 2);
    this.lidPivot.add(lidRibX);

    const lidRibZ = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, lidThickness + 0.02, boxD + 0.15),
      ribbonMat
    );
    lidRibZ.position.set(0, lidThickness / 2, boxD / 2);
    this.lidPivot.add(lidRibZ);

    // Sculpted 3D Satin Bow on top of lid
    this.bowGroup = new THREE.Group();
    this.bowGroup.position.set(0, lidThickness + 0.06, boxD / 2);

    const loopGeo = new THREE.TorusGeometry(0.24, 0.065, 12, 24);
    const loopAngles = [0.4, Math.PI - 0.4, Math.PI + 0.4, -0.4];
    loopAngles.forEach((ang) => {
      const loop = new THREE.Mesh(loopGeo, ribbonMat);
      loop.rotation.y = ang;
      loop.rotation.x = Math.PI * 0.22;
      loop.position.set(Math.cos(ang) * 0.18, 0.1, Math.sin(ang) * 0.18);
      loop.castShadow = true;
      this.bowGroup.add(loop);
    });

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), ribbonMat);
    knot.scale.set(1, 0.75, 1);
    knot.position.y = 0.08;
    this.bowGroup.add(knot);

    this.lidPivot.add(this.bowGroup);

    this.scene.add(this.parcelGroup);
    this.interactiveRoots.push(this.parcelGroup);
  }

  _buildEmergingItems() {
    this.itemsGroup = new THREE.Group();
    this.scene.add(this.itemsGroup);

    // 1. Apology Envelope (Left)
    this.letterObj = this._createEnvelope3D();
    this.letterObj.userData.interactiveType = 'letter';
    this.letterObj.position.set(0, 0.65, 0);
    this.letterObj.scale.setScalar(0.01);
    this.letterObj.visible = false;
    this.itemsGroup.add(this.letterObj);
    this.interactiveRoots.push(this.letterObj);

    // 2. Flower Bouquet (Center)
    this.bouquetObj = this._createBouquet3D();
    this.bouquetObj.userData.interactiveType = 'flowers';
    this.bouquetObj.position.set(0, 0.7, 0);
    this.bouquetObj.scale.setScalar(0.01);
    this.bouquetObj.visible = false;
    this.itemsGroup.add(this.bouquetObj);
    this.interactiveRoots.push(this.bouquetObj);

    // 3. Voucher Ticket Stack (Right)
    this.voucherObj = this._createVoucherStack3D();
    this.voucherObj.userData.interactiveType = 'voucher';
    this.voucherObj.position.set(0, 0.65, 0);
    this.voucherObj.scale.setScalar(0.01);
    this.voucherObj.visible = false;
    this.itemsGroup.add(this.voucherObj);
    this.interactiveRoots.push(this.voucherObj);
  }

  _createEnvelope3D() {
    const group = new THREE.Group();

    // Envelope canvas texture for crisp front fold & handwritten vibe
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8ecd9';
    ctx.fillRect(0, 0, 512, 340);

    // Subtle warm frame
    ctx.strokeStyle = '#dcc5a4';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, 488, 316);

    // Envelope triangular flap lines
    ctx.strokeStyle = '#ceb28e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(12, 16);
    ctx.lineTo(256, 185);
    ctx.lineTo(500, 16);
    ctx.stroke();

    ctx.fillStyle = '#6a4c5e';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SURAT MAAF', 256, 266);

    ctx.fillStyle = '#a07e8c';
    ctx.font = '20px monospace';
    ctx.fillText('untuk sayang', 256, 298);

    const envTex = new THREE.CanvasTexture(canvas);
    envTex.colorSpace = THREE.SRGBColorSpace;

    const sideMat = new THREE.MeshStandardMaterial({ color: 0xebd8bc, roughness: 0.72 });
    const frontMat = new THREE.MeshStandardMaterial({ map: envTex, roughness: 0.62 });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.9, 0.08),
      [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat]
    );
    body.castShadow = true;
    group.add(body);

    // Crimson wax seal in center
    const seal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.15, 0.045, 24),
      new THREE.MeshStandardMaterial({
        color: 0xd94869,
        roughness: 0.3,
        metalness: 0.18,
        emissive: 0x4b1220,
      })
    );
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, -0.02, 0.055);
    group.add(seal);

    return group;
  }

  _createBouquet3D() {
    const group = new THREE.Group();

    // Kraft wrapping paper cone
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xe6cdb0,
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    const innerWrapMat = new THREE.MeshStandardMaterial({
      color: 0xfbf2e8,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    const outerCone = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.35, 24, 1, true), wrapMat);
    outerCone.rotation.x = Math.PI;
    outerCone.position.y = -0.22;
    outerCone.castShadow = true;
    group.add(outerCone);

    const innerCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.28, 24, 1, true), innerWrapMat);
    innerCone.rotation.x = Math.PI;
    innerCone.position.y = -0.14;
    group.add(innerCone);

    // Satin ribbon tie around cone waist
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.045, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xe66a88, roughness: 0.35 })
    );
    tie.rotation.x = Math.PI / 2;
    tie.position.y = -0.45;
    group.add(tie);

    // Foliage leaves tucked around rim
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f8a5b, roughness: 0.65 });
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), leafMat);
      leaf.scale.set(0.55, 1.35, 0.18);
      leaf.position.set(Math.cos(ang) * 0.42, 0.42, Math.sin(ang) * 0.42);
      leaf.rotation.z = -Math.cos(ang) * 0.65;
      leaf.rotation.x = Math.sin(ang) * 0.65;
      group.add(leaf);
    }

    // Baby's breath delicate glowing pearls
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xfff8ee,
      emissive: 0xffd79e,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2 + 0.2;
      const r = 0.25 + (i % 3) * 0.16;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), pearlMat);
      pearl.position.set(Math.cos(ang) * r, 0.56 + (i % 3) * 0.12, Math.sin(ang) * r);
      group.add(pearl);
    }

    // 4 Distinct Interactive Flowers
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7348, roughness: 0.7 });

    const rose = this._buildRoseFlower();
    rose.position.set(-0.24, 0.86, 0.24);
    rose.rotation.set(0.25, 0.3, 0.22);
    this._registerFlower(group, rose, 'rose', stemMat);

    const tulip = this._buildTulipFlower();
    tulip.position.set(0.28, 0.9, 0.2);
    tulip.rotation.set(0.22, -0.35, -0.2);
    this._registerFlower(group, tulip, 'tulip', stemMat);

    const sunflower = this._buildSunflower();
    sunflower.position.set(0.02, 1.04, -0.18);
    sunflower.rotation.set(-0.18, 0, 0.05);
    this._registerFlower(group, sunflower, 'sunflower', stemMat);

    const daisy = this._buildDaisyFlower();
    daisy.position.set(-0.28, 0.78, -0.18);
    daisy.rotation.set(-0.12, 0.5, 0.28);
    this._registerFlower(group, daisy, 'daisy', stemMat);

    // Subtle soft glow aura sprite behind bouquet
    const auraMat = new THREE.SpriteMaterial({
      map: this._createBokehTexture(),
      color: 0xffb3c6,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.bouquetAura = new THREE.Sprite(auraMat);
    this.bouquetAura.scale.set(2.4, 2.4, 1);
    this.bouquetAura.position.set(0, 0.72, -0.1);
    group.add(this.bouquetAura);

    return group;
  }

  _registerFlower(parent, flowerGroup, flowerId, stemMat) {
    flowerGroup.userData.flowerId = flowerId;
    flowerGroup.userData.interactiveType = 'flowers';
    flowerGroup.userData.baseY = flowerGroup.position.y;

    // Add slender stem downwards into cone
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.9, 8), stemMat);
    stem.position.y = -0.45;
    flowerGroup.add(stem);

    // Invisible larger tap sphere so small fingers can easily hit each flower
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData.flowerId = flowerId;
    hitSphere.userData.interactiveType = 'flowers';
    flowerGroup.add(hitSphere);

    parent.add(flowerGroup);
    this.flowerGroups.set(flowerId, flowerGroup);
  }

  _buildRoseFlower() {
    const g = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xe85d75,
      emissive: 0x3b0c19,
      emissiveIntensity: 0.35,
      roughness: 0.45,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xc93b57,
      roughness: 0.4,
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), innerMat);
    g.add(core);

    // 2 spiral rings of sculpted petals
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 5 : 7;
      const radius = ring === 0 ? 0.11 : 0.19;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + ring * 0.45;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), petalMat);
        p.scale.set(0.95, 1.15, 0.38);
        p.position.set(Math.cos(ang) * radius, ring * 0.02, Math.sin(ang) * radius);
        p.rotation.y = -ang + Math.PI / 2;
        p.rotation.x = ring === 0 ? -0.35 : -0.68;
        p.castShadow = true;
        g.add(p);
      }
    }
    return g;
  }

  _buildTulipFlower() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf6a192,
      emissive: 0x3f1b14,
      emissiveIntensity: 0.3,
      roughness: 0.42,
    });

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), mat);
      p.scale.set(0.72, 1.55, 0.36);
      p.position.set(Math.cos(ang) * 0.1, 0.09, Math.sin(ang) * 0.1);
      p.rotation.y = -ang + Math.PI / 2;
      p.rotation.x = -0.18;
      p.castShadow = true;
      g.add(p);
    }
    return g;
  }

  _buildSunflower() {
    const g = new THREE.Group();
    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.07, 18),
      new THREE.MeshStandardMaterial({ color: 0x4d2e1b, roughness: 0.85 })
    );
    center.rotation.x = Math.PI / 2;
    g.add(center);

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf4c553,
      emissive: 0x452d05,
      emissiveIntensity: 0.32,
      roughness: 0.45,
    });

    const count = 13;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), petalMat);
      p.scale.set(0.55, 1.5, 0.25);
      p.position.set(Math.cos(ang) * 0.21, Math.sin(ang) * 0.21, -0.01);
      p.rotation.z = ang - Math.PI / 2;
      g.add(p);
    }
    return g;
  }

  _buildDaisyFlower() {
    const g = new THREE.Group();
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xf4be6b,
        emissive: 0x4a3208,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })
    );
    g.add(center);

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf9f3ea,
      emissive: 0x261f29,
      emissiveIntensity: 0.25,
      roughness: 0.4,
    });

    const count = 10;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), petalMat);
      p.scale.set(0.55, 1.5, 0.22);
      p.position.set(Math.cos(ang) * 0.17, Math.sin(ang) * 0.17, 0);
      p.rotation.z = ang - Math.PI / 2;
      g.add(p);
    }
    return g;
  }

  _createVoucherCardTexture(title, accentHex, subtitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 290;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#251a33';
    ctx.fillRect(0, 0, 512, 290);

    // Dashed ticket border
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(16, 16, 480, 258);
    ctx.setLineDash([]);

    // Top tag
    ctx.fillStyle = accentHex;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('MAMAS EXPEDITION // TICKET', 38, 64);

    // Main title
    ctx.fillStyle = '#fbf4ec';
    ctx.font = 'bold 46px monospace';
    ctx.fillText(title, 38, 152);

    ctx.fillStyle = '#cbbcd0';
    ctx.font = '24px monospace';
    ctx.fillText(subtitle, 38, 206);

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('TAP TO CLAIM VIA WHATSAPP →', 38, 250);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _createVoucherStack3D() {
    const group = new THREE.Group();
    const specs = [
      { title: 'VOUCHER JAJAN', sub: '3 pilihan spesial', accent: '#f4be6b', z: 0.06, rot: 0, x: 0 },
      { title: 'SUSHI MOY', sub: 'traktiran mamas', accent: '#f59c72', z: 0.0, rot: -0.14, x: -0.1 },
      { title: 'MATCHA FRAPPE', sub: 'ademin mood', accent: '#7bc98b', z: -0.06, rot: 0.14, x: 0.1 },
    ];

    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x3d2c52, roughness: 0.6 });

    specs.forEach((s) => {
      const tex = this._createVoucherCardTexture(s.title, s.accent, s.sub);
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 });
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.36, 0.78, 0.045),
        [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat]
      );
      card.position.set(s.x, 0, s.z);
      card.rotation.z = s.rot;
      card.castShadow = true;
      group.add(card);
    });

    return group;
  }

  _spawnSparkleBurst(origin = new THREE.Vector3(0, 1.5, 0), count = 28) {
    if (this.reducedMotion) return;
    const mat = new THREE.SpriteMaterial({
      map: this._createBokehTexture(),
      color: 0xffd28a,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < count; i++) {
      const sp = new THREE.Sprite(mat.clone());
      sp.position.copy(origin);
      const scale = 0.12 + Math.random() * 0.18;
      sp.scale.set(scale, scale, 1);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      sp.userData = {
        vx: Math.cos(angle) * speed,
        vy: 1.5 + Math.random() * 2.4,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.6,
      };
      this.scene.add(sp);
      this.burstParticles.push(sp);
    }
  }

  /* ============================================================
     PUBLIC CHOREOGRAPHY METHODS (GSAP)
     ============================================================ */

  openBox() {
    if (this.isBoxOpen || this.isAnimatingOpen) return;
    this.isAnimatingOpen = true;

    const tl = window.gsap.timeline({
      onComplete: () => {
        this.isBoxOpen = true;
        this.isAnimatingOpen = false;
        this.mode = 'BOX_OPENED';
        if (this.callbacks.onBoxOpened) this.callbacks.onBoxOpened();
      },
    });

    // 1. Lift & fade ribbon bow
    tl.to(this.bowGroup.position, { y: 0.85, duration: 0.45, ease: 'power2.out' }, 0);
    tl.to(this.bowGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: 'power2.in' }, 0.12);

    // 2. Swing hinged lid open cleanly
    tl.to(this.lidPivot.rotation, { x: -Math.PI * 0.64, duration: 0.85, ease: 'back.out(1.25)' }, 0.2);

    // 3. Ignite warm inner box light + sparkle burst
    tl.to(this.boxGlowLight, { intensity: 3.4, duration: 0.65, ease: 'power2.out' }, 0.35);
    tl.call(() => this._spawnSparkleBurst(new THREE.Vector3(0, 1.45, 0), 32), null, 0.42);

    // 4. Emerge & fan out the 3 objects in a balanced landscape arc
    this.letterObj.visible = true;
    this.bouquetObj.visible = true;
    this.voucherObj.visible = true;

    tl.to(this.letterObj.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.48);
    tl.to(this.letterObj.position, { x: -2.15, y: 1.75, z: 0.35, duration: 0.85, ease: 'power3.out' }, 0.48);
    tl.to(this.letterObj.rotation, { y: 0.32, z: 0.06, duration: 0.85, ease: 'power2.out' }, 0.48);

    tl.to(this.bouquetObj.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.75, ease: 'back.out(1.4)' }, 0.56);
    tl.to(this.bouquetObj.position, { x: 0, y: 2.02, z: 0.08, duration: 0.9, ease: 'power3.out' }, 0.56);

    tl.to(this.voucherObj.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.64);
    tl.to(this.voucherObj.position, { x: 2.15, y: 1.75, z: 0.35, duration: 0.85, ease: 'power3.out' }, 0.64);
    tl.to(this.voucherObj.rotation, { y: -0.32, z: -0.05, duration: 0.85, ease: 'power2.out' }, 0.64);

    // 5. Pull camera smoothly into wide landscape showcase
    this._moveCamera({ x: 0, y: 3.15, z: 6.95 }, { x: 0, y: 1.62, z: 0.1 }, 1.15);
  }

  focusOverview() {
    this.mode = this.isBoxOpen ? 'BOX_OPENED' : 'BOX_CLOSED';
    this.bouquetEndingActive = false;
    this.selectedFlowerId = null;
    this._resetFlowerHighlights();

    if (this.isBoxOpen) {
      window.gsap.to(this.bouquetGlowLight, { intensity: 0.5, duration: 0.5 });
      this._moveCamera({ x: 0, y: 3.15, z: 6.95 }, { x: 0, y: 1.62, z: 0.1 }, 0.85);
    } else {
      this._moveCamera({ x: 0.35, y: 3.1, z: 6.2 }, { x: 0, y: 0.9, z: 0 }, 0.85);
    }
  }

  focusBouquet() {
    this.mode = 'FLOWERS';
    this.bouquetEndingActive = true;

    // Frame bouquet nicely on the LEFT half in landscape so the right side panel doesn't cover it
    const isLandscape = window.innerWidth >= window.innerHeight;
    const camPos = isLandscape ? { x: 1.05, y: 2.95, z: 3.45 } : { x: 0, y: 3.15, z: 3.85 };
    const target = isLandscape ? { x: 0.82, y: 2.48, z: 0.08 } : { x: 0, y: 2.25, z: 0.08 };

    this._moveCamera(camPos, target, 0.95);

    window.gsap.killTweensOf(this.bouquetGlowLight);
    window.gsap.killTweensOf(this.bouquetAura.material);
    window.gsap.fromTo(
      this.bouquetGlowLight,
      { intensity: 0.8 },
      { intensity: 2.9, duration: 1.5, ease: 'power2.out' }
    );
    window.gsap.to(this.bouquetAura.material, { opacity: 0.7, duration: 1.2, ease: 'power2.out' });
    this._spawnSparkleBurst(this.bouquetObj.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 22);
  }

  focusLetter() {
    this.mode = 'LETTER';
    this._moveCamera({ x: -1.65, y: 2.25, z: 4.1 }, { x: -2.0, y: 1.75, z: 0.3 }, 0.75);
  }

  focusVoucher() {
    this.mode = 'VOUCHER';
    this._moveCamera({ x: 1.65, y: 2.25, z: 4.1 }, { x: 2.0, y: 1.75, z: 0.3 }, 0.75);
  }

  _resetFlowerHighlights() {
    this.flowerGroups.forEach((fg) => {
      window.gsap.to(fg.scale, { x: 1, y: 1, z: 1, duration: 0.28, ease: 'power2.out' });
    });
  }

  _moveCamera(pos, target, duration = 0.85) {
    window.gsap.killTweensOf(this.camera.position);
    window.gsap.killTweensOf(this.controls.target);

    window.gsap.to(this.camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration,
      ease: 'power3.inOut',
    });
    window.gsap.to(this.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration,
      ease: 'power3.inOut',
    });
  }

  /* ============================================================
     INPUT / RAYCASTING / RESIZE
     ============================================================ */

  _bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    });

    dom.addEventListener('pointerup', (e) => {
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) > 10) return; // Ignore orbit drag

      this._handleTap(e.clientX, e.clientY);
    });

    dom.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const hit = this._raycast(e.clientX, e.clientY);
      dom.style.cursor = hit ? 'pointer' : 'grab';
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  _raycast(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveRoots, true);

    for (const hit of hits) {
      let node = hit.object;
      let flowerId = null;
      let interactiveType = null;

      while (node) {
        if (!flowerId && node.userData?.flowerId) {
          flowerId = node.userData.flowerId;
        }
        if (!interactiveType && node.userData?.interactiveType) {
          interactiveType = node.userData.interactiveType;
        }
        node = node.parent;
      }

      if (interactiveType) {
        return { interactiveType, flowerId };
      }
    }
    return null;
  }

  _handleTap(clientX, clientY) {
    const hit = this._raycast(clientX, clientY);
    if (!hit) return;

    if (!this.isBoxOpen && hit.interactiveType === 'box') {
      if (this.callbacks.onRequestOpenBox) this.callbacks.onRequestOpenBox();
      return;
    }

    if (!this.isBoxOpen) return;

    if (this.mode === 'FLOWERS' && hit.flowerId) {
      if (this.callbacks.onSelectFlower) this.callbacks.onSelectFlower(hit.flowerId);
      return;
    }

    if (this.mode === 'BOX_OPENED') {
      if (hit.interactiveType === 'flowers' && this.callbacks.onOpenFlowers) {
        this.callbacks.onOpenFlowers(hit.flowerId);
      } else if (hit.interactiveType === 'letter' && this.callbacks.onOpenLetter) {
        this.callbacks.onOpenLetter();
      } else if (hit.interactiveType === 'voucher' && this.callbacks.onOpenVoucher) {
        this.callbacks.onOpenVoucher();
      }
    }
  }

  /* ============================================================
     ANIMATION LOOP
     ============================================================ */

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsedTime();

    this.controls.update();

    if (!this.reducedMotion) {
      // Gentle breathing float for closed box
      if (!this.isBoxOpen && !this.isAnimatingOpen) {
        this.parcelGroup.position.y = Math.sin(t * 1.8) * 0.035;
      }

      // Gentle independent bobbing for the 3 emerged objects
      if (this.isBoxOpen) {
        this.letterObj.position.y = 1.75 + Math.sin(t * 1.9 + 0.4) * 0.065;
        this.voucherObj.position.y = 1.75 + Math.sin(t * 1.9 + 2.2) * 0.065;

        const bouquetAmp = this.bouquetEndingActive ? 0.11 : 0.055;
        this.bouquetObj.position.y = 2.02 + Math.sin(t * 1.65) * bouquetAmp;

        if (this.mode === 'FLOWERS' || this.bouquetEndingActive) {
          this.bouquetObj.rotation.y += dt * (this.bouquetEndingActive ? 0.45 : 0.22);
        }
        if (this.bouquetEndingActive) {
          this.bouquetAura.material.opacity = 0.55 + Math.sin(t * 2.8) * 0.22;
        }
      }

      // Ambient drifting fireflies
      const posAttr = this.ambientParticles.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + this.ambientParticleSpeeds[i] * dt;
        if (y > 5.0) y = 0.2;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // Update sparkle burst particles
      for (let i = this.burstParticles.length - 1; i >= 0; i--) {
        const sp = this.burstParticles[i];
        const d = sp.userData;
        d.life += dt;
        if (d.life >= d.maxLife) {
          this.scene.remove(sp);
          sp.material.dispose();
          this.burstParticles.splice(i, 1);
          continue;
        }
        sp.position.x += d.vx * dt;
        sp.position.y += d.vy * dt;
        sp.position.z += d.vz * dt;
        d.vy -= 2.4 * dt;
        sp.material.opacity = 1 - d.life / d.maxLife;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
