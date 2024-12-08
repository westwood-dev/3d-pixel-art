import * as THREE from 'three';

export class Sky {
  time: Date;
  skyMesh: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  sunMesh: THREE.Mesh;
  moonMesh: THREE.Mesh;

  constructor(time: Date = new Date()) {
    this.time = time;

    // Create sky dome
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x87ceeb,
    });
    this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);

    // Create sun
    const sunGeometry = new THREE.CircleGeometry(50, 32);
    const sunMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      side: THREE.DoubleSide,
    });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

    // Create moon
    const moonGeometry = new THREE.CircleGeometry(30, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xaaaaaa,
      side: THREE.DoubleSide,
    });
    this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

    // Create sun light
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.castShadow = true;

    this.updateCelestialBodies();
  }

  setTime(time: string) {
    this.time = new Date('2021-01-01T' + time + ':00');
    this.updateCelestialBodies();
  }

  getTime() {
    return this.time;
  }

  updateCelestialBodies() {
    // Calculate sun position based on time
    const hours = this.time.getHours() + this.time.getMinutes() / 60;
    const angle = (hours - 6) * (Math.PI / 12); // Sun at zenith at noon

    // Sun position
    const sunDistance = 800;
    const sunX = Math.cos(angle) * sunDistance;
    const sunY = Math.sin(angle) * sunDistance;
    this.sunMesh.position.set(sunX, sunY, 0);
    this.sunLight.position.set(sunX, sunY, 0);

    // Moon position (opposite to sun)
    this.moonMesh.position.set(-sunX, -sunY, 0);

    // Make celestial bodies face camera
    this.sunMesh.lookAt(0, 0, 0);
    this.moonMesh.lookAt(0, 0, 0);

    // Update sky color based on sun height
    const dayColor = new THREE.Color(0x87ceeb);
    const nightColor = new THREE.Color(0x000000);
    const t = Math.max(0, Math.sin(angle)); // 0 to 1
    const skyColor = dayColor.lerp(nightColor, 1 - t);
    (this.skyMesh.material as THREE.MeshBasicMaterial).color = skyColor;

    // Update sun light intensity
    this.sunLight.intensity = Math.max(0, Math.sin(angle));
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.skyMesh);
    scene.add(this.sunMesh);
    scene.add(this.moonMesh);
    scene.add(this.sunLight);
  }
}
