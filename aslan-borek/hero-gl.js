/* Haut de page animé en WebGL : les photos s'enchaînent avec un zoom lent
   et une transition qui ondule comme de la pâte. Aucune bibliothèque, aucun service externe.
   Si WebGL n'est pas dispo ou si le visiteur limite les animations, la photo fixe reste. */
(function () {
  var box = document.querySelector('.hero-photo');
  if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SOURCES = ['img/borek-roquette.jpg', 'img/garniture-viande.jpg', 'img/borek-epinards.jpg', 'img/garniture-champignons.jpg'];
  var HOLD = 4.2, FADE = 1.6; // secondes : affichage, puis transition

  var canvas = document.createElement('canvas');
  canvas.className = 'hero-gl';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D t0,t1;uniform vec2 r0,r1,res,mouse;uniform float prog,z0,z1,time,hover;',
    // Ajuste l'image comme object-fit: cover, avec un zoom centré
    'vec2 cover(vec2 uv,vec2 img,float z){float a=res.x/res.y,b=img.x/img.y;vec2 s=a>b?vec2(1.,b/a):vec2(a/b,1.);return (uv-.5)*s/z+.5;}',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}',
    'void main(){',
    '  vec2 uv=vec2(v.x,1.-v.y);',
    // Légère ondulation autour du doigt / de la souris
    '  vec2 d=uv-mouse;float m=hover*.018*exp(-dot(d,d)*18.);uv+=normalize(d+1e-4)*m*sin(time*3.-length(d)*24.);',
    '  float g=fbm(uv*3.+time*.05);',
    // Front de transition organique, comme une pâte qu\'on étale
    '  float edge=smoothstep(prog*1.4-.2,prog*1.4,g*.6+uv.x*.4+.1);',
    '  float w=(1.-edge)*edge*4.;',
    '  vec2 o=vec2(g-.5,fbm(uv*3.+7.)-.5)*.12;',
    '  vec4 a=texture2D(t0,cover(uv+o*prog,r0,z0));',
    '  vec4 b=texture2D(t1,cover(uv-o*(1.-prog),r1,z1));',
    '  vec4 c=mix(b,a,edge);',
    '  c.rgb+=vec3(.83,.67,.32)*w*.18;', // liseré doré au passage
    '  gl_FragColor=vec4(c.rgb,1.);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['t0', 't1', 'r0', 'r1', 'res', 'mouse', 'prog', 'z0', 'z1', 'time', 'hover'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  gl.uniform1i(U.t0, 0); gl.uniform1i(U.t1, 1);

  function load(src) {
    return new Promise(function (ok, ko) {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () {
        var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE); });
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ok({ tex: t, w: im.naturalWidth, h: im.naturalHeight });
      };
      im.onerror = ko; im.src = src;
    });
  }

  function resize() {
    var dpr = Math.min(devicePixelRatio || 1, 2), r = box.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
  }

  Promise.all(SOURCES.map(load)).then(function (slides) {
    box.insertBefore(canvas, box.querySelector('.stamp'));
    resize(); addEventListener('resize', resize);

    var mouse = [0.5, 0.5], hover = 0, hoverTarget = 0;
    function point(e) {
      var r = box.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
      mouse = [(p.clientX - r.left) / r.width, (p.clientY - r.top) / r.height]; hoverTarget = 1;
    }
    box.addEventListener('pointermove', point);
    box.addEventListener('touchmove', point, { passive: true });
    box.addEventListener('pointerleave', function () { hoverTarget = 0; });

    var visible = true;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(box);

    var start = performance.now(), i = 0, shown = false, paused = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { paused = paused || now; return; }
      if (paused) { start += now - paused; paused = 0; }
      var t = Math.max(0, (now - start) / 1000), cycle = HOLD + FADE;
      var k = Math.floor(t / cycle), local = t - k * cycle;
      i = ((k % slides.length) + slides.length) % slides.length;
      var a = slides[i], b = slides[(i + 1) % slides.length];
      var p = local < HOLD ? 0 : (local - HOLD) / FADE;
      p = p * p * (3 - 2 * p);
      hover += (hoverTarget - hover) * 0.06;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.uniform2f(U.r0, a.w, a.h); gl.uniform2f(U.r1, b.w, b.h);
      gl.uniform1f(U.prog, p);
      // Zoom lent façon cinéma, continu d'une photo à l'autre (fonction de l'âge de la photo)
      gl.uniform1f(U.z0, 1.04 + 0.025 * (local + FADE));
      gl.uniform1f(U.z1, 1.04 + 0.025 * Math.max(0, local - HOLD));
      gl.uniform1f(U.time, t);
      gl.uniform2f(U.mouse, mouse[0], mouse[1]);
      gl.uniform1f(U.hover, hover);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!shown) { shown = true; canvas.classList.add('on'); }
    }
    requestAnimationFrame(frame);
  }).catch(function () { /* on garde la photo fixe */ });
})();
