import nodemailer from "nodemailer"

export async function mailer(title: string, body: string) {
  const transporter = nodemailer.createTransport({
    service: "163",
    auth: {
      user: process.env.SENDER,
      pass: process.env.SENDER_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Trading-Bot" <${process.env.SENDER}>`, // sender address
    to: process.env.RECEIVER, // list of receivers
    subject: title, // Subject line
    text: body,
  })
  console.log("[email sent]")
}
