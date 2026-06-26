const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin'], default: 'superadmin' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.statics.createSuperAdmin = async function (username, password) {
  const exists = await this.findOne({ username });
  if (exists) return exists;
  const hash = await bcrypt.hash(password, 10);
  return this.create({ username, passwordHash: hash, role: 'superadmin' });
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
