class SvgStackDSL {
  constructor() {
    this.stack = [];
    this.shapes = [];
    this.currentShapeChildren = [];
    this.width = 500;
    this.height = 500;
  }

  push(val) {
    this.stack.push(val);
  }

  pop() {
    if (this.stack.length === 0) throw new Error("Stack underflow!");
    return this.stack.pop();
  }

  commitShape(openingTag) {
    if (this.currentShapeChildren.length <= 0) {
      this.shapes.push(`${openingTag} />`);
    } else {
      const shapeXml = `${openingTag}>\n  ${this.currentShapeChildren.join(`\n  `)}\n </${openingTag.split(' ')[0].substring(1)}>`;
      this.shapes.push(shapeXml);
      this.currentShapeChildren = [];
    }
  }

  execute(script) {
    // Split by whitespace and remove empty strings
    const tokens = script.trim().split(/\s+/);

    // FIXED: Changed 'in' to 'of' to get values instead of index strings
    for (const token of tokens) {
      if (!token) continue;

      switch (token.toUpperCase()) {
        case "INIT":
          this.height = this.pop();
          this.width = this.pop();
          break;

        case "RECT":
          const fillRect = this.pop();
          const h = this.pop();
          const w = this.pop();
          const yRect = this.pop();
          const xRect = this.pop();
          this.commitShape(`<rect x="${xRect}" y="${yRect}" width="${w}" height="${h}" fill="${fillRect}"`);
          break;

        case "CIRCLE":
          const fillCircle = this.pop();
          const r = this.pop();
          const cy = this.pop();
          const cx = this.pop();
          this.commitShape(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillCircle}"`);
          break;

        case "TEXT":
          const fillText = this.pop();
          const textStr = this.pop().replace(/_/g, ' ');
          const fSize = this.pop();
          const y = this.pop();
          const x = this.pop();
          // FIXED: Removed the invalid reference to "r"
          this.shapes.push(`<text x="${x}" y="${y}" font-size="${fSize}" fill="${fillText}" font-family="sans-serif" text-anchor="middle">${textStr}</text>`);
          break;

        case "ANIMATE":
          const repeat = this.pop();
          const dur = this.pop();
          const to = this.pop();
          const from = this.pop();
          const attr = this.pop();
          this.currentShapeChildren.push(
            `<animate attributeName="${attr}" from="${from}" to="${to}" dur="${dur}" repeatCount="${repeat}" />`
          );
          break;

        case "ANIM-ROT":
          const repeatCount = this.pop();
          const dura = this.pop();
          const toDeg = this.pop();
          const fromDeg = this.pop();
          this.currentShapeChildren.push(
            `<animateTransform attributeName="transform" type="rotate" from="${fromDeg}" to="${toDeg}" dur="${dura}" repeatCount="${repeatCount}" />`
          );
          break;

        default:
          const num = Number(token);
          this.push(!isNaN(num) ? num : token);
          break;
      }

      // console.log("Stack: ", this.stack);
    }
  }

  compile() {
    // FIXED: Cleaned up the broken inline version syntax and the closing tag
    return [
      `<svg width="${this.width}" height="${this.height}" version="1.1" xmlns="http://w3.org">`,
      ...this.shapes.map(s => " " + s),
      `</svg>`
    ].join("\n");
  }
}

// Execution Loop
const script1 = `
  600 700 INIT
  0 0 100% 100% crimson RECT
  300 300 200 teal CIRCLE
  300 300 24 Stack_DSL white TEXT
`;
const script2 = `
  600 400 INIT
  0 0 100% 100% teal RECT
  r 20 180 2s indefinite ANIMATE
  200 200 50 #77b8f8 CIRCLE
  0 360 5s indefinite ANIM-ROT
  100 100 100 175 gold RECT
`;
const script3 = `
  600 400 INIT
  0 0 100% 100% #0d0f12 RECT
  200 200 120 #1a2333 CIRCLE
  200 200 110 #0d0f12 CIRCLE
  200 200 95 #00ffaa CIRCLE
  transform rotate 0 360 8s indefinite ANIMATE
  200 200 90 #0d0f12 CIRCLE
  130 130 140 140 #ff0055 RECT
  transform rotate 45 405 12s indefinite ANIMATE
  140 140 120 120 #0d0f12 RECT
  200 208 18 SYSTEM_OK #00ffaa TEXT
`;
const script4 = `
  600 250 INIT
  0 0 100% 100% #18191c RECT
  125 75 250 100 #2a2d32 RECT
  250 75 250 100 #2a2d32 RECT
  200 125 50 #ffffff CIRCLE
  cx 200 300 0.4s indefinite ANIMATE
  200 125 46 #007acc CIRCLE
  250 210 14 ENABLE_SETTINGS #8e9297 TEXT
`;
const script5 = `
  600 400 INIT
  0 0 100% 100% #24fafa RECT
  200 100 200 200 #4A90E2 RECT
  0 360 15s indefinite ANIM-ROT
  300 200 80 #50E3C2 CIRCLE
  300 200 40 #f4f5f6 CIRCLE
  300 250 28 NEXUS_MEDIA #1B2A4A TEXT
  300 290 14 INNOVATION_ENGINEERING #000 TEXT
`;

const svgDiv1 = document.getElementById('svg1');
const svgDiv2 = document.getElementById('svg2');
const svgDiv3 = document.getElementById('svg3');
const svgDiv4 = document.getElementById('svg4');
const svgDiv5 = document.getElementById('svg5');

// const engine1 = new SvgStackDSL();
// engine1.execute(script1);
// const svg1 = engine1.compile();
// svgDiv1.innerHTML = svg1;
//
// engine1.execute(script2);
// const svg2 = engine1.compile();
// svgDiv2.innerHTML = svg2;

let scripts = [];
scripts.push(script1);
scripts.push(script2);
scripts.push(script3);
scripts.push(script4);
scripts.push(script5);

let divs = []
divs.push(svgDiv1);
divs.push(svgDiv2);
divs.push(svgDiv3);
divs.push(svgDiv4);
divs.push(svgDiv5);

for (let i = 0; i < 5; i++) {
  const engine = new SvgStackDSL();
  engine.execute(scripts[i]);
  divs[i].innerHTML = engine.compile();
}

// console.log(svg1);
// console.log(svg2);
