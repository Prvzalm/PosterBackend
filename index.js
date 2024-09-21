const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

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
        url: "https://poster.copartner.in/api",
      },
    ],
  },
  apis: ["./index.js"], // You can also use './routes/*.js' if you have separate route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = 3069;
const mongoDBConnectionString = process.env.MONGODB_URI;

mongoose
  .connect(mongoDBConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`app is listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

const RADashboardImageSchema = new mongoose.Schema(
  {
    expertId: {
      type: String,
      required: true,
    },
    imageurl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["blur", "marketing", "premium"], // You can adjust this based on the type requirements
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RADashboardImage = mongoose.model(
  "RADashboardImage",
  RADashboardImageSchema
);

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
 * /ra-dashboard/image:
 *   post:
 *     summary: Add a new image for RA Dashboard
 *     tags: [RADashboardImage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expertId:
 *                 type: string
 *               imageurl:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [blur, marketing, premium]
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Image added successfully
 *       400:
 *         description: Bad request, required fields are missing
 *       500:
 *         description: Server error
 */
router.post("/ra-dashboard/image", async (req, res) => {
  try {
    const { expertId, imageurl, type, name } = req.body;

    if (!expertId || !imageurl || !type || !name) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const newImage = new RADashboardImage({
      expertId,
      imageurl,
      type,
      name,
    });

    await newImage.save();

    res.status(201).json({
      message: "Image added successfully",
      data: newImage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /ra-dashboard/image/{id}:
 *   patch:
 *     summary: Update an image by its ObjectId
 *     tags: [RADashboardImage]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ObjectId of the image to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RADashboardImage'
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.patch("/ra-dashboard/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!Object.keys(updateData).length) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    const updatedImage = await RADashboardImage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({
        message: `No image found with id '${id}'`,
      });
    }

    res.status(200).json({
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /ra-dashboard/image/{id}:
 *   delete:
 *     summary: Delete an image by its ObjectId
 *     tags: [RADashboardImage]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ObjectId of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.delete("/ra-dashboard/image/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedImage = await RADashboardImage.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({
        message: `No image found with id '${id}'`,
      });
    }

    res.status(200).json({
      message: "Image deleted successfully",
      data: deletedImage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /ra-dashboard/images:
 *   get:
 *     summary: Get all images for RA Dashboard
 *     tags: [RADashboardImage]
 *     responses:
 *       200:
 *         description: A list of all images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   expertId:
 *                     type: string
 *                   imageurl:
 *                     type: string
 *                   type:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get("/ra-dashboard/images", async (req, res) => {
  try {
    const images = await RADashboardImage.find();
    res.status(200).json({
      message: "Images retrieved successfully",
      data: images,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RADashboardImage:
 *       type: object
 *       required:
 *         - expertId
 *         - imageurl
 *         - type
 *         - name
 *       properties:
 *         expertId:
 *           type: string
 *           description: The expert's ID
 *         imageurl:
 *           type: string
 *           description: The URL of the image
 *         type:
 *           type: string
 *           enum: ["blur", "marketing", "premium"]
 *           description: The type of the image (blur, marketing, premium)
 *         name:
 *           type: string
 *           description: The name of the image
 */

/**
 * @swagger
 * /ra-dashboard/images/{expertId}:
 *   get:
 *     summary: Get all posters by ExpertID
 *     tags: [RADashboardImage]
 *     parameters:
 *       - in: path
 *         name: expertId
 *         schema:
 *           type: string
 *         required: true
 *         description: The expertId of the posters
 *     responses:
 *       200:
 *         description: Images for the given ExpertID retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RADashboardImage'
 *       404:
 *         description: No images found for the provided expert ID
 *       500:
 *         description: Server error
 */
router.get("/ra-dashboard/images/:expertId", async (req, res) => {
  try {
    const { expertId } = req.params;
    const images = await RADashboardImage.find({ expertId });

    if (!images.length) {
      return res.status(404).json({
        message: `No images found for expertId '${expertId}'`,
      });
    }

    res.status(200).json({
      message: `Images for expertId '${expertId}' fetched successfully`,
      data: images,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
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
