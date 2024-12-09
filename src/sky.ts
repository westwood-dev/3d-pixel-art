import * as THREE from 'three';

export class Sky {
  time: Date;
  skyMesh: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  sunMesh: THREE.Mesh;
  moonMesh: THREE.Mesh;
  skyGroup: THREE.Group;

  constructor(time: Date = new Date()) {
    this.time = time;
    this.skyGroup = new THREE.Group();

    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x87ceeb,
    });
    this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.skyGroup.add(this.skyMesh);

    const sunGeometry = new THREE.CircleGeometry(1, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.skyGroup.add(this.sunMesh);

    console.log('this.sunMesh', this.sunMesh);

    const moonGeometry = new THREE.CircleGeometry(1, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    this.skyGroup.add(this.moonMesh);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 2000;

    this.skyGroup.add(this.sunLight);

    this.skyGroup.rotation.y = Math.PI / 4;

    this.updateCelestialBodies();
  }

  setTime(time: string | number) {
    if (typeof time === 'number') {
      const hours = Math.floor(time);
      const minutes = Math.round((time % 1) * 60);
      time = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }
    this.time = new Date(`2021-01-01T${time}:00`);
    this.updateCelestialBodies();
  }

  getTime() {
    return this.time;
  }

  updateCelestialBodies() {
    const hours = this.time.getHours() + this.time.getMinutes() / 60;
    const angle = (hours - 6) * (Math.PI / 12); // Sun at zenith at noon

    const sunDistance = 200;
    const sunX = Math.cos(angle) * sunDistance;
    const sunY = Math.sin(angle) * sunDistance;
    this.sunMesh.position.set(sunX, sunY, 0);
    this.sunLight.position.set(sunX, sunY, 0);

    this.moonMesh.position.set(-sunX, -sunY, 0);

    this.sunMesh.lookAt(0, 0, 0);
    this.moonMesh.lookAt(0, 0, 0);

    const dayColor = new THREE.Color(0x87ceeb);
    const nightColor = new THREE.Color(0x1a2456);
    const t = (Math.sin(angle) + 1) / 2; // 0 to 1
    const skyColor = dayColor.lerp(nightColor, 1 - t);
    (this.skyMesh.material as THREE.MeshBasicMaterial).color = skyColor;

    this.sunLight.intensity = Math.max(0, Math.sin(angle));
  }

  setRotation(degrees: number) {
    this.skyGroup.rotation.y = (degrees * Math.PI) / 180;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.skyGroup);
  }
}
