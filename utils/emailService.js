const nodemailer = require("nodemailer")

const createTransporter = () => {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "")
  const port = Number(process.env.EMAIL_PORT || 587)

  if (!user || !pass) {
    throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_PASS.")
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("EMAIL_PORT must be a valid TCP port.")
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

const sendMail = async (options) => {
  const transporter = createTransporter()
  try {
    return await transporter.sendMail(options)
  } catch (error) {
    if (error.code === "EAUTH" || error.responseCode === 535) {
      throw new Error(
        "Gmail rejected the SMTP credentials. Use the Gmail address as EMAIL_USER and a Google App Password as EMAIL_PASS."
      )
    }
    throw error
  } finally {
    transporter.close()
  }
}

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const info = await sendMail({
      from: `"Healery" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #b5cbb7; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Healery</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset. Click the button below to create a new password. This link is valid for 10 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </div>
            <p>If you didn't request this, please ignore this email.</p>
            <p>For security reasons, this link will expire in 10 minutes.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            &copy; ${new Date().getFullYear()} Healery. All rights reserved.
          </div>
        </div>
      `,
    })
    console.log("Password reset email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Password reset email error:", error.message)
    return { success: false, error }
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendBulkInquiryEmail: async ({ name, email, phone, company, product, quantity, message }) => {
    try {
      const to = process.env.SALES_EMAIL || process.env.EMAIL_USER
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="color:#2e2e2e">New Bulk Order Inquiry</h2>
          <p>A new bulk inquiry has been submitted.</p>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding:8px;border:1px solid #eee;">Name</td><td style="padding:8px;border:1px solid #eee;">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">Email</td><td style="padding:8px;border:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">Phone</td><td style="padding:8px;border:1px solid #eee;">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">Company</td><td style="padding:8px;border:1px solid #eee;">${company || "-"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">Product</td><td style="padding:8px;border:1px solid #eee;">${product || "-"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">Quantity</td><td style="padding:8px;border:1px solid #eee;">${quantity}</td></tr>
          </table>
          <h3 style="margin-top:16px;color:#2e2e2e">Message</h3>
          <p>${message || "-"}</p>
        </div>
      `
      await sendMail({
        from: `"Healery" <${process.env.EMAIL_USER}>`,
        to,
        subject: "New Bulk Order Inquiry",
        html,
      })
      return { success: true }
    } catch (error) {
      console.error("Bulk inquiry email error:", error.message)
      return { success: false, error }
    }
  },
}
