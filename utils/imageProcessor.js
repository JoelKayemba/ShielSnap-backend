const sharp = require("sharp");
const { generateNoise, encryptPixels, generateWatermark } = require("./steganography");

// Fonction qui applique une protection avancée à l’image
const protectImage = async (inputPath, outputPath) => {
    try {
        // Génération du filigrane dynamique
        const watermark = await generateWatermark("Confidentiel");

        await sharp(inputPath)
            .blur(2) // Applique un flou léger
            .modulate({ brightness: 1.1 }) // Légère augmentation de la luminosité
            .composite([
                { input: await generateNoise(500, 500), blend: "overlay" }, // Ajoute du bruit
                { input: watermark, gravity: "southeast", blend: "overlay", opacity: 0.02 } // Filigrane ultra léger
            ])
            .toFile(outputPath);

        // Crypter les pixels pour rendre l’image inutilisable en cas de téléchargement
        await encryptPixels(outputPath);
    } catch (error) {
        throw new Error("Erreur lors du traitement de l'image");
    }
};

module.exports = { protectImage };
