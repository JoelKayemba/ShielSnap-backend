const sharp = require("sharp");
const fs = require("fs");

// Génère une image avec du bruit aléatoire
const generateNoise = async (width, height) => {
    return sharp({
        create: {
            width: width,
            height: height,
            channels: 3,
            background: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 },
        },
    }).toBuffer();
};

// Crypte légèrement l’image pour brouiller le téléchargement
const encryptPixels = async (imagePath) => {
    let image = sharp(imagePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        data[i] ^= 120; // Modifie la couleur des pixels (XOR)
        data[i + 1] ^= 60;
        data[i + 2] ^= 30;
    }

    await sharp(Buffer.from(data), {
        raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
        },
    }).toFile(imagePath);
};

// Génère un filigrane texte léger pour l’image
const generateWatermark = async (text) => {
    const svg = `
        <svg width="500" height="100">
            <text x="10" y="50" font-size="30" font-weight="bold" fill="black" opacity="0.03">${text}</text>
        </svg>
    `;

    return Buffer.from(svg);
};

module.exports = { generateNoise, encryptPixels, generateWatermark };
