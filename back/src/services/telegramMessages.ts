export type TelegramLang = 'uz' | 'en' | 'ru';

export type TelegramMessageKey =
  | 'botConnected'
  | 'newBooking'
  | 'bookingConfirmed'
  | 'bookingCancelled';

export type TelegramButtonKey = 'returnToSite' | 'confirm' | 'goToSite';

export interface TelegramMessageData {
  tourTitle?: string;
  date?: string;
  touristName?: string;
  touristPhone?: string;
  guideName?: string;
  guidePhone?: string | null;
  guideTelegram?: string | null;
}

export function normalizeLang(lang?: string | null): TelegramLang {
  if (!lang) return 'uz';
  const clean = lang.trim().toLowerCase().slice(0, 2);
  if (clean === 'en' || clean === 'ru') return clean;
  return 'uz';
}

export function getTelegramButtonText(key: TelegramButtonKey, lang?: string | null): string {
  const l = normalizeLang(lang);
  const buttons: Record<TelegramLang, Record<TelegramButtonKey, string>> = {
    uz: {
      returnToSite: '🌐 Saytga qaytish',
      confirm: '🌐 Tasdiqlash',
      goToSite: "🌐 Saytga o'tish",
    },
    en: {
      returnToSite: '🌐 Return to website',
      confirm: '🌐 Confirm',
      goToSite: '🌐 Go to website',
    },
    ru: {
      returnToSite: '🌐 Вернуться на сайт',
      confirm: '🌐 Подтвердить',
      goToSite: '🌐 Перейти на сайт',
    },
  };
  return buttons[l][key] || buttons.uz[key];
}

export function getTelegramMessage(
  key: TelegramMessageKey,
  lang?: string | null,
  data: TelegramMessageData = {}
): string {
  const l = normalizeLang(lang);

  const cleanPhone = data.guidePhone?.trim() || '';
  const cleanTelegram = data.guideTelegram?.trim()
    ? data.guideTelegram.trim().replace(/^@/, '')
    : '';

  const messages: Record<TelegramLang, Record<TelegramMessageKey, () => string>> = {
    uz: {
      botConnected: () =>
        '✅ Bildirishnomalar muvaffaqiyatli yoqildi!\n\nEndi yangi bronlar haqida shu yerga xabar keladi.',
      newBooking: () =>
        '🎉 Yangi bron!\n\n' +
        `📍 Tur: ${data.tourTitle || 'Tur'}\n` +
        `📅 Sana: ${data.date || 'Noaniq sana'}\n` +
        `👤 Turist: ${data.touristName || 'Sayohatchi'}\n` +
        `📞 Telefon: ${data.touristPhone?.trim() || 'kiritilmagan'}`,
      bookingConfirmed: () => {
        let text =
          '✅ Broningiz tasdiqlandi!\n\n' +
          `Tur: ${data.tourTitle || 'Tur'}\n` +
          `Sana: ${data.date || 'Noaniq sana'}\n` +
          `Gid: ${data.guideName || 'Gid'}`;
        if (cleanPhone) text += `\nTelefon: ${cleanPhone}`;
        if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        return text;
      },
      bookingCancelled: () => {
        let text =
          '❌ Broningiz bekor qilindi.\n\n' +
          `Tur: ${data.tourTitle || 'Tur'}\n` +
          `Sana: ${data.date || 'Noaniq sana'}`;
        if (cleanPhone || cleanTelegram) {
          text += "\n\nSavollar bo'lsa, gid bilan bog'laning:";
          if (cleanPhone) text += `\nTelefon: ${cleanPhone}`;
          if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        }
        return text;
      },
    },
    en: {
      botConnected: () =>
        '✅ Notifications enabled successfully!\n\nYou will receive updates about new bookings here.',
      newBooking: () =>
        '🎉 New booking!\n\n' +
        `📍 Tour: ${data.tourTitle || 'Tour'}\n` +
        `📅 Date: ${data.date || 'Unspecified date'}\n` +
        `👤 Tourist: ${data.touristName || 'Traveler'}\n` +
        `📞 Phone: ${data.touristPhone?.trim() || 'not specified'}`,
      bookingConfirmed: () => {
        let text =
          '✅ Your booking has been confirmed!\n\n' +
          `Tour: ${data.tourTitle || 'Tour'}\n` +
          `Date: ${data.date || 'Unspecified date'}\n` +
          `Guide: ${data.guideName || 'Guide'}`;
        if (cleanPhone) text += `\nPhone: ${cleanPhone}`;
        if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        return text;
      },
      bookingCancelled: () => {
        let text =
          '❌ Your booking has been cancelled.\n\n' +
          `Tour: ${data.tourTitle || 'Tour'}\n` +
          `Date: ${data.date || 'Unspecified date'}`;
        if (cleanPhone || cleanTelegram) {
          text += '\n\nIf you have questions, please contact the guide:';
          if (cleanPhone) text += `\nPhone: ${cleanPhone}`;
          if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        }
        return text;
      },
    },
    ru: {
      botConnected: () =>
        '✅ Уведомления успешно включены!\n\nТеперь сюда будут приходить сообщения о новых бронированиях.',
      newBooking: () =>
        '🎉 Новое бронирование!\n\n' +
        `📍 Тур: ${data.tourTitle || 'Тур'}\n` +
        `📅 Дата: ${data.date || 'Не указана'}\n` +
        `👤 Турист: ${data.touristName || 'Путешественник'}\n` +
        `📞 Телефон: ${data.touristPhone?.trim() || 'не указан'}`,
      bookingConfirmed: () => {
        let text =
          '✅ Ваше бронирование подтверждено!\n\n' +
          `Тур: ${data.tourTitle || 'Тур'}\n` +
          `Дата: ${data.date || 'Не указана'}\n` +
          `Гид: ${data.guideName || 'Гид'}`;
        if (cleanPhone) text += `\nТелефон: ${cleanPhone}`;
        if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        return text;
      },
      bookingCancelled: () => {
        let text =
          '❌ Ваше бронирование отменено.\n\n' +
          `Тур: ${data.tourTitle || 'Тур'}\n` +
          `Дата: ${data.date || 'Не указана'}`;
        if (cleanPhone || cleanTelegram) {
          text += '\n\nЕсли у вас есть вопросы, свяжитесь с гидом:';
          if (cleanPhone) text += `\nТелефон: ${cleanPhone}`;
          if (cleanTelegram) text += `\nTelegram: @${cleanTelegram}`;
        }
        return text;
      },
    },
  };

  const selectedLocale = messages[l] || messages.uz;
  const messageFn = selectedLocale[key] || messages.uz[key];
  return messageFn();
}
