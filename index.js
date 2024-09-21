const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Expert Image API",
      version: "1.0.0",
      description: "API documentation for the Expert Image service",
    },
    servers: [
      {
        url: "http://localhost:3069/api",
      },
    ],
  },
  apis: ["./index.js"], // You can also use './routes/*.js' if you have separate route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = 3069;

mongoose
  .connect(
    "mongodb+srv://parveshtest:Parvesh%40123987@cluster0.qgfonjs.mongodb.net/PosterBackend?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    app.listen(PORT, () => {
      console.log(`app is listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

const ExpertImageSchema = new mongoose.Schema(
  {
    expertId: {
      type: String,
    },
    imageName: {
      type: String,
      unique: true, // Ensures the imageName is unique
    },
    webImageUrl: {
      type: String,
    },
    mobileImageUrl: {
      type: String,
    },
    property: {
      type: String,
      enum: ["blur", "marketing", "premium"], // Restrict values
      required: true,
    },
    subheading: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ExpertImage = mongoose.model("Poster", ExpertImageSchema);

const PosterSchema = new mongoose.Schema(
  {
    image1url: {
      type: String,
      required: true,
    },
    image2url: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
      enum: [1, 2, 3], // Restrict values to 1, 2, or 3
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Poster = mongoose.model("AdminPoster", PosterSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     ExpertImage:
 *       type: object
 *       required:
 *         - expertId
 *         - imageName
 *         - webImageUrl
 *         - mobileImageUrl
 *         - property
 *       properties:
 *         expertId:
 *           type: string
 *           description: The expert's ID
 *         imageName:
 *           type: string
 *           description: The name of the image
 *         webImageUrl:
 *           type: string
 *           description: The URL of the web version of the image
 *         mobileImageUrl:
 *           type: string
 *           description: The URL of the mobile version of the image
 *         property:
 *           type: string
 *           enum: ["blur", "marketing", "premium"]
 *           description: The property of the image
 *         subheading:
 *           type: boolean
 *           description: Whether the image has a subheading
 */

/**
 * @swagger
 * /expert-image:
 *   post:
 *     summary: Add a new expert image
 *     tags: [ExpertImage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpertImage'
 *     responses:
 *       201:
 *         description: Expert image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpertImage'
 *       400:
 *         description: Bad request, required fields are missing or image name is duplicated
 *       500:
 *         description: Server error
 */
router.post("/expert-image", async (req, res) => {
  try {
    const {
      expertId,
      imageName,
      webImageUrl,
      mobileImageUrl,
      property,
      subheading,
    } = req.body;

    // Validate input
    if (
      !expertId ||
      !imageName ||
      !webImageUrl ||
      !mobileImageUrl ||
      !property
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const newExpertImage = new ExpertImage({
      expertId,
      imageName,
      webImageUrl,
      mobileImageUrl,
      property,
      subheading,
    });

    await newExpertImage.save();

    res.status(201).json({
      message: "Expert image data saved successfully",
      data: newExpertImage,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.imageName) {
      return res.status(400).json({
        message: `Image with name '${req.body.imageName}' already exists.`,
      });
    }

    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /expert-image/{id}:
 *   patch:
 *     summary: Update an expert image by its ObjectId
 *     tags: [ExpertImage]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ObjectId of the expert image to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpertImage'
 *     responses:
 *       200:
 *         description: Expert image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpertImage'
 *       400:
 *         description: Bad request, required fields are missing or image name is duplicated
 *       404:
 *         description: Expert image not found
 *       500:
 *         description: Server error
 */
router.patch("/expert-image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Ensure that at least one field is being updated
    if (!Object.keys(updateData).length) {
      return res.status(400).json({
        message: "No fields provided for update.",
      });
    }

    // Check if imageName already exists (excluding the current image being updated)
    if (updateData.imageName) {
      const existingImage = await ExpertImage.findOne({
        imageName: updateData.imageName,
        _id: { $ne: id }, // Exclude current document
      });
      if (existingImage) {
        return res.status(400).json({
          message: `Image with name '${updateData.imageName}' already exists.`,
        });
      }
    }

    // Find and update the image by its ID
    const updatedImage = await ExpertImage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({
        message: `No expert image found with id '${id}'`,
      });
    }

    res.status(200).json({
      message: "Expert image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /expert-image/{id}:
 *   delete:
 *     summary: Delete an expert image by its ObjectId
 *     tags: [ExpertImage]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ObjectId of the expert image to delete
 *     responses:
 *       200:
 *         description: Expert image deleted successfully
 *       404:
 *         description: Expert image not found
 *       500:
 *         description: Server error
 */
router.delete("/expert-image/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image by its ID and delete it
    const deletedImage = await ExpertImage.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({
        message: `No expert image found with id '${id}'`,
      });
    }

    res.status(200).json({
      message: "Expert image deleted successfully",
      data: deletedImage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /expert-images:
 *   get:
 *     summary: Get all expert images
 *     tags: [ExpertImage]
 *     responses:
 *       200:
 *         description: All expert images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExpertImage'
 *       500:
 *         description: Server error
 */
router.get("/expert-images", async (req, res) => {
  try {
    const expertImages = await ExpertImage.find();
    res.status(200).json({
      message: "All expert images fetched successfully",
      data: expertImages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /expert-images/{expertId}:
 *   get:
 *     summary: Get images for a specific expert
 *     tags: [ExpertImage]
 *     parameters:
 *       - in: path
 *         name: expertId
 *         schema:
 *           type: string
 *         required: true
 *         description: The expert's ID
 *     responses:
 *       200:
 *         description: Expert images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExpertImage'
 *       404:
 *         description: No images found for the provided expert ID
 *       500:
 *         description: Server error
 */
router.get("/expert-images/:expertId", async (req, res) => {
  try {
    const { expertId } = req.params;
    const expertImages = await ExpertImage.find({ expertId });

    if (!expertImages.length) {
      return res.status(404).json({
        message: `No images found for expertId '${expertId}'`,
      });
    }

    res.status(200).json({
      message: `Images for expertId '${expertId}' fetched successfully`,
      data: expertImages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

// ADMIN DASHBOARD API'S

/**
 * @swagger
 * /admin/poster:
 *   post:
 *     summary: Add a new poster
 *     tags: [AdminPoster]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image1url:
 *                 type: string
 *               image2url:
 *                 type: string
 *               type:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Poster added successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Server error
 */
router.post("/admin/poster", async (req, res) => {
  try {
    const { image1url, image2url, type, name } = req.body;

    if (!image1url || !image2url || !type || !name) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const newPoster = new Poster({
      image1url,
      image2url,
      type,
      name,
    });

    await newPoster.save();

    res.status(201).json({
      message: "Poster added successfully",
      data: newPoster,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminPoster:
 *       type: object
 *       required:
 *         - image1url
 *         - image2url
 *         - type
 *         - name
 *       properties:
 *         image1url:
 *           type: string
 *           description: URL of the first image
 *         image2url:
 *           type: string
 *           description: URL of the second image
 *         type:
 *           type: integer
 *           enum: [1, 2, 3]
 *           description: The type of the poster (1, 2, or 3)
 *         name:
 *           type: string
 *           description: Name of the poster
 */

/**
 * @swagger
 * /admin/posters:
 *   get:
 *     summary: Get all posters
 *     tags: [AdminPoster]
 *     responses:
 *       200:
 *         description: A list of all posters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminPoster'
 *       500:
 *         description: Server error
 */
router.get("/admin/posters", async (req, res) => {
  try {
    const posters = await Poster.find();
    res.status(200).json({
      message: "Posters retrieved successfully",
      data: posters,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /admin/poster/{id}:
 *   delete:
 *     summary: Delete a poster by its ID
 *     tags: [AdminPoster]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the poster to delete
 *     responses:
 *       200:
 *         description: Poster deleted successfully
 *       404:
 *         description: Poster not found
 *       500:
 *         description: Server error
 */
router.delete("/admin/poster/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPoster = await Poster.findByIdAndDelete(id);

    if (!deletedPoster) {
      return res
        .status(404)
        .json({ message: `No poster found with id '${id}'` });
    }

    res.status(200).json({
      message: "Poster deleted successfully",
      data: deletedPoster,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /admin/poster/{id}:
 *   patch:
 *     summary: Update poster images by its ID
 *     tags: [AdminPoster]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the poster to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image1url:
 *                 type: string
 *               image2url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Poster updated successfully
 *       404:
 *         description: Poster not found
 *       500:
 *         description: Server error
 */
router.patch("/admin/poster/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!Object.keys(updateData).length) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    const updatedPoster = await Poster.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPoster) {
      return res
        .status(404)
        .json({ message: `No poster found with id '${id}'` });
    }

    res.status(200).json({
      message: "Poster updated successfully",
      data: updatedPoster,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

app.use("/api", router);
