const express = require("express");
const multer = require("multer");
const path = require("path");
const { protectImage } = require("../utils/imageProcessor");
const fs = require("fs-extra");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
const processedDir = path.join(__dirname, "../processed");

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(processedDir);

// Configurer l'upload d'images avec Multer
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Route pour téléverser et protéger une image
router.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier envoyé" });

    try {
        const inputPath = req.file.path;
        const outputPath = path.join(processedDir, req.file.filename);

        await protectImage(inputPath, outputPath);
        await fs.remove(inputPath);

        res.json({ message: "✅ Image protégée", path: `/processed/${req.file.filename}` });
    } catch (err) {
        res.status(500).json({ error: "Erreur de traitement", details: err.message });
    }
});

// Route pour récupérer une image protégée
router.get("/processed/:filename", (req, res) => {
    const filePath = path.join(processedDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image non trouvée" });

    res.sendFile(filePath);
});

module.exports = router;
