const { Bot, Context, session, Keyboard, InlineKeyboard } = require('grammy');
const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');
const { type } = require('express/lib/response');
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define a user schema
const userSchema = new mongoose.Schema(
    {
      chat_id: String,
      fullName: String,
      phone_number: String,
      confirmationCode: String,
      confirmed: { type: Boolean, default: false }
  
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
  );
const User = mongoose.model('User', userSchema);

const token = process.env.BOT_TOKEN;
const bot = new Bot(token);

const app = express();
app.use(express.json());
const port = 3000;

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

bot.command('start', async (ctx, next) => {
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
      }
  }
  });

// valid firstname f
const isValidfullName = (firstName) => {
    return /^([A-z,',]{2,})+(\s)[A-z,',]{2,}$/.test(firstName);
};

// valid phone fuction
const isValidPhoneNumber = (phoneNumber) => {
    const regex = /^\+998([-])?([ ])?(90|91|93|94|95|98|99|33|97|71|77)([-])?([ ])?(\d{3})([-])?([ ])?(\d{2})([-])?([ ])?(\d{2})$/;
    return regex.test(phoneNumber);
};

bot.start();
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


