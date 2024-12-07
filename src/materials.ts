import { Color, LinearFilter, MeshPhongMaterial, TextureLoader } from 'three';

// Building Material

export let buildingMat = new MeshPhongMaterial({
  color: 0x0000ff,
});

// Window Material

export class WindowMaterial extends MeshPhongMaterial {
  private _on: boolean = true;
  constructor() {
    super();
    this.emissive = new Color(0xfff854);
    this.color = new Color(0x5e5c64);
    this.on = true;
  }

  get on(): boolean {
    return this._on;
  }

  set on(value: boolean) {
    this._on = value;
    this.emissive = new Color(value ? 0xfff854 : 0x000000);
  }

  toggle() {
    this.on = !this.on;
  }
}

// Tarmac Material

export let tarmacMat = new MeshPhongMaterial({
  color: 0x77687b,
});

// Car Park Material

const texLoader = new TextureLoader();
const carParkTex = texLoader.load('textures/carpark-x10.png');
carParkTex.flipY = false;
carParkTex.minFilter = LinearFilter;

export let carParkMat = new MeshPhongMaterial({
  map: carParkTex,
  emissive: 0x000000,
});

// Error Material

export let errorMat = new MeshPhongMaterial({
  color: 0xff1493,
  emissive: 0xff1493,
});
