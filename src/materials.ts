import {
  Color,
  LinearFilter,
  MeshPhongMaterial,
  Object3D,
  TextureLoader,
} from 'three';

import type { MaterialMappings } from './types';

// Building Material

export let buildingMat = new MeshPhongMaterial({
  color: 0x0000ff,
});

// Window Material

export class WindowMaterial extends MeshPhongMaterial {
  private _on: boolean = true;
  private _colour: number;

  constructor(colour: number = 0xfff854) {
    super();
    this._colour = colour;
    this.emissive = new Color(colour);
    this.color = new Color(0x5e5c64);
    this.on = true;
  }

  get on(): boolean {
    return this._on;
  }

  set on(value: boolean) {
    this._on = value;
    this.emissive = new Color(value ? this._colour : 0x000000);
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

// Random Colour Material
export class RandomColour extends MeshPhongMaterial {
  constructor() {
    super();
    this.color = new Color(Math.random() * 0xffffff);
  }
}

// Random Bright Colour Material

export class RandomBrightColour extends RandomColour {
  constructor() {
    super();
    // this.color = new Color(Math.random() * 0xffffff);
    this.emissive = this.color;
  }
}

// Gray Material

export let grayMat = new MeshPhongMaterial({
  color: 0x5d5d5d,
  emissive: 0x000000,
});

// Tyre Material

export let tyreMat = new MeshPhongMaterial({
  color: 0x000000,
  emissive: 0x000000,
});

// Headlight Material

export let headlightMat = new WindowMaterial();

// Taillight Material

export let taillightMat = new WindowMaterial(0xff0000);

// Error Material

export let errorMat = new MeshPhongMaterial({
  color: 0xff1493,
  emissive: 0xff1493,
});

// Material Mapping

export const materialMappings: MaterialMappings = {
  //! Building Materials
  'building-window': {
    material: () => new WindowMaterial(),
    addToGUI: true,
  },
  building: { material: buildingMat },
  //! Road Materials
  carpark: { material: carParkMat },
  tarmac: { material: tarmacMat },
  //! Tube Materials
  tube: { material: () => new RandomColour() },
  //! Car Materials`
  'car-body': { material: () => new MeshPhongMaterial({ color: 0xffffff }) },
  'car-window': {
    material: () => {
      const mat = new WindowMaterial();
      mat.on = false;
      return mat;
    },
    addToGUI: true,
  },
  'car-gray': { material: grayMat },
  'car-wheel': { material: grayMat },
  'car-tyre': { material: tyreMat },
  'car-headlight': { material: headlightMat },
  'car-taillight': { material: taillightMat },
  car: { material: () => new RandomBrightColour() },
  //! Bus Materials
  'bus-body': { material: () => new MeshPhongMaterial({ color: 0x0000ff }) },
  'bus-window': {
    material: () => {
      const mat = new WindowMaterial();
      mat.on = false;
      return mat;
    },
  },
  'bus-details': { material: grayMat },
  'bus-wheel': { material: tyreMat },
  'bus-headlights': { material: headlightMat },
  'bus-taillights': { material: taillightMat },
  bus: { material: () => new RandomBrightColour() },
  'streetlight-mesh': {
    material: () => new MeshPhongMaterial({ color: 0xefefef }),
  },
};
