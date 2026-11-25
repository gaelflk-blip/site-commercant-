/* Photo en relief (« photo 3D ») : la vraie photo + sa carte de profondeur faite avec Nano Banana.
   Les zones proches (main, roquette) bougent plus que le fond : effet de profondeur.
   Ordinateur : suit la souris. Téléphone : suit le défilement, avec un léger balancement. */
(function () {
  var box = document.querySelector('.relief-media');
  if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'relief-canvas'; canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;varying vec2 v;',
    'uniform sampler2D img,dep;uniform vec2 res,isz,off;uniform float zoom;',
    'vec2 cover(vec2 uv){float a=res.x/res.y,b=isz.x/isz.y;vec2 s=a>b?vec2(1.,b/a):vec2(a/b,1.);return (uv-.5)*s/zoom+.5;}',
    'void main(){',
    '  vec2 uv=cover(vec2(v.x,1.-v.y));',
    '  float d=texture2D(dep,uv).r;',
    '  vec2 o=off*(d-.45);',            // le plan du milieu reste fixe, le proche et le lointain bougent en sens inverse
    '  float d2=texture2D(dep,uv+o).r;',
    '  gl_FragColor=texture2D(img,uv+off*(d2-.45));',
    '}'
  ].join('\n');
  function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['img', 'dep', 'res', 'isz', 'off', 'zoom'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  function tex(src, unit) {
    return new Promise(function (ok, ko) {
      var im = new Image();
      im.onload = function () {
        var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ok(im);
      };
      im.onerror = ko; im.src = src;
    });
  }
  var lastW = 0;
  function resize() {
    var r = box.getBoundingClientRect(); if (Math.abs(r.width - lastW) < 2 && canvas.width) return; lastW = r.width;
    var k = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(r.width * k); canvas.height = Math.round(r.height * k);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.res, canvas.width, canvas.height);
  }

  Promise.all([tex(box.dataset.img, 0), tex(box.dataset.depth, 1)]).then(function (ims) {
    gl.uniform1i(U.img, 0); gl.uniform1i(U.dep, 1);
    gl.uniform2f(U.isz, ims[0].naturalWidth, ims[0].naturalHeight);
    gl.uniform1f(U.zoom, 1.04); // un peu de marge pour que les bords ne se voient pas quand ça bouge
    box.appendChild(canvas); resize(); addEventListener('resize', resize);

    var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    var target = [0, 0], cur = [0, 0], visible = false;
    if (fine) {
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        target = [((e.clientX - r.left) / r.width - 0.5) * -0.022, ((e.clientY - r.top) / r.height - 0.5) * 0.018];
      });
      box.addEventListener('pointerleave', function () { target = [0, 0]; });
    }
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(box);
    var t0 = performance.now();
    (function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      if (!fine) {
        // téléphone : le relief suit la position dans la page + un léger balancement
        var r = box.getBoundingClientRect(), p = (r.top + r.height / 2) / innerHeight - 0.5;
        var t = (now - t0) / 1000;
        target = [Math.sin(t * 0.8) * 0.008, p * -0.02];
      }
      cur[0] += (target[0] - cur[0]) * 0.08; cur[1] += (target[1] - cur[1]) * 0.08;
      gl.uniform2f(U.off, cur[0], cur[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.classList.add('on');
    })(t0);
  }).catch(function () {});
})();
