const mongoose = require('mongoose');
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

module.exports = User