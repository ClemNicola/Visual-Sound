precision mediump float; 

varying vec2 vTexCoord;
varying vec3 vNormal;
varying float vNoise;

uniform float uTime;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureResolution;


void main (){
  
    vec3 color = vec3(vTexCoord.y);

    vec2 ratio = vec2(
        min((uResolution.x / uResolution.y) / (uTextureResolution.x / uTextureResolution.y), 1.0),
        min((uResolution.y / uResolution.x) / (uTextureResolution.y / uTextureResolution.x), 1.0)
    );

    vec2 uv = vec2(
        vTexCoord.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vTexCoord.y * ratio.y + (1.0 - ratio.y) * 0.5
    );


    vec4 texture = texture2D(uTexture, uv);


    gl_FragColor = texture;
}