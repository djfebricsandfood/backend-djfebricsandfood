const mongoose = require("mongoose");
const mailTemplates = require("../models/mailTemplates");
mongoose.set("strictQuery", true);
const md5 = require("md5");
const humanize = require("string-humanize");
const Admin = require("../models/adminModel");


const connectDb = async () => {
  try {
    const  connection  = await mongoose.connect(process.env.CONNECTION_STRING);

    const [checkAdmin] = await Promise.all([Admin.countDocuments()]);

    if (!checkAdmin) {
      await Admin.create({
        firstName: humanize("Dj"),
        lastName: humanize("FebricsAndFood"),
        email: "adminfreshart@gmail.com",
        password: md5("Admin@11"),
        access: "owner",
        roles: "superAdmin",
        phone: "+911111111111",
        // dob: new Date("01/01/1998").format(
        //   "YYYY-MM-DD[T00:00:00.000Z]"
        // ),
        adminId: 1,
      });
    }

    const template = await mailTemplates.countDocuments({});
    if (!template) {
      await mailTemplates.insertMany([
        {
          templateEvent: "admin-otp-verification",
          active: true,
          subject: "%head%",
          mailVariables: "%name% %email% %head% %msg% %otp%",
          htmlBody: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Admin OTP Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
          color: #333;
        }
        .container {
          background-color: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h3 {
          color: #222;
        }
        p {
          line-height: 1.6;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          color: #e60023;
          letter-spacing: 4px;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>%head%</h3>
        <p>Dear %name%,</p>
        <p>%msg%</p>
        <p>Your One-Time Password (OTP) for admin login is:</p>
        <p class="otp">%otp%</p>
        <p>This OTP is valid for a limited time. Please do not share it with anyone.</p>
        <p class="footer">
          If you did not request this login, please contact the administrator immediately.<br><br>
          Best regards,<br>
          <strong>Admin Team</strong>
        </p>
      </div>
    </body>
    </html>
  `,
          textBody:
            "Dear %name%, your OTP for admin login is %otp%. %msg% This OTP is valid for a limited time. Please do not share it with anyone.",
          isDeleted: false,
        },
      ]);
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDb;
