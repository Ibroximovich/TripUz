// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const TelegramBotLib = require("node-telegram-bot-api");
import { env } from "../config/env";
import prisma from "../config/prisma";
import { getTelegramMessage, getTelegramButtonText, normalizeLang, TelegramLang } from "./telegramMessages";

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
function buildFrontendReplyMarkup(buttonText?: string, path: string = '') {
  const rawCandidate = (process.env.FRONTEND_URL || env.frontendUrl || env.clientUrl || '').trim();
  if (!rawCandidate) {
    return undefined;
  }

  // Agar vergul bilan bir nechta URL bo'lsa (masalan CLIENT_URL CORS ro'yxati), birinchi asosiy URL olinadi
  const singleUrl = rawCandidate.split(',')[0].trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(singleUrl);
  } catch {
    return undefined;
  }

  // Telegram faqat http va https protokollarini qabul qiladi
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return undefined;
  }

  const cleanBase = singleUrl.replace(/\/+$/, '');
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const finalUrl = `${cleanBase}${cleanPath}` || cleanBase;
  const label = (buttonText && buttonText.trim()) ? buttonText.trim() : "🌐 Saytga o'tish";

  return {
    reply_markup: {
      inline_keyboard: [[
        { text: label, url: finalUrl }
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

      const userLang = (user.language as TelegramLang) || 'uz';
      const messageText = getTelegramMessage('botConnected', userLang);

      const buttonText = getTelegramButtonText('returnToSite', userLang);
      const buttonMarkup = buildFrontendReplyMarkup(buttonText);
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
    lang?: string | null;
  }
): Promise<void> {
  if (!bot || !chatId) return;

  // 1. Gid tilini aniqlash:
  // Birinchi details.lang tekshiriladi.
  // Agar details.lang bo'lmasa yoki bo'sh bo'lsa, Prisma'dan shu chatId'ga ega Gid (User) tilini olamiz.
  let rawLang = details.lang;
  if (!rawLang) {
    try {
      const guideUser = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
        select: { language: true },
      });
      if (guideUser?.language) {
        rawLang = guideUser.language;
      }
    } catch (err) {
      console.error("[TelegramBot] Gid tilini Prisma'dan olishda xatolik:", err);
    }
  }

  const guideLang = normalizeLang(rawLang);

  // 2. Xabar matnini gid tilida olish
  const text = getTelegramMessage('newBooking', guideLang, details);

  // 3. Inline tugma matnini ham gid tilida olish ("🌐 Tasdiqlash" / "🌐 Confirm" / "🌐 Подтвердить")
  const buttonText = getTelegramButtonText('confirm', guideLang);
  const buttonMarkup = buildFrontendReplyMarkup(buttonText);
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
    lang?: string | null;
  }
): Promise<void> {
  if (!bot || !chatId) return;

  if (details.status !== 'CONFIRMED' && details.status !== 'CANCELLED') {
    return;
  }

  const userLang = (details.lang as TelegramLang) || 'uz';
  const msgKey = details.status === 'CONFIRMED' ? 'bookingConfirmed' : 'bookingCancelled';
  const text = getTelegramMessage(msgKey, userLang, details);

  const buttonText = getTelegramButtonText('goToSite', userLang);
  const buttonMarkup = buildFrontendReplyMarkup(buttonText);
  if (buttonMarkup) {
    try {
      await bot.sendMessage(Number(chatId), text, buttonMarkup);
      return;
    } catch (btnErr: any) {
      console.error("[TelegramBot] sendBookingStatusNotification with inline button failed:", btnErr?.response?.body || btnErr?.message || btnErr);
      // Inline button bilan yuborishda xatolik bo'lsa, oddiy xabar yuborish fallback'iga o'tadi
    }
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
