const jwt = require("jsonwebtoken");
// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
  // Lấy token từ header của yêu cầu
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    // Nếu không có token, trả về lỗi 401 (Unauthorized)
    return res.sendStatus(401);
  }
  // Kiểm tra và giải mã token
  jwt.verify(token, "thisIsAStrongSecretKey123!@#", (err, user) => {
    if (err) {
      // Nếu có lỗi khi giải mã, trả về lỗi 403 (Forbidden)
      console.log(err);
      return res.sendStatus(403);
    }
    // Nếu token hợp lệ, lưu trữ thông tin người dùng vào đối tượng request và tiếp tục xử lý yêu cầu
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
