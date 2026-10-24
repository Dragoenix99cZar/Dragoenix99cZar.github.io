// engine.js
class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        if (!this.gl) throw new Error('WebGL not supported!');

        const depthExt = this.gl.getExtension('WEBGL_depth_texture');
        if (!depthExt) throw new Error('WEBGL_depth_texture not supported!');

        this.initShaders();
        this.initShadowMap();
        this.initBuffers();
    }

    initShaders() {
        const gl = this.gl;

        const vsSource = `
            attribute vec4 aPosition;
            attribute vec3 aNormal;
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uLightSpaceMatrix;
            varying vec3 vNormal;
            varying vec4 vPositionLightSpace;
            varying vec3 vPos;
            void main() {
                vec4 worldPos = uModelMatrix * aPosition;
                vPos = worldPos.xyz;
                vNormal = mat3(uModelMatrix) * aNormal;
                vPositionLightSpace = uLightSpaceMatrix * worldPos;
                gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec3 vNormal;
            varying vec4 vPositionLightSpace;
            varying vec3 vPos;
            uniform vec4 uColor;
            uniform vec3 uLightPos;
            uniform sampler2D uShadowMap;
            uniform int uIsFloor;
            uniform int uIsWireframe;

            float shadowCalculation(vec4 fragPosLightSpace) {
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;
                if(projCoords.z > 1.0) return 0.0;
                float closestDepth = texture2D(uShadowMap, projCoords.xy).r;
                float currentDepth = projCoords.z;
                float bias = 0.002;
                return (currentDepth - bias > closestDepth) ? 0.7 : 0.0;
            }

            void main() {
                if (uIsWireframe == 1) {
                    gl_FragColor = uColor;
                    return;
                }
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightPos - vPos);
                float diff = max(dot(normal, lightDir), 0.0);

                vec4 baseColor = uColor;
                if(uIsFloor == 1) {
                    vec2 chk = floor(vPos.xz * 1.0);
                    float pattern = mod(chk.x + chk.y, 2.0);
                    baseColor = (pattern > 0.5) ? vec4(0.18, 0.28, 0.20, 1.0) : vec4(0.12, 0.12, 0.12, 1.0);
                }

                float shadow = shadowCalculation(vPositionLightSpace);
                vec3 ambient = 0.45 * baseColor.rgb;
                vec3 diffuse = diff * baseColor.rgb * (1.0 - shadow);
                gl_FragColor = vec4(ambient + diffuse, baseColor.a);
            }
        `;

        const depthVsSource = `
            attribute vec4 aPosition;
            uniform mat4 uLightSpaceMatrix;
            uniform mat4 uModelMatrix;
            void main() {
                gl_Position = uLightSpaceMatrix * uModelMatrix * aPosition;
            }
        `;

        const depthFsSource = `precision mediump float; void main() {}`;

        this.program = this.createShaderProgram(vsSource, fsSource);
        this.depthProgram = this.createShaderProgram(depthVsSource, depthFsSource);
    }

    createShaderProgram(vs, fs) {
        const gl = this.gl;
        const compile = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        };
        const prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(prog);
        return prog;
    }

    initShadowMap() {
        const gl = this.gl;
        this.shadowWidth = 1024;
        this.shadowHeight = 1024;
        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.shadowWidth, this.shadowHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.depthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    initBuffers() {
        const gl = this.gl;
        this.posBuffer = gl.createBuffer();
        this.normBuffer = gl.createBuffer();
        this.floorPosBuffer = gl.createBuffer();
        this.floorNormBuffer = gl.createBuffer();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    renderPass(passType, data) {
        const gl = this.gl;
        const { viewMat, projMat, lightSpaceMat, lightPos, cubeData, cubeNormData, floorData, floorNormData, renderObjects } = data;

        if (passType === 'shadow') {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFramebuffer);
            gl.viewport(0, 0, this.shadowWidth, this.shadowHeight);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.useProgram(this.depthProgram);

            gl.uniformMatrix4fv(gl.getUniformLocation(this.depthProgram, "uLightSpaceMatrix"), false, lightSpaceMat);

            // Draw all objects into shadow map
            gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, cubeData, gl.DYNAMIC_DRAW);
            let aPos = gl.getAttribLocation(this.depthProgram, "aPosition");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

            renderObjects.forEach(obj => {
                gl.uniformMatrix4fv(gl.getUniformLocation(this.depthProgram, "uModelMatrix"), false, obj.matrix);
                gl.drawArrays(gl.TRIANGLES, 0, 36);
            });

        } else if (passType === 'color') {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(0.04, 0.04, 0.04, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.useProgram(this.program);

            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uViewMatrix"), false, viewMat);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uProjectionMatrix"), false, projMat);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uLightSpaceMatrix"), false, lightSpaceMat);
            gl.uniform3fv(gl.getUniformLocation(this.program, "uLightPos"), lightPos);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
            gl.uniform1i(gl.getUniformLocation(this.program, "uShadowMap"), 0);

            // 1. Draw Floor
            gl.uniform1i(gl.getUniformLocation(this.program, "uIsFloor"), 1);
            gl.uniform1i(gl.getUniformLocation(this.program, "uIsWireframe"), 0);
            gl.uniform4f(gl.getUniformLocation(this.program, "uColor"), 1, 1, 1, 1);

            const identityMat = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uModelMatrix"), false, identityMat);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.floorPosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, floorData, gl.STATIC_DRAW);
            let aPos = gl.getAttribLocation(this.program, "aPosition");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.floorNormBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, floorNormData, gl.STATIC_DRAW);
            let aNorm = gl.getAttribLocation(this.program, "aNormal");
            gl.enableVertexAttribArray(aNorm);
            gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // 2. Draw Render Objects (Cubes)
            renderObjects.forEach(obj => {
                gl.uniform1i(gl.getUniformLocation(this.program, "uIsFloor"), 0);
                gl.uniform1i(gl.getUniformLocation(this.program, "uIsWireframe"), 0);
                gl.uniform4f(gl.getUniformLocation(this.program, "uColor"), obj.color[0], obj.color[1], obj.color[2], obj.color[3]);
                gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uModelMatrix"), false, obj.matrix);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, cubeData, gl.DYNAMIC_DRAW);
                aPos = gl.getAttribLocation(this.program, "aPosition");
                gl.enableVertexAttribArray(aPos);
                gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, cubeNormData, gl.STATIC_DRAW);
                aNorm = gl.getAttribLocation(this.program, "aNormal");
                gl.enableVertexAttribArray(aNorm);
                gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.drawArrays(gl.TRIANGLES, 0, 36);
                gl.cullFace(gl.BACK);
                gl.drawArrays(gl.TRIANGLES, 0, 36);
                gl.disable(gl.CULL_FACE);

                // Wireframe Outlines
                gl.uniform1i(gl.getUniformLocation(this.program, "uIsWireframe"), 1);
                gl.uniform4f(gl.getUniformLocation(this.program, "uColor"), 0.95, 0.25, 0.1, 1.0);
                gl.drawArrays(gl.LINES, 0, 36);
            });
        }
    }
}
