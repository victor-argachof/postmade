import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly transport: Transporter;
  private readonly from: string;
  constructor(config: ConfigService) {
    this.transport = nodemailer.createTransport({
      host: config.get("SMTP_HOST"),
      port: config.get<number>("SMTP_PORT"),
      secure: false,
    });
    this.from = config.getOrThrow("EMAIL_FROM");
  }
  async sendCode(email: string, code: string, purpose: string) {
    await this.transport.sendMail({
      from: this.from,
      to: email,
      subject: "Seu código Postmade",
      text: `Código para ${purpose}: ${code}. Ele expira em 10 minutos.`,
    });
  }
}
