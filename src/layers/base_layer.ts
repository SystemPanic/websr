
interface Uniform {
    name: string,
    type: string
}

class Layer {

    device: GPUDevice;
    shader: GPUShaderModule;
    pipeline: GPURenderPipeline;
    sampler: GPUSampler;
    renderPassDescriptor: GPURenderPassDescriptor;
    bindGroup: GPUBindGroup;
    label: string;
    inputTexture: GPUTexture;
    outputTexture: GPUTexture;
    uniforms: Uniform[];
    buffers: any;

    constructor(device:GPUDevice, inputTexture: GPUTexture, outputTexture:GPUTexture){
        this.device = device;
        this.inputTexture = inputTexture;
        this.outputTexture = outputTexture;
        this.uniforms =  [];
        this.buffers = {};
    }



    defaultVertexShader(){

        return `
        
             struct VertexShaderOutput {
                @builtin(position) position: vec4f,
                @location(0) tex_coord: vec2f,
              };

            @vertex
            fn vertexMain( @builtin(vertex_index) vertexIndex : u32) ->  VertexShaderOutput{
                let pos = array(
                // 1st triangle
                vec2f( -1.0,  -1.0),  // center
                vec2f( 1.0,  -1.0),  // right, center
                vec2f( -1.0,  1.0),  // center, top
             
                // 2st triangle
                vec2f( -1.0,  1.0),  // center, top
                vec2f( 1.0,  -1.0),  // right, center
                vec2f( 1.0,  1.0),  // right, top
              );
             
              var vsOutput: VertexShaderOutput;
              let xy = pos[vertexIndex];
              vsOutput.position = vec4f(xy, 0.0, 1.0);
              vsOutput.tex_coord = xy*0.5 + 0.5;
              return vsOutput;
            }
        `
    }


    createUniform(name:string, type:string){

        this.uniforms.push({name, type});

    }


    defaultPipelineConfig(): GPURenderPipelineDescriptor{

        return {
            label: `${this.label}-pipeline`,
            layout: 'auto',
            vertex: {
                module: this.shader,
                entryPoint: 'vertexMain',
            },
            fragment: {
                module: this.shader,
                entryPoint: 'fragmentMain',
                targets: [{format: this.outputTexture.format}],
            },
        }

    }

    defaultSetup(){

        this.pipeline = this.device.createRenderPipeline(this.defaultPipelineConfig());

        this.sampler = this.device.createSampler();

        this.bindGroup = this.defaultBindGroup();

        this.renderPassDescriptor = this.defaultRenderPassDescriptor();
    }

    defaultRenderPassDescriptor(): GPURenderPassDescriptor{

        return   {
            label: `${this.label}-render-pass`,
            colorAttachments: [
                {
                    view:  this.outputTexture.createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

    }

    createStandardShader(fragmentShader: string): GPUShaderModule{


        return  this.device.createShaderModule({
            label: `${this.label}-shader`,
            code: `
          
              ${this.defaultVertexShader()}
              
              ${this.fragmentShaderInputs()}
              
              ${fragmentShader}
        `
        });



    }


    fragmentShaderInputs(){

        const inputs = [
        '@group(0) @binding(0) var textureSampler: sampler;',
        '@group(0) @binding(1) var inputTexture: texture_2d<f32>;'
        ];

        this.uniforms.forEach((uniform,i)=>{
            inputs.push(
                `@group(0) @binding(${i+2}) var <uniform> ${uniform.name}: ${uniform.type};`,
            )
        });

        return inputs.join('\n');

    }


    setUniform(name: string, value: Float32Array)  {

        const buffer= this.device.createBuffer({
            label: `layer-${this.label}-buffer-${name}`,
            size: value.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });


        this.device.queue.writeBuffer(buffer, /*bufferOffset=*/0, value);

        this.buffers[name] = buffer;


    }


    defaultBindGroup(){

        const entries: any[]  = [
            { binding: 0, resource: this.sampler },
            { binding: 1, resource: this.inputTexture.createView()}

        ];

        this.uniforms.forEach((uniform, i)=>{
            entries.push(
                {
                    binding: i+2,
                    resource: {
                        buffer: this.buffers[uniform.name]
                    }
                }
            )
        });

         return this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries
        });
    }

    run(){


        const encoder = this.device.createCommandEncoder({label: this.label});

        const pass = encoder.beginRenderPass(this.renderPassDescriptor);

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);  // call our vertex shader 6 times
        pass.end();

        this.device.queue.submit([encoder.finish()]);


    }


}

export default Layer;