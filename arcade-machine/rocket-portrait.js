/* Illustrated Pelicano portrait; the vector character remains a loading fallback. */
(function (root) {
  "use strict";
  let image = null,
    ready = false;
  const source = "assets/pelicano-illustrated.png";
  function setImage(value) {
    image = value;
    ready = !!value && !!(value.naturalWidth || value.width);
  }
  if (typeof root.Image === "function") {
    image = new root.Image();
    image.onload = () => {
      ready = true;
    };
    image.onerror = () => {
      ready = false;
    };
    image.src = source;
  }
  function draw(g, x, y, scale = 1, t = 0) {
    if (!ready || !image) return false;
    const iw = image.naturalWidth || image.width,
      ih = image.naturalHeight || image.height;
    if (!iw || !ih) return false;
    const h = 300 * scale,
      w = (h * iw) / ih;
    g.save();
    g.fillStyle = "#233f4030";
    g.beginPath();
    g.ellipse(x, y + 3 * scale, 50 * scale, 7 * scale, 0, 0, Math.PI * 2);
    g.fill();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(
      image,
      x - w * 0.5,
      y - h + Math.sin(t * 2) * 1.1 * scale,
      w,
      h,
    );
    g.restore();
    return true;
  }
  root.SelenePortrait = {
    draw,
    setImage,
    get ready() {
      return ready;
    },
    source,
  };
})(typeof window !== "undefined" ? window : globalThis);
