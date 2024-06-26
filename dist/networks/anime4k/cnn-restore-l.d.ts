import Layer from "../../layers/base_layer";
import NeuralNetwork from "../base_network";
export default class Anime4KCNNRL extends NeuralNetwork {
    constructor(weights: any);
    model(): Layer[];
    feedForward(source?: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<void>;
}
