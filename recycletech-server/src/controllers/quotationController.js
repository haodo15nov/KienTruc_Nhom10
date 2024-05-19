const db = require("../models/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const quotationModel = require("../models/quotation");
exports.createQuotationRequest = async (req, res) => {
  const connection = await db.getConnection();
  const { time, full_name, phone_number, email, device_type, notes } = req.body;
  try {
    let urlImage = [];
    req.files.map((file) => {
      urlImage.push(
        `http://${process.env.DB_HOST}:${process.env.PORT}/uploads/${file.filename}`
      ); // Thay đổi domain và đường dẫn tương ứng với domain và đường dẫn của server của bạn
    });
    const customer_id = await quotationModel.createCustomer(
      connection,
      full_name,
      phone_number,
      email
    );

    // Lưu thông tin thiết bị
    const device_id = await quotationModel.createDevice(
      connection,
      device_type,
      device_type,
      JSON.stringify(urlImage),
      notes
    );

    // Tạo yêu cầu báo giá
    const quotation_id = await quotationModel.createQuotation(
      connection,
      customer_id,
      device_id,
      time
    );

    res.json({
      status: 1,
      quotation_id: quotation_id,
      message: "upload success",
    });
    // Hoàn tất giao dịch
    await connection.commit();
    await connection.release();
  } catch (err) {
    // Hủy giao dịch nếu có lỗi
    console.log(err);
    await connection.rollback();
    res.status(500).send("Server Error");
  } finally {
    // Giải phóng kết nối
    connection.release();
  }
};
exports.updateQuotationStatus = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const quotation_id = req.body.quotation_id; // Lấy quotation_id từ tham số trong URL
    const status = req.body.status; // Lấy giá trị mới cho trường status từ body của yêu cầu
    // Gọi model để thực hiện cập nhật trạng thái của bản báo giá
    const result = await quotationModel.updateQuotationStatus(
      connection,
      quotation_id,
      status
    );
    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: "status updated successfully",
      data: result,
    });
    await connection.release();
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
exports.getQuotationsByPhoneNumber = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const phoneNumber = req.query.phone_number; // Lấy số điện thoại từ tham số trong URL

    // Gọi model để thực hiện tìm kiếm các yêu cầu báo giá
    const quotations = await quotationModel.getQuotationsByPhoneNumber(
      connection,
      phoneNumber
    );

    // Trả về kết quả dưới dạng JSON
    res.status(200).json({
      success: true,
      data: quotations,
    });
    await connection.release();
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
exports.getQuotationsWithDetails = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    // Gọi model để lấy danh sách thông tin từ các bảng
    const quotations = await quotationModel.getQuotationsWithDetails(
      connection
    );

    // Trả về kết quả cho người dùng
    res.status(200).json({
      success: true,
      message: "Quotations with details retrieved successfully",
      data: quotations,
    });
    await connection.release();
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
exports.updateQuotationPriceAndNotes = async (req, res) => {
  const connection = await db.getConnection();
  const { quotation_id, notes, quotation_price } = req.body;
  try {
    const result = await quotationModel.updateQuotationPriceAndNotes(
      connection,
      quotation_id,
      notes,
      quotation_price
    );
    if (result.success) {
      res.status(200).json({ message: result });
    } else {
      res.status(404).json({ error: result.message });
    }
    await connection.release();
  } catch (error) {
    console.error("Error updating quotation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating quotation." });
  }
};
exports.getQuotationProcess = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Gọi model để lấy danh sách thông tin từ các bảng
    const quotations = await quotationModel.getQuotationProcess(connection);

    // Trả về kết quả cho người dùng
    res.status(200).json({
      success: true,
      message: "Quotations with details retrieved successfully",
      data: quotations,
    });
    await connection.release();
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
exports.getReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Gọi model để lấy danh sách thông tin từ các bảng
    const quotations = await quotationModel.getReports(connection);

    // Trả về kết quả cho người dùng
    res.status(200).json({
      success: true,
      message: "Reports with details retrieved successfully",
      data: quotations,
    });
    await connection.release();
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const connection = await db.getConnection();
  try {
    // Gọi phương thức login từ model
    const result = await quotationModel.login(connection, username, password);
    if (result.isAuthenticated) {
      // Đăng nhập thành công, tạo và trả về token
      const token = jwt.sign({ username }, "thisIsAStrongSecretKey123!@#", {
        expiresIn: "1h",
      });

      res.json({ message: "Đăng nhập thành công", token: token });
    } else {
      // Tên đăng nhập hoặc mật khẩu không đúng
      res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }
  } catch (error) {
    // Xử lý lỗi
    console.error("Đã xảy ra lỗi:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi kiểm tra tài khoản và mật khẩu" });
  }
};
