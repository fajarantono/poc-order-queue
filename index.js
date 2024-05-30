const mysql = require('mysql');
const Bull = require('bull');
const moment = require('moment');

// Buat koneksi ke database MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'poc_order_queue',
});

// Buat antrian Bull
const orderQueue = new Bull('orderQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
  },
});

// Fungsi untuk memperbarui status orderan
function updateOrderStatus(orderId) {
  const queryUpdate = `
    UPDATE orders
    SET status = 'selesai'
    WHERE id = ?
  `;

  db.query(queryUpdate, [orderId], (err, result) => {
    if (err) throw err;
    console.log(`Updated order ${orderId} to 'selesai'`);
  });
}

// Proses pekerjaan dalam antrian
orderQueue.process((job, done) => {
  const {orderId} = job.data;
  updateOrderStatus(orderId);
  done();
});

// Tambahkan orderan baru ke antrian saat barang diterima
function addOrderToQueue(orderId, receivedDate) {
  // const dueDate = moment(receivedDate).add(2, 'days').toDate();
  const dueDate = moment(receivedDate).add(1, 'minute').toDate();
  orderQueue.add({orderId}, {delay: dueDate - new Date()});
  console.log(`Added order ${orderId} to queue with due date ${dueDate}`);
}

// Koneksi ke database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');

  // Contoh: Menambahkan orderan baru ke antrian
  // Simulasi orderan diterima pada saat ini
  const orderId = 1;
  const receivedDate = moment().format('YYYY-MM-DD HH:mm:ss');
  addOrderToQueue(orderId, receivedDate);
});
