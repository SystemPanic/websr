/// <reference types="@webgpu/types" />
import ComputeLayer from "../base_compute_layer";
declare class Anime4KConv16x4 extends ComputeLayer {
    label: string;
    constructor(inputs: GPUBuffer[], outputBuffer: GPUBuffer, weights: any);
}
export default Anime4KConv16x4;
