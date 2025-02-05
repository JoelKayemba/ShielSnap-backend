const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Vérifie si le dossier `uploads` existe, sinon le crée
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

//  Configuration Multer pour l’upload
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (![".jpg", ".jpeg", ".png"].includes(ext)) {
            return cb(new Error("Format non supporté"), false);
        }
        cb(null, Date.now() + ext);
    },
});

const upload = multer({ storage });

//  Route pour téléverser une image avec protection
app.post("/api/images/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucune image reçue !" });
        }

        const inputPath = path.join(__dirname, "uploads", req.file.filename);
        const outputPath = path.join(__dirname, "uploads", "protected_" + req.file.filename);

        //  Vérifier si le fichier existe et si c’est bien une image
        if (!fs.existsSync(inputPath)) {
            return res.status(400).json({ message: "Le fichier n'existe pas après l'upload." });
        }

        const metadata = await sharp(inputPath).metadata();
        if (!metadata || !metadata.width || !metadata.height) {
            return res.status(400).json({ message: "Format d'image invalide ou corrompu !" });
        }

        //  Appliquer une transformation uniquement si le fichier est valide
        await sharp(inputPath)
            .modulate({ brightness: 1.02, saturation: 0.98 }) 
            .toFile(outputPath);

        res.status(200).json({ 
            message: "Image protégée et téléversée",
            filename: "protected_" + req.file.filename 
        });

    } catch (error) {
        console.error("Erreur lors du traitement de l'image :", error);
        res.status(500).json({ message: "Erreur de traitement", error: error.message });
    }
});

//  Route pour récupérer la liste des images (triées du plus récent au plus ancien)
app.get("/api/images", (req, res) => {
    fs.readdir("uploads/", (err, files) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération des fichiers" });
        }
        const sortedFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Filtrer uniquement les images
            .sort((a, b) => b.split("_")[0] - a.split("_")[0]); // Trier selon le timestamp

        res.json(sortedFiles);
    });
});

//  Servir les images depuis `/uploads`
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Route pour télécharger une image (ajoute un filigrane invisible)
app.get("/api/images/download/:filename", async (req, res) => {
    try {
        const filename = req.params.filename;
        const inputPath = path.join(__dirname, "uploads", filename);
        const outputPath = path.join(__dirname, "uploads", "downloaded_" + filename);
        const watermarkPath = path.join(__dirname, "assets", "watermark.png");

        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ message: "Image non trouvée" });
        }

        if (!fs.existsSync(watermarkPath)) {
            console.error("Le fichier watermark.png est manquant !");
            return res.status(500).json({ message: "Fichier watermark introuvable." });
        }

        //  Ajout du filigrane avant le téléchargement
        await sharp(inputPath)
            .composite([{ input: watermarkPath, gravity: "southeast", blend: "overlay" }])
            .toFile(outputPath);

        res.download(outputPath, filename, (err) => {
            if (err) {
                console.error("Erreur lors du téléchargement :", err);
                res.status(500).json({ message: "Erreur de téléchargement" });
            }
        });
    } catch (error) {
        console.error("Erreur lors du téléchargement :", error);
        res.status(500).json({ message: "Erreur interne", error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(` Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
