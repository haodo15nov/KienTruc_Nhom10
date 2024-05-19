const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const multer = require("multer");
const path = require("path");
const authenticateToken = require("../middlewares/authen");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload-quotations",
  upload.array("images"),
  quotationController.createQuotationRequest
);
router.get("/quotations", quotationController.getQuotationsByPhoneNumber);
router.post(
  "/update-status",
  authenticateToken,
  quotationController.updateQuotationStatus
);
router.get("/quotations-detail", quotationController.getQuotationsWithDetails);
router.post(
  "/quotations-price",
  authenticateToken,
  quotationController.updateQuotationPriceAndNotes
);
router.get("/quotations-process", quotationController.getQuotationProcess);
router.get("/reports", authenticateToken, quotationController.getReports);
router.post("/login", quotationController.login);
router.get("/check-token", authenticateToken, (req, res) => {
  try {
    // Lấy thông tin về user từ req.user, được gán bởi middleware authenticateToken
    const { exp } = req.user;
    const currentTimestamp = Math.floor(Date.now() / 1000); // Thời gian hiện tại (tính theo giây)

    if (currentTimestamp < exp) {
      // Token còn hạn
      res.json({ valid: true });
    } else {
      // Token đã hết hạn
      res.json({ valid: false });
    }
  } catch (error) {
    console.error("Lỗi kiểm tra token:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi kiểm tra token" });
  }
});
module.exports = router;
