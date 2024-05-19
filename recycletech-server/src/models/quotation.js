exports.createCustomer = async (connection, full_name, phone_number, email) => {
  const [result] = await connection.query(
    "INSERT INTO customers (full_name, phone_number, email) VALUES (?, ?, ?)",
    [full_name, phone_number, email]
  );
  return result.insertId;
};

exports.createDevice = async (
  connection,
  device_name,
  device_type,
  imageUrls,
  notes
) => {
  // Chuyển mảng các đường dẫn thành một chuỗi JSON để lưu vào cơ sở dữ liệu
  const [result] = await connection.query(
    "INSERT INTO devices (device_name, device_type, image, notes) VALUES (?, ?, ?, ?)",
    [device_name, device_type, imageUrls, notes]
  );

  return result.insertId;
};
exports.createQuotation = async (connection, customer_id, device_id, time) => {
  const [result] = await connection.query(
    "INSERT INTO quotations (customer_id, device_id, quoted_price, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NULL)",
    [customer_id, device_id, 0, 1, time, ""]
  );
  return result.insertId;
};
exports.updateQuotationStatus = async (connection, quotation_id, status) => {
  try {
    // Thực hiện truy vấn SQL để cập nhật trường status
    const [result] = await connection.query(
      "UPDATE quotations SET status = ? WHERE quotation_id = ?",
      [status, quotation_id]
    );
    // Trả về kết quả
    return result;
  } catch (error) {
    // Xử lý lỗi nếu có
    throw new Error(`Error updating quotation status: ${error.message}`);
  }
};
exports.getQuotationsByPhoneNumber = async (connection, phoneNumber) => {
  try {
    const [rows] = await connection.query(
      `
      SELECT 
        quotations.quotation_id, 
        quotations.status, 
        devices.device_type, 
        quotations.quoted_price,
        quotations.created_at,
        quotations.updated_at
      FROM 
        quotations
      JOIN 
        customers ON quotations.customer_id = customers.customer_id
      JOIN 
        devices ON quotations.device_id = devices.device_id
      WHERE 
        customers.phone_number = ?
    `,
      [phoneNumber]
    );

    return rows;
  } catch (error) {
    throw new Error(`Error getting quotations by phone number: ${error}`);
  }
};
exports.getQuotationsWithDetails = async (connection) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
          q.quotation_id,
          c.full_name, 
          c.phone_number, 
          c.email, 
          d.device_name, 
          d.device_type, 
          d.image, 
          d.notes
      FROM 
          quotations q
      JOIN 
          customers c ON q.customer_id = c.customer_id
      JOIN 
          devices d ON q.device_id = d.device_id
      WHERE 
          q.status = 1 
    `);

    // Trả về kết quả
    return rows;
  } catch (error) {
    // Xử lý lỗi nếu có
    throw new Error(`Error getting quotations with details: ${error.message}`);
  }
};
exports.updateQuotationPriceAndNotes = async (
  connection,
  quotation_id,
  device_notes,
  quotation_price
) => {
  try {
    // Bắt đầu một giao dịch để đảm bảo tính nhất quán của dữ liệu
    await connection.beginTransaction();

    // Thực hiện truy vấn cập nhật trường notes trong bảng devices
    const [deviceUpdateResult] = await connection.query(
      `
      UPDATE devices AS d
      JOIN quotations AS q ON d.device_id = q.device_id
      SET d.notes = ?
      WHERE q.quotation_id = ?
      `,
      [device_notes, quotation_id]
    );

    // Thực hiện truy vấn cập nhật trường notes và quoted_price trong bảng quotations
    const [quotationUpdateResult] = await connection.query(
      `
      UPDATE quotations
      SET status = 2,
          quoted_price = ?
      WHERE quotation_id = ?
      `,
      [quotation_price, quotation_id]
    );

    // Commit giao dịch nếu không có lỗi xảy ra
    await connection.commit();

    // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
    if (
      deviceUpdateResult.affectedRows > 0 ||
      quotationUpdateResult.affectedRows > 0
    ) {
      return {
        success: true,
        message: "Quotation and device updated successfully.",
      };
    } else {
      return {
        success: false,
        message: "Quotation or device not found or already up-to-date.",
      };
    }
  } catch (error) {
    // Rollback giao dịch nếu có lỗi xảy ra
    await connection.rollback();
    console.error("Error updating quotation and device:", error);
    return {
      success: false,
      message: "An error occurred while updating quotation and device.",
    };
  }
};
exports.getQuotationProcess = async (connection) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
          q.quotation_id,
          c.full_name, 
          c.phone_number, 
          c.email, 
          d.device_name, 
          d.device_type, 
          d.image, 
          d.notes,
          q.status
      FROM 
          quotations q
      JOIN 
          customers c ON q.customer_id = c.customer_id
      JOIN 
          devices d ON q.device_id = d.device_id
      WHERE 
          q.status = 4 OR q.status = 5
    `);

    // Trả về kết quả
    return rows;
  } catch (error) {
    // Xử lý lỗi nếu có
    throw new Error(`Error getting quotations with details: ${error.message}`);
  }
};
exports.getReports = async (connection) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
          c.full_name, 
          c.phone_number, 
          d.device_name, 
          q.status,
          q.quoted_price
      FROM 
          quotations q
      JOIN 
          customers c ON q.customer_id = c.customer_id
      JOIN 
          devices d ON q.device_id = d.device_id
      WHERE 
          q.status >= 5
    `);

    // Trả về kết quả
    return rows;
  } catch (error) {
    // Xử lý lỗi nếu có
    throw new Error(`Error getting quotations with details: ${error.message}`);
  }
};
exports.login = async (connection, username, password) => {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM users WHERE username = ? AND password = ?`,
      [username, password]
    );
    if (rows.length === 0) {
      return { isAuthenticated: false };
    } else {
      return { isAuthenticated: true };
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};
