precision mediump float; 

varying vec2 vTexCoord;
varying vec3 vNormal;
varying float vNoise;

uniform float uTime;

uniform sampler2D uCamera;
uniform sampler2D uTexture;
uniform sampler2D uDmap;

uniform vec2 uResolution;
uniform vec2 uTextureResolution;

uniform float uFrequency;
uniform float uAmplitude;

mat2 scale(vec2 _scale) {
    return mat2(_scale.x, 0.0, 0.0, _scale.y);
}


void main (){
  
    vec3 color = vec3(vTexCoord.y);

    //Pour le rectanle jusqu'a ligne 37
    //vec2 ratio = vec2(
    //    min((uResolution.x / uResolution.y) / (uTextureResolution.x / uTextureResolution.y), 1.0),
    //    min((uResolution.y / uResolution.x) / (uTextureResolution.y / uTextureResolution.x), 1.0)
    //);

    //vec2 uv = vec2(
    //    vTexCoord.x * ratio.x + (1.0 - ratio.x) * 0.5,
    //    vTexCoord.y * ratio.y + (1.0 - ratio.y) * 0.5
    //);

    vec2 uv = vTexCoord;
    
    

    float frequency = uFrequency;
    float amplitude = uAmplitude;

    float distortion = sin(uv.y * uFrequency + (uTime * 0.01)) * uAmplitude;

    vec4 dMap = texture2D(uDmap, uv);

    float dMapColor = dot(dMap.rgb, vec3(frequency));
    float displacementVal = dMapColor *  amplitude;

    uv -= vec2(0.5);
    uv = scale(2.0 - vec2(sin(displacementVal) + 1.0)) * uv;
    uv += vec2(0.5);

    vec4 cover = texture2D(uTexture, uv);
    vec4 camera = texture2D(uCamera, vec2(1.0 - uv.x, uv.y));
    //vec4 texture = texture2D(uTexture, uv);


    gl_FragColor = texture2D(uTexture, uv + vec2(distortion, 0.0));
    //gl_FragColor = mix(cover, camera, 0.2);
    
}