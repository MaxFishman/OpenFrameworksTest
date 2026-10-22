precision highp float;

uniform vec2 resolution;
uniform float time;

void main(){
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0.0, 2.0, 4.0));
    col *= 0.6 + 0.4 * sin(uv.x * 20.0 + time);
    gl_FragColor = vec4(col, 1.0);
}
