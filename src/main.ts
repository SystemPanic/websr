
import WebGPUContext from './context'
import WebSRRenderer from "./renderer";
import NeuralNetwork from "./networks/base_network";


export default class WebSR {
    private canvas: HTMLCanvasElement;
    private context: WebGPUContext;
    private network: NeuralNetwork;
    private renderer: WebSRRenderer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = new WebGPUContext(canvas);
        this.network = new NeuralNetwork(this.context);
        this.renderer = new WebSRRenderer(this.context.device, this.network);

    }

    async initWebGPU(): Promise<boolean>{
        return await this.context.load();
    }

    async loadImage(image: HTMLImageElement | ImageBitmap){
        if(image ! instanceof ImageBitmap) image = await createImageBitmap(image);
        await this.renderer.loadImage(image);
    }

    async render(){
        await this.renderer.render()
    }


}