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

if (token) {
  bot = new BotConstructor(token, { polling: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.onText(/\/start(?:\s+(.+))?/, async (msg: any, match: any) => {
    const chatId: number = msg.chat.id;
    const guideId: string | undefined = match?.[1]?.trim();

    if (!guideId) {
      bot.sendMessage(chatId, "Gid ID topilmadi. Iltimos, Gid panelidan havola orqali kiring.");
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: guideId } });
      if (!user) {
        bot.sendMessage(chatId, "Gid topilmadi.");
        return;
      }
      await prisma.user.update({
        where: { id: guideId },
        data: { telegramChatId: String(chatId) },
      });

      const frontendUrl = env.frontendUrl;
      const messageText = "✅ Bildirishnomalar muvaffaqiyatli yoqildi!\n\nEndi yangi bronlar haqida shu yerga xabar keladi.";

      await bot.sendMessage(chatId, messageText, {
        reply_markup: {
          inline_keyboard: [[
            { text: "🌐 Saytga qaytish", url: frontendUrl }
          ]]
        }
      });
    } catch (err) {
      console.error("[TelegramBot] /start error:", err);
      bot.sendMessage(chatId, "Xatolik yuz berdi. Keyinroq urinib ko'\''ring.");
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
  try {
    await bot.sendMessage(Number(chatId), text);
  } catch (err) {
    console.error("[TelegramBot] sendMessage error:", err);
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
