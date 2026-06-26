require('dotenv').config();
const m=require('mongoose');
m.connect(process.env.MONGO_PUBLIC_URL).then(async()=>{
  const c=m.connection.db.collection('reports');
  console.log('Externos:',await c.countDocuments({source:'external'}));
  console.log('Locales:',await c.countDocuments({source:'app'}));
  console.log('Total:',await c.countDocuments());
  m.disconnect();
}).catch(e=>console.error(e.message));
