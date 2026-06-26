require('dotenv').config();
const mongoose = require('mongoose');
const URI = process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL;
mongoose.connect(URI).then(async () => {
  const coll = mongoose.connection.db.collection('reports');
  const names = ['SIMONE BURATTI', 'TRUSTEDF57', 'infinityhotel', 'TRUSTED'];
  let total = 0;
  for (const n of names) {
    const r = await coll.deleteMany({ nombre: { $regex: n, $options: 'i' } });
    if (r.deletedCount > 0) { console.log('🗑️', n + ':', r.deletedCount); total += r.deletedCount; }
  }
  console.log('Total eliminados:', total);
  console.log('Externos:', await coll.countDocuments({ source: 'external' }));
  mongoose.disconnect();
}).catch(e => console.error(e.message));
