// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const TelegramBotLib = require("node-telegram-bot-api");
import { env } from "../config/env";
import prisma from "../config/prisma";

// node-telegram-bot-api exports a class as CJS default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BotConstructor: new (token: string, opts: any) => any = TelegramBotLib;

const token = env.telegramBotToken;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bot: any = null;

/**
 * Yordamchi funksiya: FRONTEND_URL ni tekshirib, xavfsiz inline keyboard reply_markup hosil qiladi.
 * Agar URL noto'g'ri yoki mavjud bo'lmasa, undefined qaytaradi (xavfsiz fallback).
 */
function buildFrontendReplyMarkup(buttonText: string) {
  const rawUrl = (process.env.FRONTEND_URL || env.frontendUrl || '').trim();
  const isValidHttpsUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(rawUrl);
  if (!isValidHttpsUrl) {
    return undefined;
  }
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: buttonText, url: rawUrl }
      ]]
    }
  };
}

if (token) {
  bot = new BotConstructor(token, { polling: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.onText(/\/start(?:\s+(.+))?/, async (msg: any, match: any) => {
    const chatId: number = msg.chat.id;
    const guideId: string | undefined = match?.[1]?.trim();

    if (!guideId) {
      bot.sendMessage(chatId, "Foydalanuvchi ID topilmadi. Iltimos, saytdagi havola orqali kiring.");
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: guideId } });
      if (!user) {
        bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
        return;
      }
      await prisma.user.update({
        where: { id: guideId },
        data: { telegramChatId: String(chatId) },
      });

      const messageText = "✅ Bildirishnomalar muvaffaqiyatli yoqildi!\n\nEndi yangi bronlar haqida shu yerga xabar keladi.";

      const buttonMarkup = buildFrontendReplyMarkup("🌐 Saytga qaytish");
      if (buttonMarkup) {
        try {
          await bot.sendMessage(chatId, messageText, buttonMarkup);
          return;
        } catch (btnErr: any) {
          console.error("[TelegramBot] sendMessage with inline button failed:", btnErr?.response?.body || btnErr?.message || btnErr);
          // Inline button bilan yuborishda xatolik bo'lsa, oddiy xabar yuborish fallback'iga o'tadi
        }
      }

      // Fallback: tugmasiz toza xabar yuborish
      await bot.sendMessage(chatId, messageText);
    } catch (err: any) {
      console.error("[TelegramBot] /start fatal error:", err?.response?.body || err?.stack || err);
      bot.sendMessage(chatId, "Xatolik yuz berdi. Keyinroq urinib ko'ring.");
    }
  });

  console.log("Telegram bot initialized (webhook mode)");
} else {
  console.warn("TELEGRAM_BOT_TOKEN not set - Telegram notifications disabled");
}

export function processTelegramUpdate(body: object): void {
  if (bot) bot.processUpdate(body);
}

export async function sendBookingNotification(
  chatId: string | null | undefined,
  details: {
    tourTitle: string;
    date: string;
    touristName: string;
    touristPhone: string;
  }
): Promise<void> {
  if (!bot || !chatId) return;
  const text =
    "\uD83C\uDF89 Yangi bron!\n\n" +
    `\uD83D\uDCCD Tur: ${details.tourTitle}\n` +
    `\uD83D\uDCC5 Sana: ${details.date}\n` +
    `\uD83D\uDC64 Turist: ${details.touristName}\n` +
    `\uD83D\uDCDE Telefon: ${details.touristPhone || "kiritilmagan"}`;

  const buttonMarkup = buildFrontendReplyMarkup("🌐 Tasdiqlash");
  if (buttonMarkup) {
    try {
      await bot.sendMessage(Number(chatId), text, buttonMarkup);
      return;
    } catch (btnErr: any) {
      console.error("[TelegramBot] sendBookingNotification with inline button failed:", btnErr?.response?.body || btnErr?.message || btnErr);
      // Inline button bilan yuborishda xatolik bo'lsa, oddiy xabar yuborish fallback'iga o'tadi
    }
  }

  try {
    await bot.sendMessage(Number(chatId), text);
  } catch (err) {
    console.error("[TelegramBot] sendMessage error:", err);
  }
}

export async function sendBookingStatusNotification(
  chatId: string | null | undefined,
  details: {
    status: string;
    tourTitle: string;
    date: string;
    guideName: string;
    guidePhone?: string | null;
    guideTelegram?: string | null;
  }
): Promise<void> {
  if (!bot || !chatId) return;

  const cleanPhone = details.guidePhone?.trim() || "";
  const cleanTelegram = details.guideTelegram?.trim()
    ? details.guideTelegram.trim().replace(/^@/, "")
    : "";

  let text = "";
  if (details.status === "CONFIRMED") {
    text =
      "✅ Broningiz tasdiqlandi!\n\n" +
      `Tur: ${details.tourTitle}\n` +
      `Sana: ${details.date}\n` +
      `Gid: ${details.guideName}`;

    if (cleanPhone) {
      text += `\nTelefon: ${cleanPhone}`;
    }
    if (cleanTelegram) {
      text += `\nTelegram: @${cleanTelegram}`;
    }
  } else if (details.status === "CANCELLED") {
    text =
      "❌ Broningiz bekor qilindi.\n\n" +
      `Tur: ${details.tourTitle}\n` +
      `Sana: ${details.date}`;

    if (cleanPhone || cleanTelegram) {
      text += "\n\nSavollar bo'lsa, gid bilan bog'laning:";
      if (cleanPhone) {
        text += `\nTelefon: ${cleanPhone}`;
      }
      if (cleanTelegram) {
        text += `\nTelegram: @${cleanTelegram}`;
      }
    }
  } else {
    return;
  }

  try {
    await bot.sendMessage(Number(chatId), text);
  } catch (err) {
    console.error("[TelegramBot] sendBookingStatusNotification error:", err);
  }
}

export async function setWebhook(): Promise<void> {
  if (!bot || !token) return;
  const webhookUrl = `${env.backendUrl.replace(/\/+$/, "")}/telegram-webhook`;
  try {
    await bot.setWebHook(webhookUrl);
    console.log(`Telegram webhook set: ${webhookUrl}`);
  } catch (err) {
    console.error("[TelegramBot] setWebhook error:", err);
  }
}

export { bot };
