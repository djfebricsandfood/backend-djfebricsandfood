module.exports.createLog = (logName) => {
  try {
    return require("simple-node-logger").createRollingFileLogger({
      logDirectory: "logs", // NOTE: folder must exist and be writable...
      fileNamePattern: logName + "_<DATE>.log",
      dateFormat: "YYYY_MM_DD",
      timestampFormat: "YYYY-MM-DD HH:mm:ss",
    });
  } catch (error) {
    throw error;
  }
};

  
module.exports.generateRandomOTP = () => {
  try {
    const digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  } catch (error) {
    throw error;
  }
};



