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

const bannerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["home", "webinar", "course"], // Specifies allowed types
      trim: true,
    },
    imageurl: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const Banner = mongoose.model("Banner", bannerSchema);

const FeedbackSchema = new mongoose.Schema(
  {
    star: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // Assuming a 1-5 rating system
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, // Validation for a 10-digit mobile number
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Feedback = mongoose.model("Feedback", FeedbackSchema);

const messageTemplateSchema = new mongoose.Schema(
  {
    raid: {
      type: String,
    },
    templatename: {
      type: String,
    },
    headingcontent: {
      type: String,
    },
    footercontent: {
      type: String,
    },
    type: {
      type: String,
      // enum: ['text', 'html'],
    },
  },
  { timestamps: true }
);

const MessageTemplate = mongoose.model(
  "MessageTemplate",
  messageTemplateSchema
);

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

/**
 * @swagger
 * tags:
 *   name: Banner
 *   description: Banner management API
 *
 * /banner:
 *   get:
 *     summary: Retrieve all banners
 *     tags: [Banner]
 *     responses:
 *       200:
 *         description: A list of banners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Banner'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new banner
 *     tags: [Banner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerInput'
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 *
 * /banner/{id}:
 *   get:
 *     summary: Retrieve a banner by ID
 *     tags: [Banner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the banner to retrieve
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a banner by its ID
 *     tags: [Banner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the banner to delete
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 *
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the banner
 *         type:
 *           type: string
 *           enum: [home, webinar, course]
 *           description: Type of the banner
 *         imageurl:
 *           type: string
 *           description: URL of the banner image
 *         name:
 *           type: string
 *           description: Name of the banner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the banner was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the banner was last updated
 *       required:
 *         - type
 *         - imageurl
 *         - name
 *
 *     BannerInput:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [home, webinar, course]
 *           description: Type of the banner
 *         imageurl:
 *           type: string
 *           description: URL of the banner image
 *         name:
 *           type: string
 *           description: Name of the banner
 *       required:
 *         - type
 *         - imageurl
 *         - name
 */

// Get all banners
router.get("/banner", async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get a single banner by ID
router.get("/banner/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid banner ID format." });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res
        .status(404)
        .json({ message: `No banner found with id '${id}'` });
    }

    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Create a new banner
router.post("/banner", async (req, res) => {
  try {
    const { type, imageurl, name } = req.body;

    // Validate required fields
    if (!type || !imageurl || !name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate 'type' field
    const allowedTypes = ["home", "webinar", "course"];
    if (!allowedTypes.includes(type)) {
      return res
        .status(400)
        .json({ message: `Type must be one of: ${allowedTypes.join(", ")}` });
    }

    const newBanner = new Banner({
      type,
      imageurl,
      name,
    });

    await newBanner.save();
    res.status(201).json({
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Delete a banner by ID
router.delete("/banner/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid banner ID format." });
    }

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res
        .status(404)
        .json({ message: `No banner found with id '${id}'` });
    }

    res.status(200).json({
      message: "Banner deleted successfully",
      data: deletedBanner,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// MESSAGE TEMPLATE API'S

router.get("/template", async (req, res) => {
  try {
    const templates = await MessageTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/template/:raid", async (req, res) => {
  try {
    const template = await MessageTemplate.find({ raid: req.params.raid });
    if (!template) {
      return res
        .status(404)
        .send({ message: "Template not found with the provided raid" });
    }
    res.status(200).json(template);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// POST a new message template
router.post("/template", async (req, res) => {
  const { raid, templatename, headingcontent, footercontent, type } = req.body;

  const newTemplate = new MessageTemplate({
    raid,
    templatename,
    headingcontent,
    footercontent,
    type,
  });

  try {
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// DELETE a message template by ID
router.delete("/template/:id", async (req, res) => {
  try {
    const deletedTemplate = await MessageTemplate.findByIdAndDelete(
      req.params.id
    );
    if (!deletedTemplate) {
      return res.status(404).send({ message: "Template not found" });
    }
    res.status(200).send({ message: "Template deleted successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// PATCH update a message template by ID
router.patch("/template/:id", async (req, res) => {
  const { raid, templatename, headingcontent, footercontent, type } = req.body;

  try {
    const updatedTemplate = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      { raid, templatename, headingcontent, footercontent, type },
      { new: true }
    );
    if (!updatedTemplate) {
      return res.status(404).send({ message: "Template not found" });
    }
    res.status(200).json(updatedTemplate);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     MessageTemplate:
 *       type: object
 *       properties:
 *         raid:
 *           type: string
 *           description: The raid identifier (e.g., template1, template2, etc.)
 *         templatename:
 *           type: string
 *           description: The name of the message template
 *         headingcontent:
 *           type: string
 *           description: The content for the heading section
 *         footercontent:
 *           type: string
 *           description: The content for the footer section
 *         type:
 *           type: string
 *           enum: [text, html]
 *           description: The type of message (either `text` or `html`)
 */

/**
 * @swagger
 * /template:
 *   get:
 *     summary: Retrieve all message templates
 *     description: Retrieve a list of all available message templates.
 *     responses:
 *       200:
 *         description: A list of message templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MessageTemplate'
 *       500:
 *         description: Server error while fetching templates
 */

/**
 * @swagger
 * /template/{raid}:
 *   get:
 *     summary: Retrieve a message template by raid
 *     description: Retrieve the details of a specific message template using its raid identifier.
 *     parameters:
 *       - in: path
 *         name: raid
 *         description: The raid identifier (e.g., raid="template1")
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A message template object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 *       404:
 *         description: Template not found with the provided raid
 *       500:
 *         description: Server error while fetching the template
 */

/**
 * @swagger
 * /template:
 *   post:
 *     summary: Create a new message template
 *     description: Create a new message template by providing the necessary details.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageTemplate'
 *     responses:
 *       201:
 *         description: Message template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 *       400:
 *         description: Invalid input, failed to create the message template
 *       500:
 *         description: Server error while creating the template
 */

/**
 * @swagger
 * /template/{id}:
 *   delete:
 *     summary: Delete a message template by ID
 *     description: Delete a message template using the provided template ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The template ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found with the provided ID
 *       500:
 *         description: Server error while deleting the template
 */

/**
 * @swagger
 * /template/{id}:
 *   patch:
 *     summary: Update a message template by ID
 *     description: Update the details of a message template using the provided template ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The template ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageTemplate'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 *       404:
 *         description: Template not found with the provided ID
 *       400:
 *         description: Invalid input for updating the template
 *       500:
 *         description: Server error while updating the template
 */

// errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
};

app.use(errorHandler);

app.use("/api", router);
