const { Bot, session, Keyboard, InlineKeyboard } = require('grammy');
const mongoose = require('mongoose');
const express = require('express');
const User = require('./models/user');
const { isValidfullName, isValidPhoneNumber } = require('./utils/validation.phone-name');
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI);

const token = process.env.BOT_TOKEN;
const bot = new Bot(token);

const app = express();
app.use(express.json());
const port = +(process.env.PORT || 3000);

// Middleware to store session data
bot.use(session({
    initial: () => ({}),
}));
bot.use((ctx, next) => {
    if (ctx.message && ctx.message.sticker) {
        // If it's a sticker, do not proceed to the next middleware
        return;
    }
    return next();
});

const startKeyboard = new Keyboard()
    .requestContact("Telefon raqamni yuborish")
    .oneTime()
    .resized()

const contactWithAdmin = new InlineKeyboard().url("Admin bilan aloqa", "t.me/yorkinjonnlog")

bot.command('help', async (ctx) => {
    ctx.reply('Kurslarni olish uchun ro\'yxatdan o\'ting')
})

bot.command('start', async (ctx) => {
    ctx.session.data = {};
    ctx.session.data[ctx.chat.id] = "askPhone"; 
    const user = await User.findOne({chat_id: ctx.chat.id})
    if(!user) {
       await User.create({
            chat_id: ctx.chat.id
        })
    }
    await ctx.reply('Assalomu alaykum, \n "MFaktor onlayn" \n platformasiga hush kelibsiz', {
        reply_markup:  contactWithAdmin
    });
    
    await ctx.reply('Telefon raqamingizni yuboring:', {
        reply_markup: startKeyboard
    })
});

bot.on("message", async (ctx) => {
    const userStep = ctx.session.data[ctx.chat.id];
    if(ctx.message.contact) {
      const phoneNumber = ctx.message.contact.phone_number
      console.log()
      await User.findOneAndUpdate({ chat_id: ctx.chat.id }, {
        phone_number: phoneNumber
      })
      ctx.session.data[ctx.chat.id] = "askFullname";
      await ctx.reply('Ism va familiyangizni kiriting.\n Misol: Ibrohim Ismoilov', {
        reply_markup: {
                remove_keyboard: true
            }
        });
    } else if (userStep === "askPhone") {
        if(!ctx.message || !ctx.message.text) return;
        const phoneNumber = ctx.message.text.trim();
        if (isValidPhoneNumber(phoneNumber)) { // Regex to validate phone numbers
            ctx.session.data[ctx.chat.id] = "askName"; // Proceed to the next step
            await User.findOneAndUpdate({ chat_id: ctx.chat.id }, {
                phone_number: phoneNumber
            })
            ctx.session.data[ctx.chat.id] = "askFullname";
            ctx.reply("Ism va familiyangizni kiriting.\n Misol: Ibrohim Ismogilov", {
            reply_markup: {
                    remove_keyboard: true
                }
            });
    } else {
        ctx.reply("Iltimos to'g'ri ishlaydigan \n raqamingizni kiriting");
        }
    } else if (userStep === "askFullname") {
        if(!ctx.message || !ctx.message.text) return;
        const fullName = ctx.message.text.trim();
        if (isValidfullName(fullName)) { // Regex to validate fullName
            // Save full name and thank the user
            await User.findOneAndUpdate({ chat_id: ctx.chat.id }, {
            fullName: fullName
            })
            await ctx.reply(`Tabriklaymiz ${fullName}! \n Siz ro'yxatdan muvaffaqiyatli o'tdingiz.`);
            // Send button to open the Mini App
            await ctx.reply("Kurslarni ko'rish uchun quyidagi \n tugmani bosing:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Kurslarni ko'rish", url: 'https://ielts.org' }]
                ]
            }
            });
            //delete ctx.session.data[ctx.chat.id]; // Reset the user's state
    } else {
        ctx.reply("Iltimos ism va familiyangizni \n to'g'ri formatda kiriting \n Misol: Ibrohim Ismogilov");
    }}
});

bot.start();
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


