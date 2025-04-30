import nodemailer from "nodemailer";
import type { MailOptions } from "nodemailer/lib/smtp-transport";

import { environment } from "./environment.server";

export async function sendMail(
  senderUsername: string,
  senderEmailAddress: string | null,
  recipientUsername: string,
  recipientEmailAddress: string,
  text: string,
) {
  const transporter = nodemailer.createTransport({
    host: environment.email.SMTP_HOST,
    port: environment.email.SMTP_PORT,
    secure: !environment.email.USE_STARTTLS,
    auth: {
      user: environment.email.SMTP_USER,
      pass: environment.email.SMTP_PASSWORD,
    },
  });

  const mailOptions: MailOptions = {
    from: { name: "Wissenslandkarte", address: environment.email.FROM_ADDRESS },
    to: { name: recipientUsername, address: recipientEmailAddress },
    subject: "Contact request via Wissenslandkarte",
    text: `Hello ${recipientUsername}!

The user ${senderUsername} of Wissenslandkarte has asked me to relay a message. Please find it below after the --------
${
  senderEmailAddress !== null
    ? "You can contact them directly via " + senderEmailAddress + " or by replying to this email."
    : ""
}

Regards,

The ZAM-Wissenslandkarte

--------

${text}

--------

End of message.`,
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  if (senderEmailAddress !== null) {
    mailOptions["replyTo"] = {
      name: senderUsername,
      address: senderEmailAddress,
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length === 0) {
      return false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
