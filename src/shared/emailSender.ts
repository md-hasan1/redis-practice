import nodemailer from "nodemailer";
 const emailSender = async (to: string, html: string, subject: string) => {
  try {
  const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false, 
  auth: {
  user: "88803c001@smtp-brevo.com", 
  pass: "OzqM8PBhVxbNYEUt", 
  },
  })
  const mailOptions = {
  from: `<akonhasan680@gmail.com>`, 
  to, 
  subject, 
  text: html.replace(/<[^>]+>/g, ""), // Generate plain text version by stripping HTML tags
  html, // HTML email body
  }
  // Send the email
  const info = await transporter.sendMail(mailOptions)
  return info.messageId
  } catch (error) {
  throw new Error("Failed to send email. Please try again later.")
  }
  }

  export default emailSender;